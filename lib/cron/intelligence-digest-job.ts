/**
 * Intelligence digest cron job — founder digests + optional partner weekly emails.
 * Location: lib/cron/intelligence-digest-job.ts
 */

import { db, users } from '@/lib/db';
import { and, eq, inArray, isNotNull, or, sql } from 'drizzle-orm';
import { PLATFORM_TENANT_ID } from '@/lib/auth/platform-admin';
import {
  IntelligenceReportService,
  type DigestCadence,
} from '@/lib/services/platform/IntelligenceReportService';
import { EmailTemplateService } from '@/lib/services/sofia/EmailTemplateService';
import { EmailService } from '@/lib/services/sofia/EmailService';
import { securityLogger } from '@/lib/utils/security-logger';

export type DigestJobCadence = DigestCadence | 'partner-weekly';

export type DigestJobResult = {
  cadence: DigestJobCadence;
  emailsAttempted: number;
  emailsSent: number;
  skippedNoSmtp: boolean;
  recipients: string[];
};

function founderRecipients(): string[] {
  const fromEnv = process.env.FOUNDER_DIGEST_EMAIL?.trim();
  if (fromEnv) {
    return fromEnv.split(',').map((e) => e.trim()).filter(Boolean);
  }
  return ['george@buffr.ai'];
}

async function partnerWeeklyRecipients(): Promise<Array<{ email: string; tenantId: string }>> {
  const rows = await db
    .select({
      email: users.email,
      tenantId: users.tenantId,
    })
    .from(users)
    .where(
      and(
        inArray(users.role, ['owner', 'manager']),
        eq(users.emailVerified, true),
        isNotNull(users.tenantId),
        or(
          sql`(${users.notificationPreferences}->>'email_weekly_report') = 'true'`,
          sql`(${users.notificationPreferences}->>'email_weekly_report') = '1'`,
        ),
      ),
    );
  return rows
    .filter((r) => r.email && r.tenantId)
    .map((r) => ({ email: r.email, tenantId: r.tenantId as string }));
}

export async function runIntelligenceDigestJob(
  cadence: DigestJobCadence,
  options?: { sendEmail?: boolean },
): Promise<DigestJobResult> {
  const sendEmail = options?.sendEmail !== false;
  const svc = new IntelligenceReportService();
  const templates = new EmailTemplateService();
  const emailService = new EmailService();
  const recipients: string[] = [];
  let emailsSent = 0;
  let skippedNoSmtp = false;

  if (cadence === 'partner-weekly') {
    const partners = await partnerWeeklyRecipients();
    for (const partner of partners) {
      const digest = await svc.buildPartnerWeeklyDigest(partner.tenantId);
      const plain = svc.formatDigestPlainText(digest);
      recipients.push(partner.email);
      if (!sendEmail) continue;
      try {
        const tpl = templates.generateAdminDigestEmail({
          recipientName: partner.email.split('@')[0],
          customMessage: plain.replace(/\n/g, '<br/>'),
          subject: `Weekly property summary — ${digest.windowLabel}`,
          ctaLink: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://hoteletuna.com'}/dashboard`,
          ctaText: 'Open dashboard',
        });
        await emailService.sendEmail(partner.tenantId, {
          to: partner.email,
          subject: tpl.subject,
          htmlContent: tpl.html,
          textContent: tpl.text,
          metadata: { type: 'partner_weekly_digest', cadence },
        });
        emailsSent++;
      } catch (err) {
        if (err instanceof Error && err.message.includes('SMTP')) {
          skippedNoSmtp = true;
          break;
        }
        securityLogger.warn('[intelligence-digest] partner email failed', {
          email: partner.email,
          err,
        });
      }
    }
    return {
      cadence,
      emailsAttempted: partners.length,
      emailsSent,
      skippedNoSmtp,
      recipients,
    };
  }

  const digest = await svc.buildDigest(cadence);
  const plain = svc.formatDigestPlainText(digest);
  const founder = founderRecipients();
  recipients.push(...founder);

  if (sendEmail) {
    for (const to of founder) {
      try {
        const tpl = templates.generateAdminDigestEmail({
          recipientName: 'Buffr Hub',
          customMessage: plain.replace(/\n/g, '<br/>'),
          subject: `Buffr Hub ${cadence} intelligence digest`,
          ctaLink: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://hoteletuna.com'}/admin/platform`,
          ctaText: 'Open Buffr Hub',
        });
        await emailService.sendEmail(PLATFORM_TENANT_ID, {
          to,
          subject: tpl.subject,
          htmlContent: tpl.html,
          textContent: tpl.text,
          metadata: { type: 'founder_digest', cadence },
        });
        emailsSent++;
      } catch (err) {
        if (err instanceof Error && err.message.includes('SMTP')) {
          skippedNoSmtp = true;
          break;
        }
        securityLogger.warn('[intelligence-digest] founder email failed', { to, err });
      }
    }
  }

  return {
    cadence,
    emailsAttempted: founder.length,
    emailsSent,
    skippedNoSmtp,
    recipients,
  };
}
