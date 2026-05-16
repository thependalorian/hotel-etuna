/**
 * Validate Sofia email templates — run: npx tsx scripts/validate-sofia-email-templates.ts
 */

import { EmailTemplateService } from '../lib/services/sofia/EmailTemplateService';
import { brand } from '../lib/copy/brand';

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

const cases: Array<{ name: string; tpl: { html: string; text: string; subject: string } }> = [
  {
    name: 'verification',
    tpl: svc.generateVerificationEmail({ recipientName: 'Jane Guest', otp: '123456' }),
  },
  {
    name: 'booking_confirmation',
    tpl: svc.generateBookingConfirmationEmail({
      recipientName: 'Jane Guest',
      bookingReference: 'ETU-001',
      bookingId: '00000000-0000-4000-8000-000000000001',
      checkInDate: '2026-06-01',
      checkOutDate: '2026-06-03',
    }),
  },
  {
    name: 'cancellation',
    tpl: svc.generateBookingCancellationEmail({
      recipientName: 'Jane Guest',
      bookingReference: 'ETU-001',
    }),
  },
  {
    name: 'payment_receipt',
    tpl: svc.generatePaymentReceiptEmail({
      recipientName: 'Jane Guest',
      amount: '1500.00',
      bookingReference: 'ETU-001',
      paymentMethod: 'card (Adumo)',
    }),
  },
  {
    name: 'pre_arrival',
    tpl: svc.generatePreArrivalReminderEmail({
      recipientName: 'Jane Guest',
      checkInDate: '2026-06-01',
      bookingReference: 'ETU-001',
    }),
  },
];

for (const { name, tpl } of cases) {
  assert(tpl.html.length > 200, `${name}: html too short`);
  assert(tpl.text.length > 50, `${name}: text too short`);
  assert(tpl.html.includes('Hotel Etuna'), `${name}: missing brand`);
  assert(
    tpl.html.includes(brand.tagline) || tpl.html.includes('He takes care'),
    `${name}: missing tagline`
  );
  assert(tpl.html.includes('info@hoteletuna.com'), `${name}: missing signature contact`);
  assert(tpl.html.includes('VAT 05517026-015'), `${name}: missing legal line`);
  checkAddress(tpl.html, name);
  if (name !== 'verification') {
    checkNoTours(tpl.html, name);
  }
  const needsStayLink = ['booking_confirmation', 'pre_arrival', 'check_in'].includes(name);
  if (needsStayLink) {
    assert(tpl.html.includes('guest/stays'), `${name}: missing guest stay link`);
  }
}

import fs from 'fs';

// Triggers wired (static grep-equivalent)
const lifecycle = fs.readFileSync(
  'lib/services/booking/bookingLifecycleSideEffects.ts',
  'utf8'
);
assert(lifecycle.includes('generateBookingCancellationEmail'), 'trigger: cancellation');
assert(lifecycle.includes('schedulePaymentReceiptEmail'), 'trigger: payment receipt export');
assert(
  fs.readFileSync('lib/services/payment/completeAdumoVirtualPayment.ts', 'utf8').includes(
    'schedulePaymentReceiptEmail'
  ),
  'trigger: Adumo receipt'
);
assert(
  fs.readFileSync('app/api/bookings/[id]/payment/route.ts', 'utf8').includes(
    'schedulePaymentReceiptEmail'
  ),
  'trigger: cash receipt'
);
assert(
  fs.readFileSync('lib/services/payment/HospitalityNamQrPaymentService.ts', 'utf8').includes(
    'schedulePaymentReceiptEmail'
  ),
  'trigger: NamQR desk confirm receipt'
);

if (failures.length) {
  console.error('VALIDATION FAILED:\n', failures.map((f) => `  - ${f}`).join('\n'));
  process.exit(1);
}

console.log(`✅ Sofia email validation passed (${cases.length} templates + trigger wiring)`);
