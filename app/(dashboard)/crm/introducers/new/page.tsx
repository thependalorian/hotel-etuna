/**
 * Create Introducer Page
 * 
 * Purpose: Form to create new introducer partner
 * Location: /app/(dashboard)/crm/introducers/new/page.tsx
 * 
 * Features:
 * - Create introducer form
 * - Code validation
 * - Commission rate configuration
 * - Public directory opt-in
 * 
 * Following System Design Principles:
 * - Part 9: daisyUI form components
 * - Part 1: Input validation
 * 
 * @module CreateIntroducerPage
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { apiUrl } from '@/lib/utils/api-url';
import { Button } from '@/components/ui/Button';

export default function CreateIntroducerPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(apiUrl('/api/introducers'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          website: formData.website || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create introducer');
      }

      router.push('/crm/introducers');
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Card variant="elevated" className="border-semantic-warning">
          <p className="text-semantic-warning font-medium">Please log in to create introducers.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Create Introducer"
          description="Add a new referral partner"
        />

        {error && (
          <ErrorDisplay
            error={error}
            title="Error Creating Introducer"
            variant="minimal"
          />
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
                <span className="label-text-alt">Uppercase letters, numbers, hyphens, underscores</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="input input-bordered font-mono"
                required
                minLength={3}
                maxLength={50}
                pattern="[A-Z0-9_-]+"
                placeholder="TRAVEL-AGENT-001"
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
              <Button type="submit" isLoading={loading}>
                Create Introducer
              </Button>
              <button
                type="button"
                onClick={() => router.back()}
                className="btn btn-ghost min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
