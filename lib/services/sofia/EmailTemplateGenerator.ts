/**
 * @fileoverview SofiaEmailTemplateGenerator — branded HTML/plain-text email rendering.
 *
 * Builds sanitized (DOMPurify) Hotel Etuna emails with the standard signature
 * for Sofia AI and transactional flows.
 * Location: lib/services/sofia/EmailTemplateGenerator.ts
 */
import DOMPurify from 'isomorphic-dompurify';
import { EMAIL_SIGNATURE_COLORS } from '@/lib/email/hotel-etuna-email-signature';
import {
  getHotelEtunaEmailSignatureHtml,
  getHotelEtunaEmailSignaturePlainText,
} from '@/lib/email/hotel-etuna-email-signature';
import { brand } from '@/lib/copy/brand';
import { firstName } from '@/lib/email/sofia-email-helpers';

export interface EmailTemplateData {
  subject: string;
  body: string;
  recipientName?: string;
  ctaLink?: string;
  ctaText?: string;
  /** Shorter footer for OTP / security emails */
  compactSignature?: boolean;
}

export class SofiaEmailTemplateGenerator {
  private sanitizePlain(value: string): string {
    return DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });
  }

  private sanitizeBodyHtml(value: string): string {
    return DOMPurify.sanitize(value, {
      ALLOWED_TAGS: ['strong', 'br', 'p', 'a', 'ul', 'li'],
      ALLOWED_ATTR: ['style', 'href', 'class'],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i,
    });
  }

  private sanitizeUrl(url?: string): string | undefined {
    if (!url) return undefined;
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.toString();
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  generateHtmlTemplate(data: EmailTemplateData): string {
    const safeSubject = this.sanitizePlain(data.subject);
    const safeBody = this.sanitizeBodyHtml(data.body);
    const safeCtaText = this.sanitizePlain(data.ctaText || 'View details');
    const safeCtaLink = this.sanitizeUrl(data.ctaLink);
    const c = EMAIL_SIGNATURE_COLORS;
    const greetingName = firstName(data.recipientName);
    const greeting = `Dear ${this.sanitizePlain(greetingName)},`;

    const signature = getHotelEtunaEmailSignatureHtml({
      includeSocial: !data.compactSignature,
      includeAmenities: !data.compactSignature,
      includeLogo: true,
    });

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${safeSubject}</title>
          <style>
              body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: ${c.nude800}; margin: 0; padding: 0; background-color: #f5f0eb; }
              .container { max-width: 600px; margin: 20px auto; padding: 0; border: 1px solid ${c.nude200}; border-radius: 8px; overflow: hidden; background-color: #ffffff; }
              .header { background-color: ${c.logoRustic}; color: ${c.logoCream}; padding: 16px 20px; text-align: center; }
              .header h1 { margin: 0 0 4px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
              .header .tagline { margin: 0; font-size: 13px; font-style: italic; opacity: 0.95; }
              .content { padding: 24px 20px; color: ${c.nude800}; font-size: 15px; }
              .content p { margin: 0 0 14px 0; }
              .button { display: inline-block; background-color: ${c.logoRustic}; color: ${c.logoCream} !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 8px; }
              .sign-off { margin-top: 20px; color: ${c.nude800}; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>${brand.name}</h1>
                  <p class="tagline">“${this.sanitizePlain(brand.tagline)}”</p>
              </div>
              <div class="content">
                  <p>${greeting}</p>
                  ${safeBody}
                  ${safeCtaLink ? `<p><a href="${safeCtaLink}" class="button">${safeCtaText}</a></p>` : ''}
                  <p class="sign-off">Thank you for choosing Hotel Etuna.</p>
                  <p class="sign-off">Warm regards,<br><strong>Sofia</strong> · Hotel Etuna concierge</p>
              </div>
              ${signature}
          </div>
      </body>
      </html>
    `.trim();
  }

  generateTextTemplate(data: EmailTemplateData): string {
    const greetingName = firstName(data.recipientName);
    const cleanBody = data.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const cleanCtaText = (data.ctaText || 'View details').replace(/<[^>]*>/g, '').trim();
    const safeCtaLink = this.sanitizeUrl(data.ctaLink);

    let text = `Dear ${greetingName},

${cleanBody}
`;
    if (safeCtaLink) {
      text += `
${cleanCtaText}: ${safeCtaLink}
`;
    }
    text += `
Thank you for choosing Hotel Etuna.

Warm regards,
Sofia · Hotel Etuna concierge

${getHotelEtunaEmailSignaturePlainText({
  includeSocial: !data.compactSignature,
  includeAmenities: !data.compactSignature,
})}
`;
    return text;
  }
}
