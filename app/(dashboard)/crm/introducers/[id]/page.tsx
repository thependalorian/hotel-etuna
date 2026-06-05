/**
 * Edit Introducer Page
 * 
 * Purpose: Edit existing introducer partner
 * Location: /app/(dashboard)/crm/introducers/[id]/page.tsx
 * 
 * Features:
 * - Edit introducer details
 * - Update commission rate
 * - Toggle active status
 * - Public directory opt-in/out
 * - View stats
 * 
 * Following System Design Principles:
 * - Part 9: daisyUI form components
 * - Part 11 Gap 4: Ownership verification via API
 * 
 * @module EditIntroducerPage
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
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
  show_in_public_directory: boolean;
  bio?: string;
  website?: string;
  total_bookings: number;
  total_commission_earned: string;
}

export default function EditIntroducerPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [introducer, setIntroducer] = useState<Introducer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    commissionRate: 10,
    isActive: true,
    showInPublicDirectory: false,
    bio: '',
    website: '',
  });

  useEffect(() => {
    if (status === 'authenticated' && params.id) {
      fetchIntroducer();
    }
  }, [status, params.id]);

  const fetchIntroducer = async () => {
    try {
      const response = await fetch(apiUrl(`/api/introducers/${params.id}`));
      if (!response.ok) {
        throw new Error('Failed to fetch introducer');
      }
      const data: Introducer = await response.json();
      setIntroducer(data);
      setFormData({
        name: data.name,
        code: data.code,
        email: data.email || '',
        phone: data.phone || '',
        commissionRate: parseFloat(data.commission_rate),
        isActive: data.is_active,
        showInPublicDirectory: data.show_in_public_directory,
        bio: data.bio || '',
        website: data.website || '',
      });
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch(apiUrl(`/api/introducers/${params.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          website: formData.website || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update introducer');
      }

      router.push('/crm/introducers');
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this introducer? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(apiUrl(`/api/introducers/${params.id}`), {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete introducer');
      }

      router.push('/crm/introducers');
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error && !introducer) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <ErrorDisplay error={error} title="Error Loading Introducer" variant="full" />
      </div>
    );
  }

  if (!session || !introducer) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Card variant="elevated" className="border-semantic-warning">
          <p className="text-semantic-warning font-medium">Access denied.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title={`Edit: ${introducer.name}`}
          description="Update introducer details"
          actions={
            <Link
              href={`/crm/introducers/${introducer.id}/bookings`}
              className="btn btn-outline btn-sm"
            >
              View Bookings
            </Link>
          }
        />

        <div className="stats shadow w-full">
          <div className="stat">
            <div className="stat-title">Total Bookings</div>
            <div className="stat-value text-2xl">{introducer.total_bookings}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Total Commission Earned</div>
            <div className="stat-value text-2xl">N${parseFloat(introducer.total_commission_earned).toFixed(2)}</div>
          </div>
        </div>

        {error && (
          <ErrorDisplay error={error} title="Error" variant="minimal" />
        )}

        <Card variant="elevated">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Name *</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input input-bordered"
                required
                minLength={2}
                maxLength={255}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Code *</span>
                <span className="label-text-alt">Cannot be changed after creation</span>
              </label>
              <input
                type="text"
                value={formData.code}
                className="input input-bordered font-mono"
                disabled
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Phone</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input input-bordered"
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Commission Rate (%)</span>
              </label>
              <input
                type="number"
                value={formData.commissionRate}
                onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })}
                className="input input-bordered"
                required
                min={0}
                max={100}
                step={0.01}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Website</span>
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="input input-bordered"
                placeholder="https://example.com"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Bio</span>
                <span className="label-text-alt">Public profile description</span>
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="textarea textarea-bordered"
                rows={4}
                maxLength={2000}
              />
            </div>

            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="checkbox checkbox-primary"
                />
                <span className="label-text">Active</span>
              </label>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  checked={formData.showInPublicDirectory}
                  onChange={(e) => setFormData({ ...formData, showInPublicDirectory: e.target.checked })}
                  className="checkbox checkbox-primary"
                />
                <span className="label-text">Show in public partners directory</span>
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary min-h-[44px]"
              >
                {saving ? <LoadingSpinner size="sm" /> : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="btn btn-ghost min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-error btn-outline min-h-[44px] ml-auto"
              >
                Delete
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
