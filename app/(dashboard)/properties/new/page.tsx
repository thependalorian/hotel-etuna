import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';
import PropertyForm from '@/components/features/property/PropertyForm';

const NewPropertyPage = () => {
  return (
    <div className="etuna-page-stack max-w-3xl">
      <Link
        href="/properties"
        className="etuna-link inline-flex min-h-[44px] items-center gap-2 text-sm font-bold"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        Back to property
      </Link>

      <header className="etuna-hero-band relative p-6 md:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-nude-200/30 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-etuna-card bg-ci-primary text-ci-cream md:h-14 md:w-14">
              <Building2 className="h-6 w-6 md:h-7 md:w-7" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="etuna-eyebrow mb-2 text-ci-primary">Property setup</p>
              <h2 className="etuna-page-title mb-2">Property details</h2>
              <p className="etuna-page-desc text-ink-700">
                Tell us the basics — name, type, and address. You can add rooms, staff, and menus from your dashboard
                after this is saved.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="rounded-etuna-card border border-nude-200 bg-surface-elevated p-6 md:p-8">
        <PropertyForm />
      </div>
    </div>
  );
};

export default NewPropertyPage;
