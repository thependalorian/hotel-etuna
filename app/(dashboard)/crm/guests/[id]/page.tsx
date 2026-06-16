/**
 * Guest Profile Page
 * 
 * Purpose: View and edit guest profile information
 * Location: /app/(dashboard)/crm/guests/[id]/page.tsx
 * 
 * Features:
 * - Fetch guest data
 * - Edit personal information
 * - Edit identification
 * - Edit address
 * - Edit preferences
 * - Save changes
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Button size: min-h-[44px] (Fitt's Law)
 * 
 * Accessibility:
 * - Proper heading hierarchy (h2)
 * - Form labels and ARIA attributes
 * - Keyboard navigation support
 * 
 * @module GuestProfilePage
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
import MessageAlert from '@/components/shared/MessageAlert';
import GuestPersonalInfoForm from '@/components/features/crm/forms/GuestPersonalInfoForm';
import GuestIdentificationForm from '@/components/features/crm/forms/GuestIdentificationForm';
import GuestAddressForm from '@/components/features/crm/forms/GuestAddressForm';
import GuestPreferencesForm from '@/components/features/crm/forms/GuestPreferencesForm';
import GuestCrmMemoryPanel from '@/components/features/crm/GuestCrmMemoryPanel';
import { apiUrl } from '@/lib/utils/api-url';
import { securityLogger } from '@/lib/utils/security-logger.client';

interface Guest {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  passport_number?: string;
  id_number?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  preferences?: Record<string, unknown>;
  marketing_consent: boolean;
  is_signed_up: boolean;
  created_at: string;
  updated_at: string;
}

export default function GuestProfilePage() {
  const params = useParams();
  const guestId = params.id as string;
  const { data: session, status } = useSession();

  const [guest, setGuest] = useState<Guest | null>(null);
  const [formData, setFormData] = useState<Partial<Guest>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (guestId && status === 'authenticated' && session?.user?.tenantId) {
      const fetchGuest = async () => {
        try {
          const response = await fetch(apiUrl(`/api/crm/guests/${guestId}`));
          if (!response.ok) {
            throw new Error('Failed to fetch guest profile');
          }
          const data: Guest = await response.json();
          setGuest(data);
          setFormData({
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            date_of_birth: data.date_of_birth ? new Date(data.date_of_birth).toISOString().split('T')[0] : '',
            nationality: data.nationality,
            passport_number: data.passport_number,
            id_number: data.id_number,
            address: data.address,
            city: data.city,
            state: data.state,
            country: data.country,
            postal_code: data.postal_code,
            marketing_consent: data.marketing_consent,
            preferences: data.preferences,
          });
        } catch (err: unknown) {
          const error = err as Error;
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };
      fetchGuest();
    }
  }, [guestId, status, session?.user?.tenantId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    if (!session?.user?.tenantId) {
      setError('User not authenticated.');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        dateOfBirth: formData.date_of_birth ? new Date(formData.date_of_birth) : null,
      };

      const response = await fetch(apiUrl(`/api/crm/guests/${guestId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Guest profile updated successfully!');
        setGuest(data);
      } else {
        setError(data.message || 'Failed to update guest profile.');
      }
    } catch (err) {
      securityLogger.error('Error updating guest profile:', err);
      setError('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" text="Loading guest profile..." />
      </div>
    );
  }

  if (error && !guest) {
    return (
      <ErrorDisplay 
        error={error} 
        title="Error Loading Guest Profile"
        variant="full"
      />
    );
  }

  if (!session) {
    return (
      <div className="card bg-warning/10 border border-warning shadow-lg">
        <div className="card-body">
          <p className="text-warning font-medium">Please log in to view guest profiles.</p>
        </div>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body text-center py-16">
          <div className="w-20 h-20 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold font-display mb-2">Guest not found</h3>
          <p className="text-base-content/70">The guest profile you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="etuna-heading-display mb-2">
          Guest Profile: {guest.first_name} {guest.last_name}
        </h2>
        <p className="etuna-page-desc">View and edit guest information</p>
      </div>

      {error && <MessageAlert message={error} type="error" onDismiss={() => setError('')} />}
      {success && <MessageAlert message={success} type="success" onDismiss={() => setSuccess('')} />}

      <div className="card bg-base-100 shadow-lg card-hover">
        <div className="card-body">
          <form onSubmit={handleSave} className="space-y-6">
            <GuestPersonalInfoForm formData={formData} onChange={handleChange} />
            <div className="divider"></div>
            <GuestIdentificationForm formData={formData} onChange={handleChange} />
            <div className="divider"></div>
            <GuestAddressForm formData={formData} onChange={handleChange} />
            <div className="divider"></div>
            <GuestPreferencesForm formData={formData} onChange={handleChange} />

            <div className="card-actions justify-end pt-4">
              <button 
                type="submit" 
                className="btn btn-primary gentle-lift min-h-[44px] rounded-full px-6" 
                disabled={saving}
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <GuestCrmMemoryPanel guestId={guestId} />
    </div>
  );
}
