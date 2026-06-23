#!/usr/bin/env npx tsx
/**
 * Static wiring validator — guest financial PDF system (migration 0064).
 * Location: scripts/validate-document-wiring.ts
 * Usage: npm run validate:document-wiring
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { securityLogger } from '@/lib/utils/security-logger';

const ROOT = process.cwd();
const failures: string[] = [];

function mustExist(rel: string, label?: string): void {
  const full = join(ROOT, rel);
  if (!existsSync(full)) {
    failures.push(label ?? `Missing file: ${rel}`);
  }
}

function mustInclude(rel: string, needle: string | RegExp, label: string): void {
  const full = join(ROOT, rel);
  if (!existsSync(full)) {
    failures.push(`Missing file for check: ${rel}`);
    return;
  }
  const src = readFileSync(full, 'utf8');
  const ok = typeof needle === 'string' ? src.includes(needle) : needle.test(src);
  if (!ok) failures.push(label);
}

// Schema & migration
mustExist('database/drizzle/0064_generated_documents.sql');
mustInclude('database/drizzle/meta/_journal.json', '0064_generated_documents', 'journal: 0064');
mustInclude('scripts/db/verify-neon-migrations.ts', '0064', 'verify-neon-migrations: 0064');
mustInclude('lib/db/schema.ts', 'generatedDocuments', 'schema: generatedDocuments');

// Core service & templates
mustExist('lib/services/documents/DocumentGenerationService.ts');
mustExist('lib/services/documents/documentLifecycleHooks.ts');
mustExist('lib/services/documents/guestDocumentEmailRouting.ts');
for (const tpl of ['QuotationPDF', 'InvoicePDF', 'ReceiptPDF', 'PaymentNotificationPDF']) {
  mustExist(`components/features/documents/${tpl}.tsx`);
}

// APIs (Node runtime for react-pdf)
for (const route of [
  'app/api/documents/generate/route.ts',
  'app/api/documents/route.ts',
  'app/api/documents/[id]/download/route.ts',
  'app/api/guest/stays/[bookingId]/financial-documents/route.ts',
]) {
  mustExist(route);
  mustInclude(route, "runtime = 'nodejs'", `${route}: nodejs runtime`);
}

mustInclude('app/api/documents/generate/route.ts', 'withApiAuth', 'generate: withApiAuth');
mustInclude(
  'app/api/guest/stays/[bookingId]/financial-documents/route.ts',
  'assertStayAccess',
  'guest financial-documents: assertStayAccess'
);

// Lifecycle hooks
mustInclude('lib/services/booking/bookingLifecycleSideEffects.ts', 'scheduleQuotationPdfEmail', 'booking create: quotation PDF');
mustInclude(
  'lib/services/booking/bookingLifecycleSideEffects.ts',
  'schedulePaymentDocumentEmails',
  'receipt hook: PDF emails'
);
mustInclude('lib/services/folio/FolioService.ts', 'scheduleInvoicePdfEmail', 'folio close: invoice PDF');
mustInclude('lib/services/sofia/EmailService.ts', 'attachments', 'EmailService: attachments');

// Payment paths → transactionId
const receiptEmailPaths = [
  'app/api/bookings/[id]/payment/route.ts',
  'lib/services/payment/ManualPaymentService.ts',
  'lib/services/payment/paymentOutbox.ts',
];
for (const p of receiptEmailPaths) {
  mustInclude(p, 'schedulePaymentReceiptEmail', `${p}: schedulePaymentReceiptEmail`);
  mustInclude(p, 'transactionId', `${p}: transactionId passed`);
}
mustInclude(
  'lib/services/payment/completeAdumoVirtualPayment.ts',
  'enqueuePaymentOutboxEvent',
  'Adumo: receipt outbox enqueue'
);
mustInclude(
  'lib/services/payment/completeAdumoVirtualPayment.ts',
  'transactionId',
  'Adumo: transactionId in outbox payload'
);

// Sofia & inbox
mustInclude('lib/workflows/sofiaToolGraph.ts', 'resendGuestDocument', 'Sofia: resendGuestDocument tool');
mustInclude('lib/cron/email-inbox-monitor.ts', 'tryFulfillGuestDocumentEmailRequest', 'inbox: document routing');
mustInclude('lib/email/templates/pre-arrival-welcome.ts', 'financialDocumentsUrl', 'pre-arrival: financial docs link');

// UI surfaces
mustInclude('app/(dashboard)/bookings/[id]/page.tsx', 'BookingDocumentsSection', 'booking detail: documents section');
mustInclude('app/guest/stays/[bookingId]/page.tsx', 'GuestFinancialDocumentsCard', 'guest stay: financial card');
mustInclude('app/(dashboard)/payments/desk/page.tsx', '#documents', 'payments desk: documents link');
mustInclude('app/(dashboard)/payments/reconciliation/page.tsx', 'ReconciliationDocumentsPanel', 'reconciliation: documents panel');
mustInclude('app/(dashboard)/reports/accounting/page.tsx', 'AccountingDocumentsWidget', 'accounting: documents widget');

// Tests
mustExist('tests/unit/namibia-document-tax.test.ts');
mustExist('tests/unit/document-reference-generator.test.ts');
mustExist('tests/integration/documents-generation.test.ts');
mustExist('tests/integration/documents-guest-api.test.ts');
mustExist('tests/integration/documents-lifecycle-email.test.ts');

// Tax alignment
mustInclude('lib/services/tax/PropertyVatService.ts', 'accommodationNtbLevy', 'PropertyVatService: NTB levy');
mustInclude('lib/platform/namibia-tax.ts', 'NAMIBIA_NTB_TOURISM_LEVY_PERCENT', 'namibia-tax: NTB constant');

if (failures.length) {
  securityLogger.error('Document wiring validation FAILED:\n', failures.map((f) => `  - ${f}`).join('\n'));
  process.exit(1);
}

securityLogger.info('✅ Guest financial PDF wiring validated');
