/**
 * PropertyVatReportPanel
 *
 * Purpose: Hub staff — Hotel Etuna hospitality VAT period totals for NamRA returns (not Buffr platform fees).
 * Location: /components/features/tax/PropertyVatReportPanel.tsx
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { brand } from '@/lib/copy/brand';
import { dashboardCopy } from '@/lib/copy/dashboard';

type VatSection = {
  lineCount: number;
  taxableGross?: number;
  grossTotal?: number;
  amountExVat: number;
  vatAmount: number;
  totalInclVat: number;
};

type PropertyVatReport = {
  period: { from: string; to: string };
  currency: string;
  profile: {
    legalName: string;
    registrationNumber: string | null;
    vatRegistered: boolean;
    vatRegistrationNumber: string | null;
    incomeTaxReference: string | null;
    pricesVatInclusive: boolean;
  };
  folioSettled: VatSection & {
    lines: Array<{
      chargeType: string;
      description: string;
      amount: number;
      settledAt: string | null;
      bookingId: string;
    }>;
  };
  paymentsReceived: VatSection & {
    lines: Array<{
      transactionReference: string;
      type: string;
      description: string | null;
      amount: number;
      processedAt: string | null;
      bookingId: string | null;
      paymentGateway: string | null;
    }>;
  };
  combinedTaxableGross: number;
  combinedVat: { amountExVat: number; vatAmount: number; totalInclVat: number };
  disclaimer: string;
};

function monthStartIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function VatTotalsBlock({
  title,
  section,
  currency,
  grossLabel,
}: {
  title: string;
  section: VatSection;
  currency: string;
  grossLabel: string;
}) {
  const gross = section.taxableGross ?? section.grossTotal ?? 0;
  return (
    <div className="rounded-lg border border-nude-200 p-4 bg-nude-50/50">
      <h3 className="text-sm font-semibold text-nude-800 mb-2">{title}</h3>
      <p className="text-xs text-nude-500 mb-3">{section.lineCount} line(s)</p>
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-nude-600">{grossLabel}</dt>
          <dd className="font-mono">
            {currency} {gross.toFixed(2)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-nude-600">Output VAT @ 15%</dt>
          <dd className="font-mono">
            {currency} {section.vatAmount.toFixed(2)}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-nude-200 pt-2 font-semibold">
          <dt>Total incl. VAT</dt>
          <dd className="font-mono">
            {currency} {section.totalInclVat.toFixed(2)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function PropertyVatReportPanel() {
  const [from, setFrom] = useState(monthStartIso);
  const [to, setTo] = useState(todayIso);
  const [report, setReport] = useState<PropertyVatReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFolioLines, setShowFolioLines] = useState(false);
  const [showPaymentLines, setShowPaymentLines] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        from: new Date(from).toISOString(),
        to: new Date(`${to}T23:59:59.999Z`).toISOString(),
      });
      const res = await fetch(`/api/reports/property-vat?${params}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Failed to load VAT report');
      }
      setReport(json.data as PropertyVatReport);
    } catch (e) {
      setReport(null);
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <p className="text-sm text-nude-600">
          This report is for <strong>{brand.name}</strong> NamRA VAT on guest room, restaurant, and
          folio supplies. It does <strong>not</strong> include platform subscription or card
          processing fees — those appear on{' '}
          <Link href="/payments/platform-billing" className="link link-primary">
            {dashboardCopy.nav.platformFees}
          </Link>
          . Full P&L and trial balance:{' '}
          <Link href="/reports/accounting" className="link link-primary">
            Bookkeeping
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-4 items-end">
          <label className="form-control w-full max-w-xs">
            <span className="label-text text-nude-700">From</span>
            <input
              type="date"
              className="input input-bordered w-full"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="form-control w-full max-w-xs">
            <span className="label-text text-nude-700">To</span>
            <input
              type="date"
              className="input input-bordered w-full"
              value={to}
              max={todayIso()}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <Button variant="primary" onClick={() => void load()} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh report'}
          </Button>
        </div>
      </Card>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {loading && !report && (
        <Card className="p-8 text-center text-nude-600">Loading property VAT report…</Card>
      )}

      {report && !loading && (
        <>
          {!report.profile.vatRegistered && (
            <div className="alert alert-warning">
              <span>
                Property VAT is not enabled. Set <code>HOTEL_ETUNA_VAT_REGISTERED=true</code> and{' '}
                <code>HOTEL_ETUNA_VAT_NUMBER</code> for folio breakdowns and this report.
              </span>
            </div>
          )}

          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-nude-900 mb-1">{report.profile.legalName}</h2>
              <div className="text-sm text-nude-600 space-y-0.5">
                {report.profile.registrationNumber && (
                  <p>BIPA / CC: {report.profile.registrationNumber}</p>
                )}
                {report.profile.incomeTaxReference && (
                  <p>Income tax (ITX): {report.profile.incomeTaxReference}</p>
                )}
                {report.profile.vatRegistrationNumber && (
                  <p>VAT: {report.profile.vatRegistrationNumber}</p>
                )}
              </div>
              <p className="text-xs text-nude-500 mt-2">
                Pricing:{' '}
                {report.profile.pricesVatInclusive ? 'VAT-inclusive (B2C)' : 'VAT-exclusive'}
              </p>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <VatTotalsBlock
                title="Folio — settled charges"
                section={report.folioSettled}
                currency={report.currency}
                grossLabel="Taxable supplies (settled)"
              />
              <VatTotalsBlock
                title="Payments received"
                section={report.paymentsReceived}
                currency={report.currency}
                grossLabel="Deposits & folio payments"
              />
            </div>

            <div className="rounded-lg border-2 border-terracotta-200 bg-terracotta-50/40 p-4">
              <h3 className="text-sm font-semibold text-terracotta-900 mb-2">
                Combined period estimate (review with accountant)
              </h3>
              <dl className="space-y-1 text-sm max-w-md">
                <div className="flex justify-between gap-4">
                  <dt className="text-nude-700">Combined gross</dt>
                  <dd className="font-mono font-medium">
                    {report.currency} {report.combinedTaxableGross.toFixed(2)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-nude-700">Combined output VAT</dt>
                  <dd className="font-mono font-medium">
                    {report.currency} {report.combinedVat.vatAmount.toFixed(2)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 font-semibold border-t border-terracotta-200 pt-2">
                  <dt>Combined incl. VAT</dt>
                  <dd className="font-mono">
                    {report.currency} {report.combinedVat.totalInclVat.toFixed(2)}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-nude-600 mt-3">
                Folio settlements and payment transactions may overlap the same stay — do not
                double-count both sections on your NamRA return without reconciliation.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFolioLines((v) => !v)}
              >
                {showFolioLines ? 'Hide' : 'Show'} folio lines
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPaymentLines((v) => !v)}
              >
                {showPaymentLines ? 'Hide' : 'Show'} payment lines
              </Button>
            </div>

            {showFolioLines && report.folioSettled.lines.length > 0 && (
              <div className="overflow-x-auto">
                <table className="table table-sm w-full text-sm">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Booking</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.folioSettled.lines.map((line, i) => (
                      <tr key={`${line.bookingId}-${i}`}>
                        <td>{line.chargeType}</td>
                        <td>{line.description}</td>
                        <td className="font-mono text-xs">{line.bookingId.slice(0, 8)}…</td>
                        <td className="text-right font-mono">
                          {report.currency} {line.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {showPaymentLines && report.paymentsReceived.lines.length > 0 && (
              <div className="overflow-x-auto">
                <table className="table table-sm w-full text-sm">
                  <thead>
                    <tr>
                      <th>Ref</th>
                      <th>Type</th>
                      <th>Gateway</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.paymentsReceived.lines.map((line) => (
                      <tr key={line.transactionReference}>
                        <td className="font-mono text-xs">{line.transactionReference}</td>
                        <td>{line.type}</td>
                        <td>{line.paymentGateway ?? '—'}</td>
                        <td className="text-right font-mono">
                          {report.currency} {line.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="text-xs text-nude-500 border-t border-nude-100 pt-4">{report.disclaimer}</p>
          </Card>
        </>
      )}
    </div>
  );
}
