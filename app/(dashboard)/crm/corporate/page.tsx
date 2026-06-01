/**
 * Corporate Accounts List Page
 * 
 * Purpose: Manage corporate B2B accounts for bill-to-company bookings
 * Location: /app/(dashboard)/crm/corporate/page.tsx
 * 
 * Features:
 * - List all corporate accounts
 * - Search by company name
 * - Create new account
 * - View account details and balance
 * 
 * Agent A7 - Corporate Billing Feature
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

interface CorporateAccount {
  id: string;
  company_name: string;
  company_registration?: string;
  vat_number?: string;
  billing_email?: string;
  billing_phone?: string;
  payment_terms_days: number;
  credit_limit: string;
  current_balance: string;
  account_status: string;
  created_at: string;
}

export default function CorporateAccountsListPage() {
  const { data: session, status } = useSession();
  const [accounts, setAccounts] = useState<CorporateAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<CorporateAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.tenantId) {
      fetchAccounts();
    }
  }, [status, session?.user?.tenantId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAccounts(accounts);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredAccounts(
        accounts.filter(
          (a) =>
            a.company_name.toLowerCase().includes(query) ||
            a.company_registration?.toLowerCase().includes(query) ||
            a.billing_email?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, accounts]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch(apiUrl('/api/corporate/accounts'));
      if (!response.ok) {
        throw new Error('Failed to fetch corporate accounts');
      }
      const data: CorporateAccount[] = await response.json();
      setAccounts(data);
      setFilteredAccounts(data);
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
          <LoadingSpinner size="lg" text="Loading corporate accounts..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <ErrorDisplay message={error} onRetry={fetchAccounts} />
      </div>
    );
  }

  const activeAccounts = filteredAccounts.filter((a) => a.account_status === 'active');
  const totalCreditLimit = accounts.reduce((sum, a) => sum + parseFloat(a.credit_limit), 0);
  const totalBalance = accounts.reduce((sum, a) => sum + parseFloat(a.current_balance), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <PageHeader
        title="Corporate Accounts"
        description="Manage B2B corporate accounts for bill-to-company bookings"
        action={
          <Link href="/crm/corporate/new" className="btn btn-primary">
            + Add Corporate Account
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-base-content/60">Active Accounts</div>
          <div className="text-2xl font-semibold">{activeAccounts.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-base-content/60">Total Credit Limit</div>
          <div className="text-2xl font-semibold">N${totalCreditLimit.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-base-content/60">Current AR Balance</div>
          <div className="text-2xl font-semibold">N${totalBalance.toLocaleString()}</div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4 mb-6">
        <input
          type="text"
          placeholder="Search by company name, registration, or email..."
          className="input input-bordered w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Card>

      {/* Accounts List */}
      {filteredAccounts.length === 0 ? (
        <EmptyState
          title="No corporate accounts found"
          description={
            searchQuery
              ? 'Try adjusting your search query'
              : 'Create your first corporate account to enable bill-to-company bookings'
          }
          action={
            !searchQuery && (
              <Link href="/crm/corporate/new" className="btn btn-primary">
                + Add Corporate Account
              </Link>
            )
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Company</th>
                <th>Registration</th>
                <th>Contact</th>
                <th>Payment Terms</th>
                <th>Credit Limit</th>
                <th>Current Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr key={account.id}>
                  <td>
                    <div className="font-semibold">{account.company_name}</div>
                    {account.vat_number && (
                      <div className="text-sm text-base-content/60">
                        VAT: {account.vat_number}
                      </div>
                    )}
                  </td>
                  <td>{account.company_registration || '—'}</td>
                  <td>
                    {account.billing_email && (
                      <div className="text-sm">{account.billing_email}</div>
                    )}
                    {account.billing_phone && (
                      <div className="text-sm text-base-content/60">
                        {account.billing_phone}
                      </div>
                    )}
                  </td>
                  <td>{account.payment_terms_days} days</td>
                  <td>N${parseFloat(account.credit_limit).toLocaleString()}</td>
                  <td>
                    <span
                      className={
                        parseFloat(account.current_balance) > 0
                          ? 'text-warning font-semibold'
                          : ''
                      }
                    >
                      N${parseFloat(account.current_balance).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        account.account_status === 'active'
                          ? 'badge-success'
                          : 'badge-error'
                      }`}
                    >
                      {account.account_status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <Link
                        href={`/crm/corporate/${account.id}`}
                        className="btn btn-sm btn-ghost"
                      >
                        View
                      </Link>
                      <Link
                        href={`/crm/corporate/${account.id}/bookings`}
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
    </div>
  );
}
