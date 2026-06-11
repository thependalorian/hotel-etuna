/**
 * Guest profile & data management page.
 * Location: /app/guest/profile/page.tsx
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { GuestProfileForm } from '@/components/features/guest/GuestProfileForm';

export const metadata: Metadata = {
  title: 'My profile',
  description: 'Manage your Hotel Etuna profile, stay preferences, and data rights.',
};

export default function GuestProfilePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="etuna-page-title">My profile</h1>
        <p className="etuna-page-desc">
          Keep your details and stay preferences up to date so we can take care of you.
        </p>
      </div>

      <GuestProfileForm />

      <section className="rounded-2xl border border-nude-200 bg-nude-50 p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-khaki-600" aria-hidden />
          <div>
            <h2 className="font-display text-lg font-bold text-terracotta-900">Data &amp; privacy</h2>
            <p className="mt-1 text-sm text-nude-600">
              Request a copy of your data, ask us to correct it, or request erasure under the
              Namibia Data Protection framework.
            </p>
            <Link
              href="/guest/dsar"
              className="btn btn-outline rounded-full px-6 mt-4 w-full sm:w-auto"
            >
              Manage data rights
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
