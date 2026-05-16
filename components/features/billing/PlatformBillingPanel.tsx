/**
 * PlatformBillingPanel
 *
 * Purpose: Hub staff view — settlement accounts, fee accruals, Buffr monthly invoices.
 * Location: /components/features/billing/PlatformBillingPanel.tsx
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { SettlementBankProfile } from '@/lib/platform/settlement-accounts';

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  subtotal: string;
  vatAmount?: string | null;
  vatRatePercent?: string | null;
  total: string;
  currency: string;
  documentType?: string | null;
  paidAt?: string | null;
};

type BillingPayload = {
  invoices: InvoiceRow[];
  accrualSummary: { transactionCount: number; feeTotal: number; grossTotal: number };
  schedule: {
    cardProcessingPercent: number;
    cardProcessingFixedNad: number;
    monthlySubscriptionNad: number;
  };
  yearMonth: string;
};

export function PlatformBillingPanel() {
  const [profiles, setProfiles] = useState<SettlementBankProfile[]>([]);
  const [billing, setBilling] = useState<BillingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [invoiceMonth, setInvoiceMonth] = useState('');
  const [payRef, setPayRef] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [settlementRes, invoiceRes] = await Promise.all([
        fetch('/api/platform/billing/settlement', { credentials: 'include' }),
        fetch('/api/platform/billing/invoices', { credentials: 'include' }),
      ]);
      const settlementJson = await settlementRes.json();
      const invoiceJson = await invoiceRes.json();
      if (settlementRes.ok) {
        setProfiles(settlementJson.data?.profiles ?? []);
      }
      if (invoiceRes.ok) {
        const data = invoiceJson.data as BillingPayload;
        setBilling(data);
        setInvoiceMonth(data.yearMonth);
      } else {
        throw new Error(invoiceJson?.error?.message || 'Failed to load billing');
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const generateInvoice = async () => {
    if (!invoiceMonth) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/platform/billing/invoices', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yearMonth: invoiceMonth }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || 'Generate failed');
      setMessage(`Draft invoice ${json.data.invoiceNumber} created (NAD ${json.data.total})`);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Generate failed');
    } finally {
      setBusy(false);
    }
  };

  const patchInvoice = async (action: 'issue' | 'mark_paid') => {
    if (!selectedInvoiceId) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/platform/billing/invoices/${selectedInvoiceId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          paymentReference: action === 'mark_paid' ? payRef : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || 'Update failed');
      setMessage(action === 'issue' ? 'Invoice issued' : 'Invoice marked paid');
      setPayRef('');
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="skeleton h-48 w-full rounded-xl" aria-hidden />;
  }

  return (
    <div className="space-y-6">
      <Card variant="elevated" className="p-6">
        <h2 className="font-display text-xl font-bold text-nude-900 mb-2">
          Settlement accounts
        </h2>
        <p className="text-sm text-nude-600 mb-4">
          Guest card revenue targets the property account. Platform fees are invoiced monthly to
          Buffr Financial Services.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {profiles.map((p) => (
            <div
              key={p.profileKey}
              className="rounded-lg border border-nude-200 bg-nude-50 p-4 text-sm"
            >
              <p className="font-semibold text-nude-900 capitalize">{p.party} account</p>
              <p className="text-nude-700 mt-1">{p.legalName}</p>
              <p className="text-nude-600">{p.bankName}</p>
              <p className="font-mono mt-2">{p.accountNumber}</p>
              <p className="text-nude-500">
                Branch {p.branchCode} · {p.swiftCode}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {billing && (
        <Card variant="elevated" className="p-6">
          <h2 className="font-display text-xl font-bold text-nude-900 mb-2">
            Fee schedule &amp; accruals
          </h2>
          <ul className="text-sm text-nude-700 space-y-1 mb-4">
            <li>
              Card processing: {billing.schedule.cardProcessingPercent}% + NAD{' '}
              {billing.schedule.cardProcessingFixedNad.toFixed(2)} per transaction
            </li>
            <li>
              Monthly subscription: NAD {billing.schedule.monthlySubscriptionNad.toFixed(2)}
            </li>
            <li>
              Accrued this month ({billing.yearMonth}): {billing.accrualSummary.transactionCount}{' '}
              card tx · NAD {billing.accrualSummary.feeTotal.toFixed(2)} fees on NAD{' '}
              {billing.accrualSummary.grossTotal.toFixed(2)} gross
            </li>
          </ul>

          <div className="flex flex-wrap gap-3 items-end mb-6">
            <label className="form-control">
              <span className="label-text text-sm">Invoice period (YYYY-MM)</span>
              <input
                type="month"
                className="input input-bordered"
                value={invoiceMonth}
                onChange={(e) => setInvoiceMonth(e.target.value)}
              />
            </label>
            <Button disabled={busy} onClick={() => void generateInvoice()}>
              Generate draft invoice
            </Button>
          </div>

          <h3 className="font-semibold text-nude-900 mb-2">Invoices</h3>
          {billing.invoices.length === 0 ? (
            <p className="text-sm text-nude-600">No platform invoices yet.</p>
          ) : (
            <ul className="divide-y divide-nude-200 text-sm">
              {billing.invoices.map((inv) => (
                <li key={inv.id} className="py-3 flex flex-wrap justify-between gap-2 items-center">
                  <div>
                    <p className="font-mono font-medium">{inv.invoiceNumber}</p>
                    <p className="text-nude-600">
                      {inv.periodStart} → {inv.periodEnd} ·{' '}
                      <span className="badge badge-outline capitalize">{inv.status}</span>
                      {inv.documentType === 'tax_invoice' && (
                        <span className="badge badge-primary ml-1">Tax invoice</span>
                      )}
                    </p>
                    {Number(inv.vatAmount ?? 0) > 0 && (
                      <p className="text-xs text-nude-500 mt-1">
                        Ex VAT {inv.currency} {Number(inv.subtotal).toFixed(2)} + VAT{' '}
                        {inv.vatRatePercent}% = {inv.currency}{' '}
                        {Number(inv.vatAmount).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {inv.currency} {Number(inv.total).toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedInvoiceId(inv.id)}
                    >
                      Select
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {selectedInvoiceId && (
            <div className="mt-4 pt-4 border-t border-nude-200 flex flex-wrap gap-2 items-end">
              <Button size="sm" disabled={busy} onClick={() => void patchInvoice('issue')}>
                Issue invoice
              </Button>
              <input
                type="text"
                className="input input-bordered input-sm"
                placeholder="EFT reference"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={busy || !payRef.trim()}
                onClick={() => void patchInvoice('mark_paid')}
              >
                Mark paid
              </Button>
            </div>
          )}
        </Card>
      )}

      {message && (
        <div className="alert alert-info">
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
