/**
 * GuestFolioPaymentSection
 *
 * Purpose: Tabbed folio payment rails (card, open banking, cash) to reduce choice overload.
 * Location: /components/features/guest/GuestFolioPaymentSection.tsx
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { AdumoVirtualPaymentForm } from '@/components/payments/AdumoVirtualPaymentForm';
import { PaymentDisclosure } from '@/components/features/payments/PaymentDisclosure';
import { GuestOpenBankingPisPanel } from '@/components/features/guest/GuestOpenBankingPisPanel';
import { FolioPartialAmountField } from '@/components/features/folio/FolioPartialAmountField';
import { resolveFolioPayAmount } from '@/lib/utils/folio-pay';
import type { FolioSummary } from '@/lib/types/folio';

type PayMethod = 'card' | 'bank' | 'cash';

type GuestFolioPaymentSectionProps = {
  bookingId: string;
  folio: FolioSummary;
  busy: boolean;
  cashAmount: string;
  onCashAmountChange: (value: string) => void;
  payWithCard: boolean;
  onStartCard: () => void;
  onCash: () => void;
  onCardError: (message: string) => void;
  onFolioUpdated: () => void;
};

export function GuestFolioPaymentSection({
  bookingId,
  folio,
  busy,
  cashAmount,
  onCashAmountChange,
  payWithCard,
  onStartCard,
  onCash,
  onCardError,
  onFolioUpdated,
}: GuestFolioPaymentSectionProps) {
  const [method, setMethod] = useState<PayMethod>('card');

  const payAmount = resolveFolioPayAmount(cashAmount, folio.balanceDue);

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Payment method"
        className="tabs tabs-boxed buffr-tabs-scroll w-full"
      >
        {(
          [
            ['card', 'Card'],
            ['bank', 'Bank app'],
            ['cash', 'Cash'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={method === id}
            className={`tab rounded-full ${method === id ? 'tab-active' : ''}`}
            onClick={() => setMethod(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <FolioPartialAmountField
        label="Amount (leave empty for full balance)"
        value={cashAmount}
        onChange={onCashAmountChange}
        balanceDue={folio.balanceDue}
        currency={folio.currency}
        id="guest-folio-partial-amount"
      />

      {method === 'card' && (
        <div role="tabpanel" className="space-y-3">
          <Button
            size="sm"
            variant="outline"
            disabled={busy || payWithCard}
            onClick={onStartCard}
          >
            {payWithCard ? 'Redirecting to card payment…' : 'Continue to secure card payment'}
          </Button>
          {payWithCard && (
            <>
              <PaymentDisclosure amount={payAmount} currency={folio.currency} />
              <AdumoVirtualPaymentForm
                bookingId={bookingId}
                amount={payAmount}
                purpose="folio_settle"
                onError={onCardError}
              />
            </>
          )}
        </div>
      )}

      {method === 'cash' && (
        <div role="tabpanel" className="space-y-3">
          <p className="text-sm text-ink-600">
            Pay at reception. Staff will record cash against your folio.
          </p>
          <Button size="sm" disabled={busy} onClick={onCash}>
            Record cash payment
          </Button>
        </div>
      )}

      {method === 'bank' && (
        <div role="tabpanel">
          <GuestOpenBankingPisPanel
            bookingId={bookingId}
            balanceDue={folio.balanceDue}
            onUpdated={onFolioUpdated}
          />
        </div>
      )}
    </div>
  );
}
