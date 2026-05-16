/**
 * Sofia email templates — transactional HTML + plain text for Hotel Etuna guests & staff.
 * Location: lib/services/sofia/EmailTemplateService.ts
 *
 * All templates use SofiaEmailTemplateGenerator + lib/email/hotel-etuna-email-signature.ts.
 * Triggers: see bookingLifecycleSideEffects, auth routes, SofiaConciergeService.
 */

import { brand } from '@/lib/copy/brand';
import {
  checkInOutFactsHtml,
  guestStaysUrl,
  otpCodeHtml,
  propertyContactBlockHtml,
  siteBaseUrl,
  stripHtmlForText,
} from '@/lib/email/sofia-email-helpers';
import { SofiaEmailTemplateGenerator } from './EmailTemplateGenerator';

export interface EmailTemplateOptions {
  recipientName?: string;
  recipientEmail?: string;
  propertyName?: string;
  bookingReference?: string;
  bookingId?: string;
  checkInDate?: string;
  checkOutDate?: string;
  amount?: string;
  currency?: string;
  otp?: string;
  resetLink?: string;
  invitationLink?: string;
  feedbackLink?: string;
  customMessage?: string;
  subject?: string;
  ctaLink?: string;
  ctaText?: string;
  paymentMethod?: string;
  [key: string]: unknown;
}

type WrappedTemplate = { subject: string; html: string; text: string };

export class EmailTemplateService {
  private templateGenerator = new SofiaEmailTemplateGenerator();

  private wrap(
    options: EmailTemplateOptions,
    params: {
      subject: string;
      body: string;
      ctaLink?: string;
      ctaText?: string;
      compactSignature?: boolean;
    }
  ): WrappedTemplate {
    const gen = {
      subject: params.subject,
      body: params.body,
      recipientName: options.recipientName,
      ctaLink: params.ctaLink,
      ctaText: params.ctaText,
      compactSignature: params.compactSignature,
    };
    return {
      subject: params.subject,
      html: this.templateGenerator.generateHtmlTemplate(gen),
      text: this.templateGenerator.generateTextTemplate({
        ...gen,
        body: stripHtmlForText(params.body),
      }),
    };
  }

  generateVerificationEmail(options: EmailTemplateOptions): WrappedTemplate {
    const otp = options.otp || '000000';
    const body = `<p>Thank you for creating your Hotel Etuna account. Use this code to verify your email (expires in 15 minutes):</p>
${otpCodeHtml(otp)}
<p>If you did not create this account, you can ignore this email.</p>`;

    return this.wrap(options, {
      subject: 'Verify your Hotel Etuna account',
      body,
      compactSignature: true,
    });
  }

  generateResendOTPEmail(options: EmailTemplateOptions): WrappedTemplate {
    const otp = options.otp || '000000';
    const body = `<p>Here is your new verification code (expires in 15 minutes):</p>
${otpCodeHtml(otp)}
<p>If you did not request this code, you can ignore this email.</p>`;

    return this.wrap(options, {
      subject: 'Your new Hotel Etuna verification code',
      body,
      compactSignature: true,
    });
  }

  generatePasswordResetEmail(options: EmailTemplateOptions): WrappedTemplate {
    const resetLink = options.resetLink || '#';
    const body = `<p>We received a request to reset your Hotel Etuna password. This link expires in one hour.</p>
<p>If you did not request a reset, ignore this email or contact us at ${brand.email}.</p>`;

    return this.wrap(options, {
      subject: 'Reset your Hotel Etuna password',
      body,
      ctaLink: resetLink,
      ctaText: 'Reset password',
      compactSignature: true,
    });
  }

  generateWelcomeEmail(options: EmailTemplateOptions): WrappedTemplate {
    const body = `<p>Your email is verified — welcome to Hotel Etuna.</p>
<p>You can now view rates, book stays, manage your guest folio when checked in, and chat with Sofia for local tips and property questions.</p>
<p>${brand.proofPoints.loyalty}</p>`;

    return this.wrap(options, {
      subject: 'Welcome to Hotel Etuna',
      body,
      ctaLink: `${siteBaseUrl()}/rooms`,
      ctaText: 'Browse rooms',
    });
  }

  generateBookingConfirmationEmail(options: EmailTemplateOptions): WrappedTemplate {
    const propertyName = options.propertyName || 'Hotel Etuna';
    const bookingRef = options.bookingReference || 'N/A';
    const checkIn = options.checkInDate || 'TBD';
    const checkOut = options.checkOutDate || 'TBD';
    const amount = options.amount || '';
    const currency = options.currency || 'NAD';
    const amountLine =
      amount && Number(amount) > 0
        ? `<li><strong>Total:</strong> ${currency} ${amount}</li>`
        : '';

    const body = `<p>Your stay at <strong>${propertyName}</strong> is confirmed.</p>
<ul style="padding-left: 18px; line-height: 1.6;">
<li><strong>Reference:</strong> ${bookingRef}</li>
<li><strong>Check-in:</strong> ${checkIn}</li>
<li><strong>Check-out:</strong> ${checkOut}</li>
${amountLine}
</ul>
${checkInOutFactsHtml()}
<p>View your booking and folio anytime after you sign in:</p>`;

    return this.wrap(options, {
      subject: `Booking confirmed · ${bookingRef}`,
      body,
      ctaLink: guestStaysUrl(options.bookingId),
      ctaText: 'View my stay',
    });
  }

