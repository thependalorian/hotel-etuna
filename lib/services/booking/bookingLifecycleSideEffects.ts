/**
 * Booking lifecycle hooks — transactional email + CRM outreach audit (non-blocking)
 *
 * Purpose: Fire confirmation, check-in reminders (via cron), and post-stay follow-ups around booking milestones.
 * Location: lib/services/booking/bookingLifecycleSideEffects.ts
 */

import { db } from '@/lib/db';
import { bookings, guests, properties, sofiaEmailLogs } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import type { Booking } from '@/lib/db/schema';
import { EmailService } from '@/lib/services/sofia/EmailService';
import { EmailTemplateService } from '@/lib/services/sofia/EmailTemplateService';
import { CrmOutreachService } from '@/lib/services/crm/CrmOutreachService';
import { FolioService } from '@/lib/services/folio/FolioService';
import { securityLogger } from '@/lib/utils/security-logger';
import {
  isAccommodationBookingKind,
  isFacilityBookingKind,
} from '@/lib/bookings/booking-kind';

const emailService = new EmailService();
const folioService = new FolioService();
const bookingEmailTemplates = new EmailTemplateService();
const outreach = new CrmOutreachService();

function fire(fn: () => Promise<void>): void {
  void fn().catch((err) => securityLogger.error('[bookingLifecycleSideEffects]', err));
}

async function loadGuestAndPropertyEmails(
  tenantId: string,
  guestId: string,
  propertyId: string | null
): Promise<{ guestEmail: string | null; guestName: string; propertyName: string }> {
  const [g] = await db
    .select({
      email: guests.email,
      firstName: guests.firstName,
      lastName: guests.lastName,
    })
    .from(guests)
    .where(and(eq(guests.id, guestId), eq(guests.tenantId, tenantId)))
    .limit(1);

  const guestEmail = g?.email?.trim() ?? null;
  const guestName = [g?.firstName, g?.lastName].filter(Boolean).join(' ').trim() || 'Guest';

  let propertyName = 'Hotel Etuna';
  if (propertyId) {
    const [p] = await db
      .select({ name: properties.name })
      .from(properties)
      .where(and(eq(properties.id, propertyId), eq(properties.tenantId, tenantId)))
      .limit(1);
    if (p?.name) propertyName = p.name;
  }

  return { guestEmail, guestName, propertyName };
}

async function outreachLog(opts: {
  tenantId: string;
  guestId: string;
  propertyId: string | null;
  campaignKey: string;
  subject: string;
  body: string;
}) {
  await outreach.logTouch({
    tenantId: opts.tenantId,
    guestId: opts.guestId,
    propertyId: opts.propertyId,
    channel: 'lifecycle',
    campaignKey: opts.campaignKey,
    messageSubject: opts.subject,
    messageBody: opts.body,
    status: 'sent',
    sentAt: new Date(),
    workflowStage: 'booking_lifecycle',
    metadata: {
      source: 'booking_lifecycle',
      transactional: true,
      campaignKey: opts.campaignKey,
    },
  });
}

export function scheduleBookingCreatedEffects(input: {
  tenantId: string;
  bookingId: string;
  guestId: string;
  propertyId: string | null;
  bookingReference: string;
  checkInDate: string;
  checkOutDate: string;
  bookingKind?: string | null;
}): void {
  fire(async () => {
    const { guestEmail, guestName, propertyName } = await loadGuestAndPropertyEmails(
      input.tenantId,
      input.guestId,
      input.propertyId
    );
    if (!guestEmail) return;

    const kind = input.bookingKind ?? 'accommodation';
    const tpl = isFacilityBookingKind(kind)
      ? bookingEmailTemplates.generateBookingConfirmationEmail({
          recipientName: guestName,
          propertyName,
          bookingReference: input.bookingReference,
          bookingId: input.bookingId,
          checkInDate: input.checkInDate,
          checkOutDate: input.checkOutDate,
          customMessage:
            kind === 'conference'
              ? `Your conference hall session is confirmed for ${input.checkInDate} (08:00–17:00).`
              : `Your campsite reservation is confirmed from ${input.checkInDate} to ${input.checkOutDate}.`,
        })
      : bookingEmailTemplates.generateBookingConfirmationEmail({
          recipientName: guestName,
          propertyName,
          bookingReference: input.bookingReference,
          bookingId: input.bookingId,
          checkInDate: input.checkInDate,
          checkOutDate: input.checkOutDate,
        });

    await emailService.sendEmail(input.tenantId, {
      to: guestEmail,
      subject: tpl.subject,
      htmlContent: tpl.html,
      textContent: tpl.text,
      propertyId: input.propertyId ?? undefined,
      metadata: { emailKind: 'booking_confirmation' as const, bookingId: input.bookingId },
    });

    await outreachLog({
      tenantId: input.tenantId,
      guestId: input.guestId,
      propertyId: input.propertyId,
      campaignKey: 'booking_confirmed_email',
      subject: tpl.subject,
      body: tpl.text,
    });
  });
}

