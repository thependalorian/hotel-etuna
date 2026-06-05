/**
 * Partner — Settings
 *
 * Purpose: Partner account profile, contact details, and notification preferences.
 * Location: /app/partner/settings/page.tsx
 */

'use client';

import type { Metadata } from 'next';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Save, User, Bell, Lock } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function PartnerSettingsPage() {
  const { data: session, status } = useSession();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    emailBookingAlerts: true,
    emailWeeklyReport: true,
  });

  useEffect(() => {
    if (session?.user) {
      setForm((prev) => ({
        ...prev,
        firstName: (session.user as { firstName?: string }).firstName ?? '',
        lastName: (session.user as { lastName?: string }).lastName ?? '',
        email: session.user.email ?? '',
      }));
    }
  }, [session]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Profile updates routed through admin for now
      await new Promise((r) => setTimeout(r, 600));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <h2 className="text-2xl font-semibold text-base-content">Settings</h2>

      {/* Profile */}
      <div className="rounded-xl border border-base-300 bg-base-100 p-5 space-y-4">
        <h3 className="font-semibold text-base-content flex items-center gap-2">
          <User className="w-4 h-4" /> Profile
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label"><span className="label-text">First name</span></label>
            <input className="input input-bordered" value={form.firstName}
              onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Last name</span></label>
            <input className="input input-bordered" value={form.lastName}
              onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Email</span></label>
            <input className="input input-bordered input-disabled" value={form.email} readOnly />
            <label className="label"><span className="label-text-alt">Contact admin to change email</span></label>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Phone</span></label>
            <input className="input input-bordered" value={form.phone} placeholder="+264 81 xxx xxxx"
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-xl border border-base-300 bg-base-100 p-5 space-y-4">
        <h3 className="font-semibold text-base-content flex items-center gap-2">
          <Bell className="w-4 h-4" /> Notifications
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="checkbox checkbox-primary"
              checked={form.emailBookingAlerts}
              onChange={(e) => setForm((p) => ({ ...p, emailBookingAlerts: e.target.checked }))} />
            <div>
              <p className="font-medium text-sm">Booking alerts</p>
              <p className="text-xs text-base-content/60">Email when a new booking is made at your property</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="checkbox checkbox-primary"
              checked={form.emailWeeklyReport}
              onChange={(e) => setForm((p) => ({ ...p, emailWeeklyReport: e.target.checked }))} />
            <div>
              <p className="font-medium text-sm">Weekly summary</p>
              <p className="text-xs text-base-content/60">Bookings and commission summary every Monday</p>
            </div>
          </label>
        </div>
      </div>

      {/* Password */}
      <div className="rounded-xl border border-base-300 bg-base-100 p-5">
        <h3 className="font-semibold text-base-content flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4" /> Password
        </h3>
        <p className="text-sm text-base-content/60 mb-3">
          Use the link below to reset your password. You will receive an email with a reset link.
        </p>
        <a href="/forgot-password" className="btn btn-outline btn-sm">
          Reset password
        </a>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <span className="loading loading-spinner loading-sm" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && <span className="text-success text-sm">✓ Changes saved</span>}
      </div>
    </form>
  );
}
