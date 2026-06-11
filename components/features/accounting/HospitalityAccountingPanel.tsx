/**
 * HospitalityAccountingPanel
 *
 * Purpose: Namibia bookkeeping — trial balance, P&L, cash summary from PMS (Libby / RWJJ).
 * Location: /components/features/accounting/HospitalityAccountingPanel.tsx
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { GlPeriodCloseCard } from '@/components/features/accounting/GlPeriodCloseCard';
import { JournalEntryTable } from '@/components/features/accounting/JournalEntryTable';
import type { JournalLine } from '@/lib/domain/accounting/types';

type AccountingReport = {
  period: { from: string; to: string };
  currency: string;
  entity: {
    legalName: string;
    ccNumber: string;
    vatNumber: string | null;
    incomeTaxReference: string | null;
  };
  journalLineCount: number;
  incomeStatement: {
    roomRevenueExVat: number;
    conferenceRevenueExVat: number;
    campsiteRevenueExVat: number;
    fnbRevenueExVat: number;
    otherRevenueExVat: number;
    totalRevenueExVat: number;
    vatOutput: number;
    platformFeesExVat: number;
    netIncomeBeforeTax: number;
    estimatedIncomeTaxProvision: number;
    netIncomeAfterTax: number;
  };
  operatingCashFlow: {
    cashCollectedFromGuests: number;
    platformFeesAccrued: number;
    netCashFromOperations: number;
  };
  trialBalance: Array<{
    accountCode: string;
    accountName: string;
    debitTotal: number;
    creditTotal: number;
    balance: number;
  }>;
  disclaimer: string;
};

function monthStartIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function HospitalityAccountingPanel() {
  const [from, setFrom] = useState(monthStartIso);
  const [to, setTo] = useState(todayIso);
  const [report, setReport] = useState<AccountingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTb, setShowTb] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [journalLines, setJournalLines] = useState<JournalLine[]>([]);
  const [journalLoading, setJournalLoading] = useState(false);

  const loadJournalLines = useCallback(async () => {
    setJournalLoading(true);
    try {
      const params = new URLSearchParams({
        from: new Date(from).toISOString(),
        to: new Date(`${to}T23:59:59.999Z`).toISOString(),
      });
      const res = await fetch(`/api/reports/accounting/journal-lines?${params}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || 'Failed to load journal lines');
      setJournalLines((json.data?.lines as JournalLine[]) ?? []);
    } catch {
      setJournalLines([]);
    } finally {
      setJournalLoading(false);
    }
  }, [from, to]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        from: new Date(from).toISOString(),
        to: new Date(`${to}T23:59:59.999Z`).toISOString(),
      });
      const res = await fetch(`/api/reports/accounting/summary?${params}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || 'Failed to load accounting report');
      setReport(json.data as AccountingReport);
      void loadJournalLines();
    } catch (e) {
      setReport(null);
      setJournalLines([]);
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [from, to, loadJournalLines]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/properties', { credentials: 'include' });
        const json = await res.json();
        if (!res.ok) return;
        const list = (json.data ?? json.properties ?? []) as Array<{ id: string }>;
        if (list[0]?.id) setPropertyId(list[0].id);
      } catch {
        /* property optional for read-only report */
      }
    })();
  }, []);

  const c = report?.currency ?? 'NAD';
  const is = report?.incomeStatement;

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <p className="text-sm text-nude-600">
          Bookkeeping pack for <strong>{report?.entity.legalName ?? 'Hotel Etuna'}</strong> (BIPA{' '}
          {report?.entity.ccNumber ?? 'CC/2011/3890'}). Revenue on <strong>settled folio</strong>{' '}
          lines; VAT for NamRA; separate from{' '}
          <Link href="/reports/property-vat" className="link link-primary">
            Property VAT report
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
            {loading ? 'Loading…' : 'Refresh'}
          </Button>
        </div>
      </Card>

      <GlPeriodCloseCard
        propertyId={propertyId}
        periodEnd={to}
        onClosed={() => void load()}
      />

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {loading && !report && (
        <Card className="p-8 text-center text-nude-600">Loading bookkeeping report…</Card>
      )}

      {report && is && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-nude-900 mb-3">Income statement (P&L)</h2>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between gap-4">
                  <dt>Room revenue (ex VAT)</dt>
                  <dd className="font-mono">
                    {c} {is.roomRevenueExVat.toFixed(2)}
                  </dd>
                </div>
                {(is.conferenceRevenueExVat ?? 0) > 0 && (
                  <div className="flex justify-between gap-4">
                    <dt>Conference revenue (ex VAT)</dt>
                    <dd className="font-mono">
                      {c} {(is.conferenceRevenueExVat ?? 0).toFixed(2)}
                    </dd>
                  </div>
                )}
                {(is.campsiteRevenueExVat ?? 0) > 0 && (
                  <div className="flex justify-between gap-4">
                    <dt>Campsite revenue (ex VAT)</dt>
                    <dd className="font-mono">
                      {c} {(is.campsiteRevenueExVat ?? 0).toFixed(2)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt>F&B revenue (ex VAT)</dt>
                  <dd className="font-mono">
                    {c} {is.fnbRevenueExVat.toFixed(2)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 font-medium border-t border-nude-200 pt-2">
                  <dt>Total revenue (ex VAT)</dt>
                  <dd className="font-mono">
                    {c} {is.totalRevenueExVat.toFixed(2)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>VAT output (NamRA)</dt>
                  <dd className="font-mono">
                    {c} {is.vatOutput.toFixed(2)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Platform fees (ex VAT)</dt>
                  <dd className="font-mono">
                    ({c} {is.platformFeesExVat.toFixed(2)})
                  </dd>
                </div>
                <div className="flex justify-between gap-4 font-semibold border-t border-nude-200 pt-2">
                  <dt>Net income (before tax)</dt>
                  <dd className="font-mono">
                    {c} {is.netIncomeBeforeTax.toFixed(2)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 text-nude-600">
                  <dt>Est. income tax @ 30%</dt>
                  <dd className="font-mono">
                    ({c} {is.estimatedIncomeTaxProvision.toFixed(2)})
                  </dd>
                </div>
                <div className="flex justify-between gap-4 font-semibold">
                  <dt>Net income (after tax)</dt>
                  <dd className="font-mono">
                    {c} {is.netIncomeAfterTax.toFixed(2)}
                  </dd>
                </div>
              </dl>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-nude-900 mb-3">Operating cash (simplified)</h2>
              <p className="text-xs text-nude-500 mb-3">RWJJ Ch.6 — guest collections vs platform fees</p>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt>Cash from guests</dt>
                  <dd className="font-mono">
                    {c} {report.operatingCashFlow.cashCollectedFromGuests.toFixed(2)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Platform fees accrued</dt>
                  <dd className="font-mono">
                    ({c} {report.operatingCashFlow.platformFeesAccrued.toFixed(2)})
                  </dd>
                </div>
                <div className="flex justify-between gap-4 font-semibold border-t border-nude-200 pt-2">
                  <dt>Net cash from operations</dt>
                  <dd className="font-mono">
                    {c} {report.operatingCashFlow.netCashFromOperations.toFixed(2)}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-nude-500 mt-4">
                {report.journalLineCount} journal lines · ITX {report.entity.incomeTaxReference ?? '—'}{' '}
                · VAT {report.entity.vatNumber ?? '—'}
              </p>
            </Card>
          </div>

          <Button variant="outline" size="sm" onClick={() => setShowTb((v) => !v)}>
            {showTb ? 'Hide' : 'Show'} trial balance
          </Button>

          <JournalEntryTable
            lines={journalLines}
            currency={c}
            loading={journalLoading}
            periodLabel={`${from}_to_${to}`}
          />

          {showTb && report.trialBalance.length > 0 && (
            <Card className="p-4 overflow-x-auto">
              <table className="table table-sm w-full text-sm">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Account</th>
                    <th className="text-right">Debit</th>
                    <th className="text-right">Credit</th>
                    <th className="text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {report.trialBalance.map((row) => (
                    <tr key={row.accountCode}>
                      <td className="font-mono">{row.accountCode}</td>
                      <td>{row.accountName}</td>
                      <td className="text-right font-mono">{row.debitTotal.toFixed(2)}</td>
                      <td className="text-right font-mono">{row.creditTotal.toFixed(2)}</td>
                      <td className="text-right font-mono">{row.balance.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          <p className="text-xs text-nude-500">{report.disclaimer}</p>
        </>
      )}
    </div>
  );
}
