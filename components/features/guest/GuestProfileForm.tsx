/**
 * GuestProfileForm — view + edit the signed-in guest's profile.
 *
 * Location: components/features/guest/GuestProfileForm.tsx
 * Reads/writes `GET`/`PATCH /api/guest/profile`. Email is read-only.
 */

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import type { GuestProfile } from '@/lib/services/guest/GuestProfileService';

type FormState = {
  firstName: string;
  lastName: string;
  phone: string;
  nationality: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  marketingConsent: boolean;
  preferredRoomType: string;
  dietaryRestrictions: string; // comma-separated in the UI
  accessibilityNeeds: string;
};

function toFormState(p: GuestProfile): FormState {
  return {
    firstName: p.firstName ?? '',
    lastName: p.lastName ?? '',
    phone: p.phone ?? '',
    nationality: p.nationality ?? '',
    address: p.address ?? '',
    city: p.city ?? '',
    country: p.country ?? '',
    postalCode: p.postalCode ?? '',
    marketingConsent: p.marketingConsent,
    preferredRoomType: p.preferredRoomType ?? '',
    dietaryRestrictions: p.dietaryRestrictions.join(', '),
    accessibilityNeeds: p.accessibilityNeeds.join(', '),
  };
}

function toList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const TEXT_FIELDS: Array<{ key: keyof FormState; label: string; type?: string }> = [
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'phone', label: 'Phone', type: 'tel' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'country', label: 'Country' },
  { key: 'postalCode', label: 'Postal code' },
];

export function GuestProfileForm() {
  const [email, setEmail] = useState('');
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/guest/profile', { credentials: 'include' });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error?.message || 'Failed to load profile');
        if (!cancelled) {
          const profile = json.data as GuestProfile;
          setEmail(profile.email);
          setForm(toFormState(profile));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/guest/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: form.firstName || null,
          lastName: form.lastName || null,
          phone: form.phone || null,
          nationality: form.nationality || null,
          address: form.address || null,
          city: form.city || null,
          country: form.country || null,
          postalCode: form.postalCode || null,
          marketingConsent: form.marketingConsent,
          preferredRoomType: form.preferredRoomType || null,
          dietaryRestrictions: toList(form.dietaryRestrictions),
          accessibilityNeeds: toList(form.accessibilityNeeds),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || 'Could not save profile');
      setForm(toFormState(json.data as GuestProfile));
      setMessage('Profile saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Loading your profile…" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="rounded-2xl border border-nude-200 bg-white p-8 text-center">
        <p className="text-semantic-error-dark">{error ?? 'No profile available.'}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="rounded-2xl border border-nude-200 bg-white p-6 shadow-card">
        <h2 className="mb-4 font-display text-lg font-bold text-terracotta-900">Contact details</h2>
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-nude-700">Email</label>
          <input
            type="email"
            value={email}
            readOnly
            className="input input-bordered w-full bg-nude-50 text-nude-500"
            aria-describedby="email-hint"
          />
          <p id="email-hint" className="mt-1 text-xs text-nude-500">
            Email is your sign-in identity and can&apos;t be changed here.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TEXT_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium text-nude-700">{field.label}</label>
              <input
                type={field.type ?? 'text'}
                value={form[field.key] as string}
                onChange={(e) => set(field.key, e.target.value as FormState[typeof field.key])}
                className="input input-bordered w-full"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-nude-200 bg-white p-6 shadow-card">
        <h2 className="mb-4 font-display text-lg font-bold text-terracotta-900">Stay preferences</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-nude-700">Preferred room type</label>
            <input
              type="text"
              value={form.preferredRoomType}
              onChange={(e) => set('preferredRoomType', e.target.value)}
              placeholder="e.g. Executive Room"
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-nude-700">
              Dietary restrictions <span className="text-nude-400">(comma separated)</span>
            </label>
            <input
              type="text"
              value={form.dietaryRestrictions}
              onChange={(e) => set('dietaryRestrictions', e.target.value)}
              placeholder="Halal, Vegetarian"
              className="input input-bordered w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-nude-700">
              Accessibility needs <span className="text-nude-400">(comma separated)</span>
            </label>
            <input
              type="text"
              value={form.accessibilityNeeds}
              onChange={(e) => set('accessibilityNeeds', e.target.value)}
              placeholder="Ground floor, Wheelchair access"
              className="input input-bordered w-full"
            />
          </div>
          <label className="flex items-center gap-3 text-sm text-nude-700">
            <input
              type="checkbox"
              checked={form.marketingConsent}
              onChange={(e) => set('marketingConsent', e.target.checked)}
              className="checkbox checkbox-sm"
            />
            Send me occasional offers and news from Hotel Etuna.
          </label>
        </div>
      </section>

      {error ? <p className="text-sm text-semantic-error-dark" role="alert">{error}</p> : null}
      {message ? <p className="text-sm text-semantic-success-dark" role="status">{message}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} aria-busy={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