  generateBookingCancellationEmail(options: EmailTemplateOptions): WrappedTemplate {
    const bookingRef = options.bookingReference || 'N/A';
    const propertyName = options.propertyName || 'Hotel Etuna';
    const note =
      options.customMessage ||
      'If this was a mistake or you would like to rebook, reply to this email or call us.';

    const body = `<p>Your booking at <strong>${propertyName}</strong> has been cancelled.</p>
<p><strong>Reference:</strong> ${bookingRef}</p>
<p>${note}</p>
${propertyContactBlockHtml()}`;

    return this.wrap(options, {
      subject: `Booking cancelled · ${bookingRef}`,
      body,
    });
  }

  generatePaymentReceiptEmail(options: EmailTemplateOptions): WrappedTemplate {
    const amount = options.amount || '0';
    const currency = options.currency || 'NAD';
    const bookingRef = options.bookingReference || 'N/A';
    const method = options.paymentMethod || 'payment';
    const paidOn = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const body = `<p>Thank you — we received your ${method}.</p>
<ul style="padding-left: 18px;">
<li><strong>Booking reference:</strong> ${bookingRef}</li>
<li><strong>Amount:</strong> ${currency} ${amount}</li>
<li><strong>Date:</strong> ${paidOn}</li>
</ul>
<p>Please keep this email for your records.</p>`;

    return this.wrap(options, {
      subject: `Payment receipt · ${currency} ${amount}`,
      body,
    });
  }

  generatePasswordChangeNotificationEmail(options: EmailTemplateOptions): WrappedTemplate {
    const timestamp = new Date().toLocaleString('en-GB');
    const body = `<p>Your Hotel Etuna password was changed on ${timestamp}.</p>
<p><strong>If this was not you,</strong> contact us immediately at ${brand.email}.</p>`;

    return this.wrap(options, {
      subject: 'Your Hotel Etuna password was changed',
      body,
      compactSignature: true,
    });
  }

  generateSecurityAlertEmail(options: EmailTemplateOptions): WrappedTemplate {
    const alertType = options.customMessage || 'unusual sign-in activity';
    const timestamp = new Date().toLocaleString('en-GB');
    const body = `<p>We noticed ${alertType} on your account at ${timestamp}.</p>
<p>If this was you, no action is needed. Otherwise, change your password and contact ${brand.email}.</p>`;

    return this.wrap(options, {
      subject: 'Security alert · Hotel Etuna account',
      body,
      ctaLink: `${siteBaseUrl()}/settings`,
      ctaText: 'Account settings',
      compactSignature: true,
    });
  }

  generateStaffInvitationEmail(options: EmailTemplateOptions): WrappedTemplate {
    const propertyName = options.propertyName || 'Hotel Etuna';
    const invitationLink = options.invitationLink || '#';
    const body = `<p>You have been invited to join <strong>${propertyName}</strong> on Hotel Etuna as staff.</p>
<p>Use the button below to accept and set up your account.</p>`;

    return this.wrap(options, {
      subject: `Staff invitation · ${propertyName}`,
      body,
      ctaLink: invitationLink,
      ctaText: 'Accept invitation',
    });
  }

  generatePreArrivalReminderEmail(options: EmailTemplateOptions): WrappedTemplate {
    const propertyName = options.propertyName || 'Hotel Etuna';
    const checkIn = options.checkInDate || 'tomorrow';
    const bookingRef = options.bookingReference || '';

    const body = `<p>We look forward to welcoming you to <strong>${propertyName}</strong>.</p>
<p><strong>Check-in:</strong> ${checkIn}${bookingRef ? ` · Reference <strong>${bookingRef}</strong>` : ''}</p>
${checkInOutFactsHtml()}
<p>Reply to this email if you have special requests or a late arrival.</p>`;

    return this.wrap(options, {
      subject: `See you soon · check-in ${checkIn}`,
      body,
      ctaLink: guestStaysUrl(options.bookingId),
      ctaText: 'View stay details',
    });
  }

  generateCheckInConfirmationEmail(options: EmailTemplateOptions): WrappedTemplate {
    const propertyName = options.propertyName || 'Hotel Etuna';
    const body = `<p>Welcome — you are checked in at <strong>${propertyName}</strong>.</p>
<p>During your stay you can order room service (when checked in), view your folio, and ask Sofia in the chat for anything you need.</p>
${checkInOutFactsHtml()}`;

    return this.wrap(options, {
      subject: `Welcome · you are checked in`,
      body,
      ctaLink: guestStaysUrl(options.bookingId),
      ctaText: 'Open guest folio',
    });
  }

  generateFeedbackRequestEmail(options: EmailTemplateOptions): WrappedTemplate {
    const propertyName = options.propertyName || 'Hotel Etuna';
    const feedbackLink = options.feedbackLink || `${siteBaseUrl()}/reviews`;
    const body = `<p>Thank you for staying with us at <strong>${propertyName}</strong>.</p>
<p>Your feedback helps our team improve. It only takes a minute.</p>`;

    return this.wrap(options, {
      subject: `How was your stay at ${propertyName}?`,
      body,
      ctaLink: feedbackLink,
      ctaText: 'Leave feedback',
    });
  }

  generateNotificationEmail(options: EmailTemplateOptions): WrappedTemplate {
    const message = options.customMessage || 'You have an update from Hotel Etuna.';
    const body = `<p>${message}</p>`;

    return this.wrap(options, {
      subject: options.subject || 'Message from Hotel Etuna',
      body,
      ctaLink: options.ctaLink,
      ctaText: options.ctaText || 'View details',
    });
  }
}
