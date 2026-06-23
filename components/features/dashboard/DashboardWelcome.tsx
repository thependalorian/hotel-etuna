/**
 * Dashboard Welcome Header Component
 * 
 * Purpose: Welcome header for Hotel Etuna dashboard home page.
 * Location: /components/features/DashboardWelcome.tsx
 */

import { dashboardCopy } from '@/lib/copy/dashboard';

interface DashboardWelcomeProps {
  userName: string;
}

export default function DashboardWelcome({ userName }: DashboardWelcomeProps) {
  return (
    <div className="relative overflow-hidden rounded-etuna-card bg-gradient-to-br from-ci-accent-terracotta via-ci-secondary-chocolate to-nude-900 p-8 text-white md:p-10">
      <div className="pointer-events-none absolute inset-0 opacity-[0.12]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>
      <div className="relative z-10 max-w-3xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-white/75">
          {dashboardCopy.homeEyebrow}
        </p>
        <h1 className="mb-3 font-display text-3xl font-bold md:text-4xl lg:text-5xl">
          Welcome back, {userName}
        </h1>
        <p className="text-base leading-relaxed text-white/95 md:text-lg">
          {dashboardCopy.homeSubtitle}
        </p>
      </div>
    </div>
  );
}
