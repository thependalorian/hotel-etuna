/**
 * Notify hub front desk + support when a WhatsApp thread is escalated to humans.
 * Location: lib/services/whatsapp/whatsapp-escalation-notify.ts
 */

import { brand } from '@/lib/copy/brand';
import { EmailService } from '@/lib/services/sofia/EmailService';
import { securityLogger } from '@/lib/utils/security-logger';
import type { WhatsappProvider } from '@/lib/services/whatsapp/tenantWhatsappLookup';

export type WhatsappEscalationNotifyInput = {
  tenantId: string;
  sessionId: string;
  guestPhone: string;
  provider: WhatsappProvider;
  lastGuestMessage: string;
};

function communicationsDeepLink(sessionId: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, '') ||
    'https://www.hoteletuna.com';
  return `${base}/communications/${encodeURIComponent(sessionId)}`;
}

export async function notifyWhatsappEscalationToHubTeam(
  input: WhatsappEscalationNotifyInput
): Promise<void> {
  const link = communicationsDeepLink(input.sessionId);
  const subject = `[Hotel Etuna] WhatsApp escalation — guest needs a team member`;
  const text = [
    `A guest WhatsApp conversation was escalated to your team.`,
    ``,
    `Provider: ${input.provider}`,
    `Guest phone: ${input.guestPhone}`,
    `Session: ${input.sessionId}`,
    ``,
    `Last message: ${input.lastGuestMessage.slice(0, 500)}`,
    ``,
    `Open thread: ${link}`,
  ].join('\n');

  const html = `<p>A guest WhatsApp conversation was escalated to your team.</p>
<ul>
<li><strong>Provider:</strong> ${input.provider}</li>
<li><strong>Guest phone:</strong> ${input.guestPhone}</li>
<li><strong>Session:</strong> ${input.sessionId}</li>
</ul>
<p><strong>Last message:</strong> ${input.lastGuestMessage.slice(0, 500).replace(/</g, '&lt;')}</p>
<p><a href="${link}">Open in Communications hub</a></p>`;

  const emailService = new EmailService();
  const recipients = [brand.emailFrontDesk, brand.emailSupport];

  for (const to of recipients) {
    try {
      await emailService.sendEmail(input.tenantId, {
        to,
        subject,
        htmlContent: html,
        textContent: text,
        metadata: {
          type: 'whatsapp_escalation',
          sessionId: input.sessionId,
          provider: input.provider,
        },
      });
    } catch (err) {
      securityLogger.error('[whatsapp-escalation-notify] email failed', { to, err });
    }
  }
}