export function scheduleBookingTransitionEffects(input: {
  tenantId: string;
  booking: Booking;
  previousStatus: string | null | undefined;
  nextStatus: string;
}): void {
  fire(async () => {
    const { tenantId, booking, previousStatus, nextStatus } = input;
    if (!booking.guestId || !booking.propertyId) return;

    const prev = (previousStatus ?? '').toLowerCase().trim();
    const next = nextStatus.toLowerCase().trim();

    if (next === 'confirmed' && prev === 'pending') {
      scheduleBookingCreatedEffects({
        tenantId,
        bookingId: booking.id,
        guestId: booking.guestId,
        propertyId: booking.propertyId,
        bookingReference: booking.bookingReference ?? booking.id.slice(0, 8),
        checkInDate: String(booking.checkInDate),
        checkOutDate: String(booking.checkOutDate),
        bookingKind: booking.bookingKind,
      });
      return;
    }

    if (!isAccommodationBookingKind(booking.bookingKind)) {
      return;
    }

    if (next === 'checked_in' && prev !== 'checked_in') {
      const { guestEmail, guestName, propertyName } = await loadGuestAndPropertyEmails(
        tenantId,
        booking.guestId,
        booking.propertyId
      );
      if (!guestEmail) return;

      const tpl = bookingEmailTemplates.generateCheckInConfirmationEmail({
        recipientName: guestName,
        propertyName,
        bookingId: booking.id,
        checkInDate: String(booking.checkInDate),
      });

      await emailService.sendEmail(tenantId, {
        to: guestEmail,
        subject: tpl.subject,
        htmlContent: tpl.html,
        textContent: tpl.text,
        propertyId: booking.propertyId,
        metadata: { emailKind: 'check_in_welcome' as const, bookingId: booking.id },
      });

      await outreachLog({
        tenantId,
        guestId: booking.guestId,
        propertyId: booking.propertyId,
        campaignKey: 'booking_checked_in_email',
        subject: tpl.subject,
        body: tpl.text,
      });
      return;
    }

    if (next === 'cancelled' && prev !== 'cancelled') {
      const { guestEmail, guestName, propertyName } = await loadGuestAndPropertyEmails(
        tenantId,
        booking.guestId,
        booking.propertyId
      );
      if (guestEmail) {
        const tpl = bookingEmailTemplates.generateBookingCancellationEmail({
          recipientName: guestName,
          propertyName,
          bookingReference: booking.bookingReference ?? booking.id.slice(0, 8),
          bookingId: booking.id,
        });

        await emailService.sendEmail(tenantId, {
          to: guestEmail,
          subject: tpl.subject,
          htmlContent: tpl.html,
          textContent: tpl.text,
          propertyId: booking.propertyId,
          metadata: { emailKind: 'booking_cancelled' as const, bookingId: booking.id },
        });

        await outreachLog({
          tenantId,
          guestId: booking.guestId,
          propertyId: booking.propertyId,
          campaignKey: 'booking_cancelled_email',
          subject: tpl.subject,
          body: tpl.text,
        });
      }
      return;
    }

    if (next === 'checked_out' && prev !== 'checked_out') {
      try {
        const folio = await folioService.getFolio(booking.id);
        if (folio.balanceDue > 0 && !folio.folioClosedAt) {
          securityLogger.warn(
            '[bookingLifecycleSideEffects] checked_out with open folio',
            { bookingId: booking.id, balanceDue: folio.balanceDue, currency: folio.currency }
          );
        }
      } catch (folioErr) {
        securityLogger.error('[bookingLifecycleSideEffects] folio check on checkout:', folioErr);
      }

      const { guestEmail, guestName, propertyName } = await loadGuestAndPropertyEmails(
        tenantId,
        booking.guestId,
        booking.propertyId
      );
      if (!guestEmail) return;

      const siteBase =
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
        process.env.NEXTAUTH_URL?.replace(/\/$/, '') ??
        'https://hoteletuna.com';
      const feedbackLink = `${siteBase}/reviews`;

      const tpl = bookingEmailTemplates.generateFeedbackRequestEmail({
        recipientName: guestName,
        propertyName,
        bookingId: booking.id,
        feedbackLink,
      });

      await emailService.sendEmail(tenantId, {
        to: guestEmail,
        subject: tpl.subject,
        htmlContent: tpl.html,
        textContent: tpl.text,
        propertyId: booking.propertyId,
        metadata: { emailKind: 'post_stay_thank_you' as const, bookingId: booking.id },
      });

      await outreachLog({
        tenantId,
        guestId: booking.guestId,
        propertyId: booking.propertyId,
        campaignKey: 'booking_checked_out_feedback',
        subject: tpl.subject,
        body: tpl.text,
      });
    }
  });
}

