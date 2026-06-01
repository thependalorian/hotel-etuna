/**
 * Loyalty Transactions Ledger Page
 * 
 * Purpose: Staff view of all loyalty earn/burn events
 * Location: /app/(dashboard)/crm/loyalty/transactions/page.tsx
 * 
 * Features:
 * - View all transactions across guests
 * - Filter by guest, type, date range
 * - Summary statistics
 * 
 * @module LoyaltyTransactionsPage
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
import EmptyState from '@/components/shared/EmptyState';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { apiUrl } from '@/lib/utils/api-url';

interface LoyaltyTransaction {
  id: string;
  guestId: string;
  guestName: string | null;
  guestEmail: string | null;
  transactionType: string;
  pointsDelta: number;
  pointsBefore: number;
  pointsAfter: number;
  description: string;
  bookingId: string | null;
  createdAt: string;
}

interface TransactionSummary {
  totalTransactions: number;
  totalEarned: number;
  totalBurned: number;
  netPoints: number;
}

export default function LoyaltyTransactionsPage() {
  const { data: session, status } = useSession();
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary>({
    totalTransactions: 0,
    totalEarned: 0,
    totalBurned: 0,
    netPoints: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTransactions();
    }
  }, [status, filterType]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const typeParam = filterType !== 'all' ? `&type=${filterType}` : '';
      const response = await fetch(apiUrl(`/api/crm/loyalty/transactions?limit=200${typeParam}`));
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      setTransactions(data.transactions || []);
      setSummary(data.summary || {
        totalTransactions: 0,
        totalEarned: 0,
        totalBurned: 0,
        netPoints: 0,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earn':
        return 'text-success';
      case 'burn':
        return 'text-error';
      case 'adjustment':
        return 'text-warning';
      case 'tier_bonus':
        return 'text-info';
      default:
        return 'text-base-content';
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'earn':
        return 'badge-success';
      case 'burn':
        return 'badge-error';
      case 'adjustment':
        return 'badge-warning';
      case 'tier_bonus':
        return 'badge-info';
      default:
        return 'badge-ghost';
    }
  };

  if (status === 'loading' || loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Loyalty Transaction Ledger"
        description="View all loyalty point earn and burn events"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-base-content/70">Total Transactions</div>
          <div className="text-2xl font-bold">{summary.totalTransactions.toLocaleString()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-base-content/70">Points Earned</div>
          <div className="text-2xl font-bold text-success">
            +{summary.totalEarned.toLocaleString()}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-base-content/70">Points Burned</div>
          <div className="text-2xl font-bold text-error">
            -{summary.totalBurned.toLocaleString()}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-base-content/70">Net Points</div>
          <div className="text-2xl font-bold">{summary.netPoints.toLocaleString()}</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4 items-center">
        <label className="label">
          <span className="label-text">Filter by type:</span>
        </label>
        <select
          className="select select-bordered"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="earn">Earn</option>
          <option value="burn">Burn</option>
          <option value="adjustment">Adjustment</option>
          <option value="tier_bonus">Tier Bonus</option>
        </select>
      </div>

      {/* Transactions Table */}
      {transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Loyalty transactions will appear here"
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Guest</th>
                  <th>Type</th>
                  <th>Points</th>
                  <th>Balance</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="text-sm">{formatDate(tx.createdAt)}</td>
                    <td>
                      <div className="text-sm">
                        <div className="font-semibold">{tx.guestName || 'Unknown'}</div>
                        <div className="text-base-content/70 text-xs">{tx.guestEmail}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getTransactionBadge(tx.transactionType)}`}>
                        {tx.transactionType}
                      </span>
                    </td>
                    <td>
                      <span className={`font-semibold ${getTransactionColor(tx.transactionType)}`}>
                        {tx.pointsDelta > 0 ? '+' : ''}
                        {tx.pointsDelta.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <div className="text-sm">
                        <div className="text-base-content/70">
                          {tx.pointsBefore.toLocaleString()} →{' '}
                          {tx.pointsAfter.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="text-sm max-w-xs truncate">{tx.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
