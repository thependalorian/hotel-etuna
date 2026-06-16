/**
 * Guest Loyalty Page
 * 
 * Purpose: Guest-facing loyalty balance, tier progress, and redemption UI
 * Location: /app/guest/loyalty/page.tsx
 * 
 * Features:
 * - View loyalty balance and tier
 * - Progress to next tier
 * - Recent transactions
 * - Redeem rewards
 * - Redemption history
 * 
 * @module GuestLoyaltyPage
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
import { securityLogger } from '@/lib/utils/security-logger.client';
import { Button } from '@/components/ui/Button';

interface LoyaltyBalance {
  points: number;
  tier: string;
  tierOrder: number;
  nextTier?: string;
  pointsToNextTier?: number;
}

interface LoyaltyTransaction {
  id: string;
  transactionType: string;
  pointsDelta: number;
  description: string;
  createdAt: string;
}

interface LoyaltyReward {
  id: string;
  name: string;
  description?: string;
  pointsCost: number;
  valueNad?: number;
  available: boolean;
  minTier?: string;
}

interface LoyaltyRedemption {
  id: string;
  rewardId: string;
  pointsSpent: number;
  status: string;
  createdAt: string;
}

export default function GuestLoyaltyPage() {
  const { data: session, status } = useSession();
  const [balance, setBalance] = useState<LoyaltyBalance | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [redemptions, setRedemptions] = useState<LoyaltyRedemption[]>([]);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [pointsValue, setPointsValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchLoyaltyData();
      fetchRewards();
    }
  }, [status]);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl('/api/guest/loyalty'));
      
      if (!response.ok) {
        throw new Error('Failed to fetch loyalty information');
      }
      
      const data = await response.json();
      setBalance(data.balance);
      setTransactions(data.transactions || []);
      setRedemptions(data.redemptions || []);
      setPointsValue(data.pointsValue || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRewards = async () => {
    try {
      const response = await fetch(apiUrl('/api/crm/loyalty/catalog?availableOnly=true'));
      
      if (!response.ok) {
        throw new Error('Failed to fetch rewards');
      }
      
      const data = await response.json();
      setRewards(data.rewards || []);
    } catch (err: any) {
      securityLogger.error('Error fetching rewards:', err);
    }
  };

  const handleRedeem = async (rewardId: string) => {
    try {
      setRedeeming(true);
      setError('');
      
      const response = await fetch(apiUrl('/api/guest/loyalty/redeem'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to redeem reward');
      }
      
      // Refresh loyalty data
      await fetchLoyaltyData();
      
      alert(`✅ ${data.message || 'Reward redeemed successfully!'}`);
    } catch (err: any) {
      setError(err.message);
      alert(`❌ ${err.message}`);
    } finally {
      setRedeeming(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'text-purple-600';
      case 'gold':
        return 'text-yellow-600';
      case 'silver':
        return 'text-gray-500';
      case 'bronze':
      default:
        return 'text-orange-700';
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'badge-primary';
      case 'gold':
        return 'badge-warning';
      case 'silver':
        return 'badge-info';
      case 'bronze':
      default:
        return 'badge-ghost';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const canRedeem = (reward: LoyaltyReward) => {
    if (!balance) return false;
    if (!reward.available) return false;
    if (balance.points < reward.pointsCost) return false;
    
    if (reward.minTier) {
      const tierOrder: Record<string, number> = {
        bronze: 1,
        silver: 2,
        gold: 3,
        platinum: 4,
      };
      const requiredOrder = tierOrder[reward.minTier] || 1;
      if (balance.tierOrder < requiredOrder) return false;
    }
    
    return true;
  };

  if (status === 'loading' || loading) {
    return <LoadingSpinner />;
  }

  if (error && !balance) {
    return <ErrorDisplay error={error} />;
  }

  if (!balance) {
    return <EmptyState title="Loyalty information unavailable" description="Please try again later" />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="My Loyalty Rewards"
        description="Earn points, unlock rewards, and enjoy exclusive benefits"
      />

      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      {/* Balance and Tier Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold">{balance.points.toLocaleString()}</h2>
              <p className="text-sm text-base-content/70">Loyalty Points</p>
            </div>
            <div className="text-right">
              <div className={`text-xl font-semibold capitalize ${getTierColor(balance.tier)}`}>
                {balance.tier} Tier
              </div>
              <div className="text-sm text-base-content/70">
                Worth N${pointsValue.toFixed(2)}
              </div>
            </div>
          </div>

          {balance.nextTier && balance.pointsToNextTier && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress to {balance.nextTier}</span>
                <span>{balance.pointsToNextTier.toLocaleString()} points to go</span>
              </div>
              <progress
                className="progress progress-primary w-full"
                value={balance.points}
                max={balance.points + balance.pointsToNextTier}
              />
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">How to Earn</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Earn 1 point per N$10 spent on room and dining</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Redeem 100 points = N$50 off your next stay</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Higher tiers earn bonus points</span>
            </li>
          </ul>
        </Card>
      </div>

      {/* Available Rewards */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Redeem Rewards</h2>
        {rewards.length === 0 ? (
          <EmptyState title="No rewards available" description="Check back later for new rewards" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => {
              const canRedeemReward = canRedeem(reward);
              
              return (
                <Card key={reward.id} className="p-6">
                  <h3 className="text-lg font-semibold mb-2">{reward.name}</h3>
                  
                  {reward.description && (
                    <p className="text-sm text-base-content/70 mb-4">{reward.description}</p>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Points Cost:</span>
                      <span className="font-semibold">{reward.pointsCost.toLocaleString()}</span>
                    </div>
                    {reward.valueNad && (
                      <div className="flex justify-between">
                        <span className="text-sm">Value:</span>
                        <span className="font-semibold">N${reward.valueNad.toLocaleString()}</span>
                      </div>
                    )}
                    {reward.minTier && (
                      <div className="flex justify-between">
                        <span className="text-sm">Min Tier:</span>
                        <span className={`badge ${getTierBadge(reward.minTier)}`}>
                          {reward.minTier}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => handleRedeem(reward.id)}
                    disabled={!canRedeemReward || redeeming}
                    isLoading={redeeming}
                    className="w-full"
                  >
                    {canRedeemReward ? 'Redeem' : 'Insufficient Points'}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        {transactions.length === 0 ? (
          <EmptyState title="No transactions yet" description="Start earning points with your next stay" />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Points</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 10).map((tx) => (
                    <tr key={tx.id}>
                      <td className="text-sm">{formatDate(tx.createdAt)}</td>
                      <td>
                        <span className="badge badge-sm">{tx.transactionType}</span>
                      </td>
                      <td>
                        <span
                          className={`font-semibold ${
                            tx.pointsDelta > 0 ? 'text-success' : 'text-error'
                          }`}
                        >
                          {tx.pointsDelta > 0 ? '+' : ''}
                          {tx.pointsDelta.toLocaleString()}
                        </span>
                      </td>
                      <td className="text-sm">{tx.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Redemption History */}
      {redemptions.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Redemption History</h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Points Spent</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {redemptions.map((redemption) => (
                    <tr key={redemption.id}>
                      <td className="text-sm">{formatDate(redemption.createdAt)}</td>
                      <td className="font-semibold">{redemption.pointsSpent.toLocaleString()}</td>
                      <td>
                        <span
                          className={`badge ${
                            redemption.status === 'fulfilled'
                              ? 'badge-success'
                              : redemption.status === 'cancelled'
                              ? 'badge-error'
                              : 'badge-warning'
                          }`}
                        >
                          {redemption.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
