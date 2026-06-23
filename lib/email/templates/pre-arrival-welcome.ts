/**
 * Pre-arrival welcome email — magic link to guest hub (Phase 8).
 * Location: lib/email/templates/pre-arrival-welcome.ts
 *
 * Voice: local, warm, CI script tagline — not luxury-chain tone.
 */

import { brand } from '@/lib/copy/brand';
import {
  checkInOutFactsHtml,
  propertyContactBlockHtml,
  siteBaseUrl,
  stripHtmlForText,
} from '@/lib/email/sofia-email-helpers';
import { SofiaEmailTemplateGenerator } from '@/lib/services/sofia/EmailTemplateGenerator';

export type PreArrivalWelcomeParams = {
  recipientName?: string;
  propertyName?: string;
  bookingReference?: string;
  checkInDate?: string;
  magicLinkUrl: string;
  /** Guest hub path for quotations / receipts (financial PDFs, not travel vault). */
  financialDocumentsUrl?: string;
};

export function buildPreArrivalWelcomeEmail(params: PreArrivalWelcomeParams): {
  subject: string;
  html: string;
  text: string;
} {
  const propertyName = params.propertyName || 'Hotel Etuna';
  const guestName = params.recipientName || 'Guest';
  const checkIn = params.checkInDate || 'your arrival date';
  const ref = params.bookingReference ? ` · ${params.bookingReference}` : '';

  const financialLink = params.financialDocumentsUrl
    ? `<p>Your quotation and payment documents are in the <a href="${params.financialDocumentsUrl}">Financial documents</a> section of your guest hub (separate from travel ID uploads).</p>`
    : '';

  const body = `<p>Ongwediva, ${guestName} — we are getting your room ready.</p>
<p>Your stay at <strong>${propertyName}</strong> begins <strong>${checkIn}</strong>${ref}. Tap below to open your guest hub: view your booking, upload travel documents, and message our team if you need anything before you arrive.</p>
${financialLink}
<p><em>${brand.logoTagline}</em></p>
${checkInOutFactsHtml()}
${propertyContactBlockHtml()}`;

  const gen = new SofiaEmailTemplateGenerator();
  const templateInput = {
    subject: `We are ready for you · check-in ${checkIn}`,
    body,
    recipientName: guestName,
    ctaLink: params.magicLinkUrl,
    ctaText: 'Open my guest hub',
  };

  return {
    subject: templateInput.subject,
    html: gen.generateHtmlTemplate(templateInput),
    text: gen.generateTextTemplate({
      ...templateInput,
      body: stripHtmlForText(body),
    }),
  };
}

export function buildMagicLinkUrl(rawToken: string): string {
  const base = siteBaseUrl();
  return `${base}/guest/welcome?token=${encodeURIComponent(rawToken)}`;
}
