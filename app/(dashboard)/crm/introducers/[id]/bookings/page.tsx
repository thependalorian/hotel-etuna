/**
 * Introducer Bookings Report Page
 * 
 * Purpose: View all bookings attributed to an introducer
 * Location: /app/(dashboard)/crm/introducers/[id]/bookings/page.tsx
 * 
 * Features:
 * - List all bookings from introducer
 * - Commission summary
 * - Revenue breakdown
 * - Booking status filter
 * 
 * Following System Design Principles:
 * - Part 9: daisyUI tables and stats
 * - Part 11 Gap 4: Ownership verification
 * 
 * @module IntroducerBookingsPage
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
import EmptyState from '@/components/shared/EmptyState';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { apiUrl } from '@/lib/utils/api-url';

interface Booking {
  id: string;
  booking_reference: string;
  status: string;
  check_in_date: string;
  check_out_date: string;
  total_amount: string;
  commission_amount: string;
  payment_status: string;
  created_at: string;
  guest_first_name?: string;
  guest_last_name?: string;
  guest_email?: string;
}

interface BookingsData {
  introducer: {
    id: string;
    name: string;
  };
  summary: {
    total_bookings: number;
    total_revenue: number;
    total_commission: number;
    by_status: Record<string, number>;
  };
  bookings: Booking[];
}

export default function IntroducerBookingsPage() {
  const params = useParams();
  const { data: session, status } = useSession();
  const [data, setData] = useState<BookingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && params.id) {
      fetchBookings();
    }
  }, [status, params.id]);

  const fetchBookings = async () => {
    try {
      const response = await fetch(apiUrl(`/api/introducers/${params.id}/bookings`));
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      const result = await response.json();
      setData(result);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Loading bookings..." />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <ErrorDisplay 
          error={error || 'Failed to load data'} 
          title="Error Loading Bookings"
          variant="full"
        />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Card variant="elevated" className="border-semantic-warning">
          <p className="text-semantic-warning font-medium">Please log in to view bookings.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title={`Bookings: ${data.introducer.name}`}
          description="Attribution report and commission tracking"
          actions={
            <Link
              href={`/crm/introducers/${params.id}`}
              className="btn btn-outline btn-sm"
            >
              Back to Introducer
            </Link>
          }
        />

        <div className="stats shadow w-full">
          <div className="stat">
            <div className="stat-title">Total Bookings</div>
            <div className="stat-value text-2xl">{data.summary.total_bookings}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Total Revenue</div>
            <div className="stat-value text-2xl">N${data.summary.total_revenue.toFixed(2)}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Total Commission</div>
            <div className="stat-value text-2xl text-semantic-success">
              N${data.summary.total_commission.toFixed(2)}
            </div>
          </div>
        </div>

        <Card variant="elevated" className="animate-slide-up">
          {data.bookings.length === 0 ? (
            <EmptyState
              title="No Bookings Yet"
              description="No bookings have been attributed to this introducer yet."
              size="md"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Guest</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Amount</th>
                    <th>Commission</th>
                    <th>Status</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="font-mono text-sm">{booking.booking_reference}</td>
                      <td>
                        {booking.guest_first_name && booking.guest_last_name ? (
                          <div>
                            <div className="font-medium">
                              {booking.guest_first_name} {booking.guest_last_name}
                            </div>
                            {booking.guest_email && (
                              <div className="text-sm text-base-content/70">
                                {booking.guest_email}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-base-content/50">No guest</span>
                        )}
                      </td>
                      <td>{new Date(booking.check_in_date).toLocaleDateString()}</td>
                      <td>{new Date(booking.check_out_date).toLocaleDateString()}</td>
                      <td>N${parseFloat(booking.total_amount).toFixed(2)}</td>
                      <td className="text-semantic-success font-semibold">
                        N${parseFloat(booking.commission_amount || '0').toFixed(2)}
                      </td>
                      <td>
                        <span 
                          className={`badge ${
                            booking.status === 'confirmed' ? 'badge-success' :
                            booking.status === 'checked_in' ? 'badge-info' :
                            booking.status === 'checked_out' ? 'badge-neutral' :
                            booking.status === 'cancelled' ? 'badge-error' :
                            'badge-warning'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            booking.payment_status === 'paid' ? 'badge-success' :
                            booking.payment_status === 'pending' ? 'badge-warning' :
                            'badge-error'
                          }`}
                        >
                          {booking.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
