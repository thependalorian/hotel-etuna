/**
 * Zod schemas for Sofia EmailTemplateService inputs and outputs.
 * Location: lib/validation/sofia-email-schemas.ts
 */

import { z } from 'zod';

const baseOptions = z.object({
  recipientName: z.string().min(1).optional(),
  recipientEmail: z.string().email().optional(),
  propertyName: z.string().optional(),
  bookingReference: z.string().optional(),
  bookingId: z.string().uuid().optional(),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  amount: z.string().optional(),
  currency: z.string().optional(),
  otp: z.string().optional(),
  resetLink: z.string().url().optional(),
  invitationLink: z.string().url().optional(),
  feedbackLink: z.string().url().optional(),
  customMessage: z.string().optional(),
  subject: z.string().optional(),
  ctaLink: z.string().optional(),
  ctaText: z.string().optional(),
  paymentMethod: z.string().optional(),
});

export const emailTemplateOutputSchema = z.object({
  subject: z.string().min(5),
  html: z.string().min(200),
  text: z.string().min(50),
});

export const verificationEmailInputSchema = baseOptions.extend({
  otp: z.string().min(4).max(8),
});

export const bookingConfirmationInputSchema = baseOptions.extend({
  bookingReference: z.string().min(1),
  checkInDate: z.string().min(1),
  checkOutDate: z.string().min(1),
});

export const paymentReceiptInputSchema = baseOptions.extend({
  amount: z.string().min(1),
  bookingReference: z.string().optional(),
});

export const staffInvitationInputSchema = baseOptions.extend({
  invitationLink: z.string().url(),
});

export const passwordResetInputSchema = baseOptions.extend({
  resetLink: z.string().url(),
});

export const adminDigestInputSchema = baseOptions.extend({
  customMessage: z.string().min(20),
});

export type SofiaEmailTemplateName =
  | 'verification'
  | 'resend_otp'
  | 'password_reset'
  | 'welcome'
  | 'booking_confirmation'
  | 'booking_cancellation'
  | 'payment_receipt'
  | 'password_change'
  | 'security_alert'
  | 'staff_invitation'
  | 'pre_arrival'
  | 'check_in'
  | 'feedback'
  | 'notification'
  | 'admin_digest';

const inputSchemas: Record<SofiaEmailTemplateName, z.ZodTypeAny> = {
  verification: verificationEmailInputSchema,
  resend_otp: verificationEmailInputSchema,
  password_reset: passwordResetInputSchema,
  welcome: baseOptions,
  booking_confirmation: bookingConfirmationInputSchema,
  booking_cancellation: baseOptions.extend({ bookingReference: z.string().min(1) }),
  payment_receipt: paymentReceiptInputSchema,
  password_change: baseOptions,
  security_alert: baseOptions,
  staff_invitation: staffInvitationInputSchema,
  pre_arrival: baseOptions.extend({ checkInDate: z.string().min(1) }),
  check_in: baseOptions,
  feedback: baseOptions,
  notification: baseOptions,
  admin_digest: adminDigestInputSchema,
};

export function parseEmailTemplateInput(
  name: SofiaEmailTemplateName,
  options: unknown,
): z.infer<typeof baseOptions> {
  return inputSchemas[name].parse(options) as z.infer<typeof baseOptions>;
}

export function assertEmailTemplateOutput(
  tpl: { subject: string; html: string; text: string },
  label: string,
): void {
  const result = emailTemplateOutputSchema.safeParse(tpl);
  if (!result.success) {
    throw new Error(`${label}: invalid output — ${result.error.message}`);
  }
}