async function checkInReminderAlreadySent(tenantId: string, bookingId: string): Promise<boolean> {
  const found = await db
    .select({ id: sofiaEmailLogs.id })
    .from(sofiaEmailLogs)
    .where(
      and(
        eq(sofiaEmailLogs.tenantId, tenantId),
        sql`(${sofiaEmailLogs.metadata}->>'emailKind') = 'check_in_reminder'`,
        sql`(${sofiaEmailLogs.metadata}->>'bookingId') = ${bookingId}`
      )
    )
    .limit(1);
  return found.length > 0;
}

/**
 * Cron: reminders for arrivals exactly tomorrow (runs daily). Idempotent via `sofia_email_logs.metadata`.
 */
export async function runCheckInReminderJob(): Promise<{ sent: number; skipped: number }> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().slice(0, 10);

  const due = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.checkInDate, dateStr),
        eq(bookings.status, 'confirmed'),
        sql`(booking_kind IS NULL OR booking_kind = 'accommodation')`
      )
    );

  let sent = 0;
  let skipped = 0;

  for (const b of due) {
    if (!b.guestId || !b.propertyId || !b.tenantId) {
      skipped++;
      continue;
    }
    if (await checkInReminderAlreadySent(b.tenantId, b.id)) {
      skipped++;
      continue;
    }

    const { guestEmail, guestName, propertyName } = await loadGuestAndPropertyEmails(
      b.tenantId,
      b.guestId,
      b.propertyId
    );
    if (!guestEmail) {
      skipped++;
      continue;
    }

    const tpl = bookingEmailTemplates.generatePreArrivalReminderEmail({
      recipientName: guestName,
      propertyName,
      bookingId: b.id,
      checkInDate: dateStr,
      bookingReference: b.bookingReference ?? b.id.slice(0, 8),
    });

    await emailService.sendEmail(b.tenantId, {
      to: guestEmail,
      subject: tpl.subject,
      htmlContent: tpl.html,
      textContent: tpl.text,
      propertyId: b.propertyId,
      metadata: { emailKind: 'check_in_reminder' as const, bookingId: b.id },
    });

    await outreachLog({
      tenantId: b.tenantId,
      guestId: b.guestId,
      propertyId: b.propertyId,
      campaignKey: 'booking_pre_arrival_reminder',
      subject: tpl.subject,
      body: tpl.text,
    });

    sent++;
  }

  return { sent, skipped };
}

/** Fire-and-forget payment receipt after card, cash, or NamQR settlement. */
export function schedulePaymentReceiptEmail(input: {
  tenantId: string;
  bookingId: string;
  guestId: string;
  propertyId: string | null;
  amount: number;
  currency?: string;
  paymentMethod: string;
  bookingReference?: string;
}): void {
  fire(async () => {
    const { guestEmail, guestName, propertyName } = await loadGuestAndPropertyEmails(
      input.tenantId,
      input.guestId,
      input.propertyId
    );
    if (!guestEmail) return;

    const tpl = bookingEmailTemplates.generatePaymentReceiptEmail({
      recipientName: guestName,
      propertyName,
      bookingReference: input.bookingReference,
      bookingId: input.bookingId,
      amount: input.amount.toFixed(2),
      currency: input.currency ?? 'NAD',
      paymentMethod: input.paymentMethod,
    });

    await emailService.sendEmail(input.tenantId, {
      to: guestEmail,
      subject: tpl.subject,
      htmlContent: tpl.html,
      textContent: tpl.text,
      propertyId: input.propertyId ?? undefined,
      metadata: {
        emailKind: 'payment_receipt' as const,
        bookingId: input.bookingId,
        paymentMethod: input.paymentMethod,
      },
    });

    await outreachLog({
      tenantId: input.tenantId,
      guestId: input.guestId,
      propertyId: input.propertyId,
      campaignKey: 'payment_receipt_email',
      subject: tpl.subject,
      body: tpl.text,
    });
  });
}