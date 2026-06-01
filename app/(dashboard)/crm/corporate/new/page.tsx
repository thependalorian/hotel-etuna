/**
 * Create Corporate Account Page
 * 
 * Purpose: Form to create new corporate B2B account
 * Location: /app/(dashboard)/crm/corporate/new/page.tsx
 * 
 * Agent A7 - Corporate Billing Feature
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

export default function CreateCorporateAccountPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    companyName: '',
    companyRegistration: '',
    vatNumber: '',
    billingAddress: '',
    billingCity: '',
    billingCountry: 'Namibia',
    billingPostalCode: '',
    paymentTermsDays: 30,
    creditLimit: '50000.00',
    billingEmail: '',
    billingPhone: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(apiUrl('/api/corporate/accounts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create corporate account');
      }

      router.push('/crm/corporate');
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
          <p className="text-semantic-warning font-medium">Please log in to create corporate accounts.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Create Corporate Account"
          description="Add a new B2B corporate account for bill-to-company bookings"
        />

        {error && (
          <ErrorDisplay
            error={error}
            title="Error Creating Corporate Account"
            variant="inline"
          />
        )}

        <Card variant="elevated">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Company Information</h3>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Company Name *</span>
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="input input-bordered"
                  required
                  minLength={2}
                  maxLength={255}
                  placeholder="Acme Corporation (Pty) Ltd"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Company Registration</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyRegistration}
                    onChange={(e) => setFormData({ ...formData, companyRegistration: e.target.value })}
                    className="input input-bordered"
                    maxLength={100}
                    placeholder="2023/123456/07"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">VAT Number</span>
                  </label>
                  <input
                    type="text"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                    className="input input-bordered"
                    maxLength={50}
                    placeholder="VAT123456789"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Billing Information</h3>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Billing Address</span>
                </label>
                <textarea
                  value={formData.billingAddress}
                  onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                  className="textarea textarea-bordered"
                  rows={3}
                  placeholder="123 Business Street, Windhoek"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">City</span>
                  </label>
                  <input
                    type="text"
                    value={formData.billingCity}
                    onChange={(e) => setFormData({ ...formData, billingCity: e.target.value })}
                    className="input input-bordered"
                    placeholder="Windhoek"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Country</span>
                  </label>
                  <input
                    type="text"
                    value={formData.billingCountry}
                    onChange={(e) => setFormData({ ...formData, billingCountry: e.target.value })}
                    className="input input-bordered"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Postal Code</span>
                  </label>
                  <input
                    type="text"
                    value={formData.billingPostalCode}
                    onChange={(e) => setFormData({ ...formData, billingPostalCode: e.target.value })}
                    className="input input-bordered"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Billing Email *</span>
                  </label>
                  <input
                    type="email"
                    value={formData.billingEmail}
                    onChange={(e) => setFormData({ ...formData, billingEmail: e.target.value })}
                    className="input input-bordered"
                    required
                    placeholder="billing@acme.com"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Billing Phone</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.billingPhone}
                    onChange={(e) => setFormData({ ...formData, billingPhone: e.target.value })}
                    className="input input-bordered"
                    placeholder="+264 61 123456"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment Terms</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Payment Terms (days)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.paymentTermsDays}
                    onChange={(e) => setFormData({ ...formData, paymentTermsDays: parseInt(e.target.value) })}
                    className="input input-bordered"
                    min={0}
                    max={365}
                  />
                  <label className="label">
                    <span className="label-text-alt">Net payment due in days</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Credit Limit (NAD)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    className="input input-bordered"
                    pattern="^\d+(\.\d{1,2})?$"
                    placeholder="50000.00"
                  />
                  <label className="label">
                    <span className="label-text-alt">Maximum credit allowed</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Notes</span>
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="textarea textarea-bordered"
                rows={4}
                placeholder="Internal notes about this corporate account..."
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn btn-ghost"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
