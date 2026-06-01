/**
 * Introducers List Page
 * 
 * Purpose: Manage introducer partners with search and CRUD operations
 * Location: /app/(dashboard)/crm/introducers/page.tsx
 * 
 * Features:
 * - List all introducer partners
 * - Search by name or code
 * - Create new introducer
 * - Edit/view existing introducers
 * - View commission stats
 * 
 * Following System Design Principles:
 * - Part 9: daisyUI components and responsive layout
 * - Part 6: Staff-only access with withApiAuth
 * 
 * @module IntroducersListPage
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
import EmptyState from '@/components/shared/EmptyState';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { apiUrl } from '@/lib/utils/api-url';

interface Introducer {
  id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  commission_rate: string;
  is_active: boolean;
  total_bookings: number;
  total_commission_earned: string;
  created_at: string;
}

export default function IntroducersListPage() {
  const { data: session, status } = useSession();
  const [introducers, setIntroducers] = useState<Introducer[]>([]);
  const [filteredIntroducers, setFilteredIntroducers] = useState<Introducer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.tenantId) {
      fetchIntroducers();
    }
  }, [status, session?.user?.tenantId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredIntroducers(introducers);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredIntroducers(
        introducers.filter(
          (i) =>
            i.name.toLowerCase().includes(query) ||
            i.code.toLowerCase().includes(query) ||
            i.email?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, introducers]);

  const fetchIntroducers = async () => {
    try {
      const response = await fetch(apiUrl('/api/introducers'));
      if (!response.ok) {
        throw new Error('Failed to fetch introducers');
      }
      const data: Introducer[] = await response.json();
      setIntroducers(data);
      setFilteredIntroducers(data);
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
          <LoadingSpinner size="lg" text="Loading introducers..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <ErrorDisplay 
          error={error} 
          title="Error Loading Introducers"
          variant="full"
        />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Card variant="elevated" className="border-semantic-warning">
          <p className="text-semantic-warning font-medium">Please log in to view introducers.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Introducer Partners"
          description="Manage referral partners and commission tracking"
          actions={
            <Link 
              href="/crm/introducers/new" 
              className="btn btn-primary min-h-[44px] shadow-nude-soft hover:shadow-nude-medium"
            >
              Add Introducer
            </Link>
          }
        />

        <Card variant="elevated" className="animate-slide-up">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name, code, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-full max-w-md"
            />
          </div>

          {filteredIntroducers.length === 0 ? (
            <EmptyState
              title={searchQuery ? 'No Introducers Found' : 'No Introducers Yet'}
              description={
                searchQuery
                  ? 'Try adjusting your search query'
                  : 'Add your first introducer partner to start tracking referrals and commissions'
              }
              size="md"
              action={
                !searchQuery ? (
                  <Link 
                    href="/crm/introducers/new" 
                    className="btn btn-primary min-h-[44px]"
                  >
                    Add First Introducer
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Contact</th>
                    <th>Commission</th>
                    <th>Bookings</th>
                    <th>Total Earned</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIntroducers.map((introducer) => (
                    <tr key={introducer.id}>
                      <td className="font-medium">{introducer.name}</td>
                      <td>
                        <code className="badge badge-neutral">{introducer.code}</code>
                      </td>
                      <td className="text-sm">
                        {introducer.email && <div>{introducer.email}</div>}
                        {introducer.phone && <div className="text-base-content/70">{introducer.phone}</div>}
                      </td>
                      <td>{introducer.commission_rate}%</td>
                      <td>{introducer.total_bookings}</td>
                      <td>N${parseFloat(introducer.total_commission_earned).toFixed(2)}</td>
                      <td>
                        {introducer.is_active ? (
                          <span className="badge badge-success">Active</span>
                        ) : (
                          <span className="badge badge-error">Inactive</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Link
                            href={`/crm/introducers/${introducer.id}`}
                            className="btn btn-sm btn-outline"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/crm/introducers/${introducer.id}/bookings`}
                            className="btn btn-sm btn-ghost"
                          >
                            Bookings
                          </Link>
                        </div>
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
