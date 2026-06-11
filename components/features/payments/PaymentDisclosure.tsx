/**
 * PaymentDisclosure — consumer payment disclosure (PSD-3 §14.3 transparency).
 * Location: components/features/payments/PaymentDisclosure.tsx
 *
 * Shows the amount and any convenience fee SEPARATELY (not bundled) and a disputes/complaints
 * contact, so the guest sees exactly what they are charged and how to raise an issue.
 */

import { contactFormRecipient } from '@/lib/copy/contact-emails';

export interface PaymentDisclosureProps {
  amount: number;
  currency?: string;
  /** Optional convenience/processing fee shown as a separate line. */
  convenienceFee?: number;
  /** Override the complaints contact; defaults to the billing inbox. */
  complaintsEmail?: string;
  className?: string;
}

function money(value: number, currency: string): string {
  return `${currency} ${value.toFixed(2)}`;
}

export function PaymentDisclosure({
  amount,
  currency = 'NAD',
  convenienceFee = 0,
  complaintsEmail,
  className,
}: PaymentDisclosureProps) {
  const fee = Number.isFinite(convenienceFee) ? convenienceFee : 0;
  const total = amount + fee;
  const contact = complaintsEmail ?? contactFormRecipient('billing dispute');

  return (
    <div className={`rounded-2xl border border-nude-200 bg-base-100 p-4 text-sm ${className ?? ''}`}>
      <dl className="space-y-1">
        <div className="flex items-center justify-between">
          <dt className="text-nude-600">Amount</dt>
          <dd className="font-medium text-nude-900">{money(amount, currency)}</dd>
        </div>
        {fee > 0 && (
          <div className="flex items-center justify-between">
            <dt className="text-nude-600">Convenience fee</dt>
            <dd className="font-medium text-nude-900">{money(fee, currency)}</dd>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-nude-200 pt-1">
          <dt className="font-semibold text-nude-900">Total</dt>
          <dd className="font-bold text-nude-900">{money(total, currency)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-nude-500">
        Dispute or query a charge?{' '}
        <a href={`mailto:${contact}`} className="link link-primary">
          {contact}
        </a>
      </p>
    </div>
  );
}
