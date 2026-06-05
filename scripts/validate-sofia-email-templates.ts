/**
 * Validate Sofia email templates — run: npm run validate:email-templates
 */

import fs from 'fs';
import { EmailTemplateService } from '../lib/services/sofia/EmailTemplateService';
import { brand } from '../lib/copy/brand';
import {
  assertEmailTemplateOutput,
  parseEmailTemplateInput,
  type SofiaEmailTemplateName,
} from '../lib/validation/sofia-email-schemas';
import { securityLogger } from '../lib/utils/security-logger';

const svc = new EmailTemplateService();
const failures: string[] = [];

function assert(cond: boolean, msg: string) {
  if (!cond) failures.push(msg);
}

function checkNoTours(html: string, label: string) {
  assert(!/cultural tours/i.test(html), `${label}: must not mention cultural tours`);
  assert(!/excursion/i.test(html), `${label}: must not mention excursions`);
}

function checkAddress(html: string, label: string) {
  assert(html.includes('5544 Valley Street'), `${label}: missing Valley Street`);
  assert(!/Valley of the Leopard/i.test(html), `${label}: wrong Leopard address`);
}

const sampleDigest =
  'Hotel Etuna digest\nOperations today\n• 2 arrivals\n• 1 NamQR pending\nPlatform health\n• 0 open tickets';

const templateCases: Array<{
  name: SofiaEmailTemplateName;
  input: Record<string, unknown>;
  build: (s: EmailTemplateService, input: Record<string, unknown>) => { html: string; text: string; subject: string };
}> = [
  {
    name: 'verification',
    input: { recipientName: 'Jane Guest', otp: '123456' },
    build: (s, i) => s.generateVerificationEmail(parseEmailTemplateInput('verification', i)),
  },
  {
    name: 'resend_otp',
    input: { recipientName: 'Jane Guest', otp: '654321' },
    build: (s, i) => s.generateResendOTPEmail(parseEmailTemplateInput('resend_otp', i)),
  },
  {
    name: 'password_reset',
    input: { recipientName: 'Jane', resetLink: 'https://hoteletuna.com/reset?token=abc' },
    build: (s, i) => s.generatePasswordResetEmail(parseEmailTemplateInput('password_reset', i)),
  },
  {
    name: 'welcome',
    input: { recipientName: 'Jane Guest' },
    build: (s, i) => s.generateWelcomeEmail(parseEmailTemplateInput('welcome', i)),
  },
  {
    name: 'booking_confirmation',
    input: {
      recipientName: 'Jane Guest',
      bookingReference: 'ETU-001',
      bookingId: '00000000-0000-4000-8000-000000000001',
      checkInDate: '2026-06-01',
      checkOutDate: '2026-06-03',
    },
    build: (s, i) => s.generateBookingConfirmationEmail(parseEmailTemplateInput('booking_confirmation', i)),
  },
  {
    name: 'booking_cancellation',
    input: { recipientName: 'Jane Guest', bookingReference: 'ETU-001' },
    build: (s, i) => s.generateBookingCancellationEmail(parseEmailTemplateInput('booking_cancellation', i)),
  },
  {
    name: 'payment_receipt',
    input: {
      recipientName: 'Jane Guest',
      amount: '1500.00',
      bookingReference: 'ETU-001',
      paymentMethod: 'card (Adumo)',
    },
    build: (s, i) => s.generatePaymentReceiptEmail(parseEmailTemplateInput('payment_receipt', i)),
  },
  {
    name: 'password_change',
    input: { recipientName: 'Jane Guest' },
    build: (s, i) => s.generatePasswordChangeNotificationEmail(parseEmailTemplateInput('password_change', i)),
  },
  {
    name: 'security_alert',
    input: { recipientName: 'Jane Guest', customMessage: 'New sign-in from Windhoek.' },
    build: (s, i) => s.generateSecurityAlertEmail(parseEmailTemplateInput('security_alert', i)),
  },
  {
    name: 'staff_invitation',
    input: {
      recipientName: 'Staff',
      invitationLink: 'https://hoteletuna.com/invite/abc',
    },
    build: (s, i) => s.generateStaffInvitationEmail(parseEmailTemplateInput('staff_invitation', i)),
  },
  {
    name: 'pre_arrival',
    input: {
      recipientName: 'Jane Guest',
      checkInDate: '2026-06-01',
      bookingReference: 'ETU-001',
      bookingId: '00000000-0000-4000-8000-000000000001',
    },
    build: (s, i) => s.generatePreArrivalReminderEmail(parseEmailTemplateInput('pre_arrival', i)),
  },
  {
    name: 'check_in',
    input: {
      recipientName: 'Jane Guest',
      bookingId: '00000000-0000-4000-8000-000000000001',
      propertyName: 'Hotel Etuna',
    },
    build: (s, i) => s.generateCheckInConfirmationEmail(parseEmailTemplateInput('check_in', i)),
  },
  {
    name: 'feedback',
    input: {
      recipientName: 'Jane Guest',
      feedbackLink: 'https://hoteletuna.com/reviews',
      propertyName: 'Hotel Etuna',
    },
    build: (s, i) => s.generateFeedbackRequestEmail(parseEmailTemplateInput('feedback', i)),
  },
  {
    name: 'notification',
    input: { customMessage: 'Your folio has been updated.' },
    build: (s, i) => s.generateNotificationEmail(parseEmailTemplateInput('notification', i)),
  },
  {
    name: 'admin_digest',
    input: {
      recipientName: 'George',
      customMessage: sampleDigest.replace(/\n/g, '<br/>'),
      subject: 'Buffr Hub daily intelligence digest',
      ctaLink: 'https://hoteletuna.com/admin/platform',
    },
    build: (s, i) => s.generateAdminDigestEmail(parseEmailTemplateInput('admin_digest', i)),
  },
];

