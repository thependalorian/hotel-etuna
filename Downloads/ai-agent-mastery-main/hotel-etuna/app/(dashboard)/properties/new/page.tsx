import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';
import PropertyForm from '@/components/features/property/PropertyForm';

const NewPropertyPage = () => {
  return (
    <div className="buffr-page-stack max-w-3xl">
      <Link
        href="/properties"
        className="buffr-link inline-flex min-h-[44px] items-center gap-2 text-sm font-bold"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        Back to properties
      </Link>

      <header className="buffr-hero-band relative p-6 md:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-200/30 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-md md:h-14 md:w-14">
              <Building2 className="h-6 w-6 md:h-7 md:w-7" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="buffr-eyebrow mb-2 text-brand-700">Properties</p>
              <h2 className="buffr-page-title mb-2">Add a new property</h2>
              <p className="buffr-page-desc text-ink-700">
                Tell us the basics—name, type, and address. You can add rooms, staff, and menus from your property
                dashboard after this is saved.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-surface rounded-[var(--radius-card)] p-5 shadow-card md:p-8">
        <PropertyForm />
      </div>
    </div>
  );
};

export default NewPropertyPage;
