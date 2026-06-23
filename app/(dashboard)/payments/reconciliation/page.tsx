/**
 * Cash Reconciliation Dashboard Page
 * 
 * Purpose: Daily cash-up interface for staff
 * Location: app/(dashboard)/payments/reconciliation/page.tsx
 * 
 * Features:
 * - Date picker for selecting day
 * - List of cash bookings
 * - Expected vs actual cash input
 * - Discrepancy tracking
 * - Submit reconciliation
 * 
 * @version 1.0.0
 * @since April 28, 2026
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ReconciliationDocumentsPanel } from '@/components/features/documents/ReconciliationDocumentsPanel';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface CashBooking {
  bookingReference: string;
  totalAmount: number;
  amountTendered: number | null;
  changeGiven: number | null;
  receiptNumber: string | null;
  paymentStatus: string;
  checkInDate: string;
}

interface ReconciliationReport {
  date: string;
  propertyId: string | null;
  shift: string;
  bookings: {
    total: number;
    paid: number;
    pending: number;
    details: CashBooking[];
  };
  amounts: {
    expectedCash: string;
    totalTendered: string;
    totalChange: string;
    netExpected: string;
  };
  reconciliation: {
    id: string;
    actualAmount: string;
    discrepancy: string;
    notes: string | null;
    staffId: string;
    createdAt: Date;
  } | null;
}

export default function CashReconciliationPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [report, setReport] = useState<ReconciliationReport | null>(null);
  const [actualAmount, setActualAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/payments/reconciliation?date=${selectedDate}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch report');
      }

      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]); // selectedDate is a dependency for fetchReport

  // Fetch report when date changes
  useEffect(() => {
    fetchReport();
  }, [selectedDate, fetchReport]); // Added fetchReport to dependencies

  // Update actual amount when report loads (if already reconciled)
  useEffect(() => {
    if (report?.reconciliation) {
      setActualAmount(report.reconciliation.actualAmount);
      setNotes(report.reconciliation.notes || '');
    } else {
      setActualAmount('');
      setNotes('');
    }
  }, [report]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/payments/reconciliation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reconciliationDate: selectedDate,
          actualAmount: parseFloat(actualAmount),
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save reconciliation');
      }

      setSuccess('Reconciliation saved successfully!');
      fetchReport(); // Refresh report
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save reconciliation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate discrepancy
  const expectedAmount = report ? parseFloat(report.amounts.netExpected) : 0;
  const actualAmountNum = parseFloat(actualAmount) || 0;
  const discrepancy = actualAmountNum - expectedAmount;
  const hasDiscrepancy = Math.abs(discrepancy) > 0.01;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Cash Reconciliation</h1>
          <p className="text-ink-600 mt-1">Daily cash-up and discrepancy tracking</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/reports/accounting">
            <Button variant="outline" size="sm">
              Bookkeeping
            </Button>
          </Link>
          <Link href="/reports/property-vat">
            <Button variant="outline" size="sm">
              Property VAT
            </Button>
          </Link>
          <Link href="/payments/desk">
            <Button variant="outline" size="sm">
              Payments desk
            </Button>
          </Link>
          <Link href="/payments/platform-billing">
            <Button variant="outline" size="sm">
              Platform fees
            </Button>
          </Link>
        </div>
      </div>

      {/* Date Selector */}
      <Card className="p-6">
        <label htmlFor="date" className="block text-sm font-medium text-ink-700 mb-2">
          Select Date
        </label>
        <input
          id="date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="px-4 py-2 border-2 border-nude-200 rounded-etuna-input focus:outline-none focus:ring-2 focus:ring-ci-primary"
        />
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-6">
          <div className="flex items-center justify-center gap-3 text-ink-600">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Loading report...
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="p-6 bg-red-50 border-2 border-red-200">
          <p className="text-red-700 font-medium">❌ {error}</p>
        </Card>
      )}

      {/* Success Message */}
      {success && (
        <Card className="p-6 bg-green-50 border-2 border-green-200">
          <p className="text-green-700 font-medium">✓ {success}</p>
        </Card>
      )}

      {/* Report */}
      {report && !isLoading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="text-sm text-ink-600 font-medium mb-1">Total Bookings</div>
              <div className="text-3xl font-bold text-ink-900">{report.bookings.total}</div>
              <div className="text-xs text-ink-500 mt-1">
                {report.bookings.paid} paid • {report.bookings.pending} pending
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-sm text-ink-600 font-medium mb-1">Expected Cash</div>
              <div className="text-3xl font-bold text-ci-accent-terracotta">
                NAD {parseFloat(report.amounts.expectedCash).toFixed(2)}
              </div>
              <div className="text-xs text-ink-500 mt-1">From paid bookings</div>
            </Card>

            <Card className="p-6">
              <div className="text-sm text-ink-600 font-medium mb-1">Total Tendered</div>
              <div className="text-3xl font-bold text-ink-700">
                NAD {parseFloat(report.amounts.totalTendered).toFixed(2)}
              </div>
              <div className="text-xs text-ink-500 mt-1">Cash received</div>
            </Card>

            <Card className="p-6">
              <div className="text-sm text-ink-600 font-medium mb-1">Change Given</div>
              <div className="text-3xl font-bold text-ink-700">
                NAD {parseFloat(report.amounts.totalChange).toFixed(2)}
              </div>
              <div className="text-xs text-ink-500 mt-1">Returned to guests</div>
            </Card>
          </div>

          {/* Cash Bookings Table */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-ink-900 mb-4">Cash Bookings</h2>
            {report.bookings.details.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-nude-200">
                      <th className="text-left py-3 px-4 font-semibold text-ink-700">Booking Ref</th>
                      <th className="text-right py-3 px-4 font-semibold text-ink-700">Total</th>
                      <th className="text-right py-3 px-4 font-semibold text-ink-700">Tendered</th>
                      <th className="text-right py-3 px-4 font-semibold text-ink-700">Change</th>
                      <th className="text-center py-3 px-4 font-semibold text-ink-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-ink-700">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.bookings.details.map((booking, index) => (
                      <tr key={index} className="border-b border-nude-100 hover:bg-nude-50">
                        <td className="py-3 px-4 font-medium">{booking.bookingReference}</td>
                        <td className="py-3 px-4 text-right">
                          NAD {booking.totalAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {booking.amountTendered 
                            ? `NAD ${booking.amountTendered.toFixed(2)}` 
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {booking.changeGiven 
                            ? `NAD ${booking.changeGiven.toFixed(2)}` 
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            booking.paymentStatus === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {booking.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-ink-600 font-mono">
                          {booking.receiptNumber || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-ink-500 text-center py-8">
                No cash bookings found for this date.
              </p>
            )}
          </Card>

          {/* Reconciliation Form */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-ink-900 mb-4">
              {report.reconciliation ? 'Update Reconciliation' : 'Submit Reconciliation'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Expected vs Actual */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Expected Amount */}
                <div className="bg-nude-50 border border-nude-200 rounded-etuna-input p-4">
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    Expected Cash in Drawer
                  </label>
                  <div className="text-3xl font-bold text-ink-900">
                    NAD {expectedAmount.toFixed(2)}
                  </div>
                  <p className="text-xs text-ink-500 mt-1">
                    Calculated from paid bookings
                  </p>
                </div>

                {/* Actual Amount Input */}
                <div>
                  <label htmlFor="actualAmount" className="block text-sm font-medium text-ink-700 mb-2">
                    Actual Cash Counted <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500">
                      NAD
                    </span>
                    <input
                      id="actualAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={actualAmount}
                      onChange={(e) => setActualAmount(e.target.value)}
                      className="w-full pl-16 pr-4 py-3 border-2 border-nude-200 rounded-etuna-input focus:outline-none focus:ring-2 focus:ring-ci-primary text-xl font-semibold"
                      placeholder="0.00"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Discrepancy Display */}
              {actualAmount && (
                <div className={`border-2 rounded-etuna-input p-4 ${
                  hasDiscrepancy
                    ? discrepancy > 0
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-red-50 border-red-200'
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink-700">Discrepancy:</span>
                    <span className={`text-2xl font-bold ${
                      hasDiscrepancy
                        ? discrepancy > 0
                          ? 'text-blue-700'
                          : 'text-red-700'
                        : 'text-green-700'
                    }`}>
                      {discrepancy > 0 ? '+' : ''}NAD {Math.abs(discrepancy).toFixed(2)}
                    </span>
                  </div>
                  {hasDiscrepancy ? (
                    <p className="text-sm mt-2">
                      {discrepancy > 0 ? (
                        <span className="text-blue-700">💰 Cash over - extra cash in drawer</span>
                      ) : (
                        <span className="text-red-700">⚠️ Cash short - missing from drawer</span>
                      )}
                    </p>
                  ) : (
                    <p className="text-sm text-green-700 mt-2">
                      ✓ Perfect match - no discrepancy
                    </p>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-ink-700 mb-2">
                  Notes {hasDiscrepancy && <span className="text-red-600">(Required for discrepancies)</span>}
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-nude-200 rounded-etuna-input focus:outline-none focus:ring-2 focus:ring-ci-primary resize-none"
                  placeholder="Explain any discrepancies or add notes about this cash-up..."
                  rows={4}
                  required={hasDiscrepancy}
                  disabled={isSubmitting}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                disabled={!actualAmount || isSubmitting || (hasDiscrepancy && !notes)}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Saving...
                  </>
                ) : report.reconciliation ? (
                  'Update Reconciliation'
                ) : (
                  'Submit Reconciliation'
                )}
              </Button>
            </form>
          </Card>
        </>
      )}

      <ReconciliationDocumentsPanel date={selectedDate} />
    </div>
  );
}
