/**
 * GuestDashboard — the guest "command center" home.
 *
 * Location: components/features/guest/GuestDashboard.tsx
 *
 * Fetches the hub once (useGuestHub), shows a greeting, at-a-glance insight tiles,
 * quick actions, and the stays sections. Insights are derived client-side.
 */

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Moon,
  Wallet,
  Star,
  UtensilsCrossed,
  Gift,
  User,
  BedDouble,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { useGuestHub } from '@/components/features/guest/useGuestHub';
import { GuestStaysSections } from '@/components/features/guest/GuestStaysList';
import { StatsCard } from '@/components/features/guest/StatsCard';
import { WelcomeBanner } from '@/components/features/guest/WelcomeBanner';
import { computeGuestInsights } from '@/lib/guest/insights';

function money(currency: string, amount: number): string {
  return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

interface QuickAction {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function GuestDashboard() {
  const { data: session, status } = useSession();
  const hub = useGuestHub();
  const { reload, ...hubState } = hub;
  const insights = useMemo(
    () => computeGuestInsights({
      activeStays: hubState.activeStays,
      pastStays: hubState.pastStays,
      loyalty: hubState.loyalty,
    }),
    [hubState.activeStays, hubState.pastStays, hubState.loyalty],
  );

  const firstName =
    session?.user?.name?.split(' ')[0] || session?.user?.email?.split('@')[0] || 'guest';

  const activeStay = hubState.activeStays[0];

  const quickActions: QuickAction[] = [
    {
      href: activeStay ? `/guest/stays/${activeStay.bookingId}` : '/dining',
      label: activeStay ? 'Order room service' : 'View dining menu',
      icon: UtensilsCrossed,
    },
    { href: '/guest/loyalty', label: 'Loyalty & rewards', icon: Gift },
    { href: '/guest/profile', label: 'My profile', icon: User },
    { href: '/rooms', label: 'Book another stay', icon: BedDouble },
    { href: '/guest/dsar', label: 'Data & privacy', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-8">
      <WelcomeBanner firstName={firstName} loyaltyTier={insights.loyaltyTier} />

      {/* At-a-glance insights */}
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        aria-busy={hubState.loading}
        aria-live="polite"
      >
        {hubState.loading ? (
          <>
            <div className="skeleton h-28 rounded-2xl" aria-hidden />
            <div className="skeleton h-28 rounded-2xl" aria-hidden />
            <div className="skeleton h-28 rounded-2xl" aria-hidden />
            <p className="sr-only">Loading your stay insights…</p>
          </>
        ) : (
          <>
            <StatsCard
              label="Nights with us"
              value={String(insights.totalNights)}
              hint={`${insights.totalStays} ${insights.totalStays === 1 ? 'stay' : 'stays'}${
                insights.topProperty ? ` · ${insights.topProperty}` : ''
              }`}
              icon={Moon}
            />
            <StatsCard
              label="Lifetime spend"
              value={money(insights.currency, insights.lifetimeSpend)}
              hint="Across completed stays"
              icon={Wallet}
            />
            <StatsCard
              label="Loyalty points"
              value={insights.loyaltyPoints.toLocaleString()}
              hint={insights.loyaltyTier ? `${insights.loyaltyTier} tier` : 'Earn points each stay'}
              icon={Star}
            />
          </>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-terracotta-900">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {quickActions.map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-nude-200 bg-white p-4 text-center shadow-card transition hover:border-khaki-600/40 hover:shadow-card-hover"
            >
              <action.icon className="h-6 w-6 text-khaki-600" aria-hidden />
              <span className="text-sm font-medium text-terracotta-900">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Stays, payment due, past — single fetch shared with insights */}
      <GuestStaysSections
        {...hubState}
        onRetry={reload}
        isSignedIn={status === 'authenticated'}
      />
    </div>
  );
}
