/**
 * Shared helpers for Sofia transactional email templates.
 * Location: lib/email/sofia-email-helpers.ts
 */

import { brand } from '@/lib/copy/brand';
import { EMAIL_SIGNATURE_COLORS } from '@/lib/email/hotel-etuna-email-signature';

export const SOFIA_EMAIL_TEMPLATE_KIND = {
  VERIFICATION: 'verification',
  RESEND_OTP: 'resend_otp',
  PASSWORD_RESET: 'password_reset',
  PASSWORD_CHANGED: 'password_changed',
  WELCOME: 'welcome',
  BOOKING_CONFIRMATION: 'booking_confirmation',
  BOOKING_CANCELLATION: 'booking_cancellation',
  PAYMENT_RECEIPT: 'payment_receipt',
  SECURITY_ALERT: 'security_alert',
  STAFF_INVITATION: 'staff_invitation',
  PRE_ARRIVAL: 'pre_arrival',
  CHECK_IN: 'check_in',
  FEEDBACK: 'feedback',
  NOTIFICATION: 'notification',
  SOFIA_AUTO: 'sofia_auto',
} as const;

export type SofiaEmailTemplateKind =
  (typeof SOFIA_EMAIL_TEMPLATE_KIND)[keyof typeof SOFIA_EMAIL_TEMPLATE_KIND];

export function siteBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    'https://hoteletuna.com';
  return base.replace(/\/$/, '');
}

export function guestStaysUrl(bookingId?: string): string {
  const base = siteBaseUrl();
  return bookingId ? `${base}/guest/stays/${bookingId}` : `${base}/guest/stays`;
}

export function firstName(fullName?: string): string {
  if (!fullName?.trim()) return 'Guest';
  return fullName.trim().split(/\s+/)[0] ?? 'Guest';
}

/** Styled OTP / code block (allowed through body HTML sanitizer) */
export function otpCodeHtml(code: string): string {
  const c = EMAIL_SIGNATURE_COLORS;
  return `<strong style="font-size: 28px; letter-spacing: 6px; color: ${c.terracotta800}; display: block; text-align: center; padding: 20px; background-color: ${c.nude50}; border-radius: 8px; margin: 20px 0; border: 1px solid ${c.nude200};">${code}</strong>`;
}

export function propertyContactBlockHtml(): string {
  return `<p style="margin-top: 16px; font-size: 14px; line-height: 1.5;">
<strong>Hotel Etuna</strong><br>
${brand.address}<br>
${brand.phones.replace(' | ', ' · ')}<br>
<a href="mailto:${brand.email}" style="color: ${EMAIL_SIGNATURE_COLORS.khaki600};">${brand.email}</a>
</p>`;
}

export function checkInOutFactsHtml(): string {
  return `<p style="font-size: 14px; color: ${EMAIL_SIGNATURE_COLORS.nude800};">
${brand.proofPoints.checkIn}<br>
Breakfast 07:00–10:00 · Restaurant &amp; bar 10:00–22:00<br>
${brand.proofPoints.shuttle}
</p>`;
}

export function stripHtmlForText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