for (const { name, input, build } of templateCases) {
  let tpl: { html: string; text: string; subject: string };
  try {
    tpl = build(svc, input);
    assertEmailTemplateOutput(tpl, name);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    continue;
  }

  assert(tpl.html.length > 200, `${name}: html too short`);
  assert(tpl.text.length > 50, `${name}: text too short`);
  assert(tpl.html.includes('Hotel Etuna'), `${name}: missing brand`);
  assert(
    tpl.html.includes(brand.tagline) || tpl.html.includes('He takes care'),
    `${name}: missing tagline`,
  );
  assert(tpl.html.includes('frontdesk@hoteletuna.com'), `${name}: missing signature contact`);
  assert(tpl.html.includes('VAT 05517026-015'), `${name}: missing legal line`);
  checkAddress(tpl.html, name);
  if (!['verification', 'resend_otp', 'password_reset', 'welcome', 'admin_digest'].includes(name)) {
    checkNoTours(tpl.html, name);
  }
  const needsStayLink = ['booking_confirmation', 'pre_arrival', 'check_in'].includes(name);
  if (needsStayLink) {
    assert(tpl.html.includes('guest/stays'), `${name}: missing guest stay link`);
  }
}

const lifecycle = fs.readFileSync('lib/services/booking/bookingLifecycleSideEffects.ts', 'utf8');
assert(lifecycle.includes('generateBookingCancellationEmail'), 'trigger: cancellation');
assert(lifecycle.includes('schedulePaymentReceiptEmail'), 'trigger: payment receipt export');
assert(
  fs.readFileSync('lib/services/payment/completeAdumoVirtualPayment.ts', 'utf8').includes(
    'schedulePaymentReceiptEmail',
  ),
  'trigger: Adumo receipt',
);
assert(
  fs.readFileSync('app/api/bookings/[id]/payment/route.ts', 'utf8').includes('schedulePaymentReceiptEmail'),
  'trigger: cash receipt',
);
assert(
  fs.readFileSync('lib/services/payment/HospitalityNamQrPaymentService.ts', 'utf8').includes(
    'schedulePaymentReceiptEmail',
  ),
  'trigger: NamQR desk confirm receipt',
);

if (failures.length) {
  securityLogger.error('VALIDATION FAILED:\n', failures.map((f) => `  - ${f}`).join('\n'));
  process.exit(1);
}

securityLogger.info(
  `✅ Sofia email validation passed (${templateCases.length} templates + Zod I/O + trigger wiring)`,
);
