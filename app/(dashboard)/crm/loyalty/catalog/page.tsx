/**
 * Loyalty Rewards Catalog Page
 * 
 * Purpose: Staff interface for managing reward catalog
 * Location: /app/(dashboard)/crm/loyalty/catalog/page.tsx
 * 
 * Features:
 * - List all rewards
 * - Create new rewards
 * - Edit existing rewards
 * - Toggle availability
 * 
 * @module LoyaltyCatalogPage
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
import { Button } from '@/components/ui/Button';

interface LoyaltyReward {
  id: string;
  name: string;
  description?: string;
  pointsCost: number;
  valueNad?: number;
  available: boolean;
  minTier?: string;
  maxRedemptionsPerGuest?: number;
  validFrom?: string;
  validUntil?: string;
  createdAt: string;
}

export default function LoyaltyCatalogPage() {
  const { data: session, status } = useSession();
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pointsCost: '',
    valueNad: '',
    minTier: '',
    available: true,
    maxRedemptionsPerGuest: '',
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchRewards();
    }
  }, [status]);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl('/api/crm/loyalty/catalog?availableOnly=false'));
      if (!response.ok) {
        throw new Error('Failed to fetch rewards');
      }
      const data = await response.json();
      setRewards(data.rewards || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(apiUrl('/api/crm/loyalty/catalog'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pointsCost: parseInt(formData.pointsCost),
          valueNad: formData.valueNad ? parseFloat(formData.valueNad) : undefined,
          maxRedemptionsPerGuest: formData.maxRedemptionsPerGuest
            ? parseInt(formData.maxRedemptionsPerGuest)
            : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create reward');
      }

      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        pointsCost: '',
        valueNad: '',
        minTier: '',
        available: true,
        maxRedemptionsPerGuest: '',
      });
      fetchRewards();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleAvailability = async (rewardId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(apiUrl(`/api/crm/loyalty/catalog/${rewardId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update reward');
      }

      fetchRewards();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (status === 'loading' || loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Loyalty Rewards Catalog"
        description="Manage rewards available for guest redemption"
      />

      <div className="mb-6">
        <Button type="button" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'Create New Reward'}
        </Button>
      </div>

      {showCreateForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">
                <span className="label-text">Reward Name *</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Description</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text">Points Cost *</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={formData.pointsCost}
                  onChange={(e) => setFormData({ ...formData, pointsCost: e.target.value })}
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Value (NAD)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={formData.valueNad}
                  onChange={(e) => setFormData({ ...formData, valueNad: e.target.value })}
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text">Minimum Tier</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={formData.minTier}
                  onChange={(e) => setFormData({ ...formData, minTier: e.target.value })}
                >
                  <option value="">All tiers</option>
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Max Redemptions Per Guest</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={formData.maxRedemptionsPerGuest}
                  onChange={(e) =>
                    setFormData({ ...formData, maxRedemptionsPerGuest: e.target.value })
                  }
                  min="1"
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                />
                <span className="label-text">Available for redemption</span>
              </label>
            </div>

            <div className="flex gap-4">
              <Button type="submit">Create Reward</Button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn btn-ghost min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {rewards.length === 0 ? (
        <EmptyState
          title="No rewards yet"
          description="Create your first loyalty reward to get started"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <Card key={reward.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">{reward.name}</h3>
                <span
                  className={`badge ${
                    reward.available ? 'badge-success' : 'badge-error'
                  }`}
                >
                  {reward.available ? 'Available' : 'Unavailable'}
                </span>
              </div>

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
                    <span className="font-semibold capitalize">{reward.minTier}</span>
                  </div>
                )}
                {reward.maxRedemptionsPerGuest && (
                  <div className="flex justify-between">
                    <span className="text-sm">Max Per Guest:</span>
                    <span className="font-semibold">{reward.maxRedemptionsPerGuest}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => toggleAvailability(reward.id, reward.available)}
                className="btn btn-sm btn-outline w-full"
              >
                {reward.available ? 'Mark Unavailable' : 'Mark Available'}
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
