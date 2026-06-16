/**
 * DashboardFocusStrip — Operational priority shortcuts (Miller’s chunking + Hick’s Law).
 *
 * Purpose: Surfaces three high-value destinations so hosts see “what to open first”
 * without scanning the whole dashboard (role-aware ops pattern).
 * Location: components/features/dashboard/DashboardFocusStrip.tsx
 */

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { CalendarCheck, ShieldCheck, AlertTriangle } from 'lucide-react';

const priorities = [
  {
    href: '/bookings',
    label: 'Bookings',
    hint: 'Calendar & arrivals',
    icon: CalendarCheck,
    variant: 'primary' as const,
  },
  {
    href: '/compliance/kyc',
    label: 'Compliance',
    hint: 'KYC / KYB',
    icon: ShieldCheck,
    variant: 'outline' as const,
  },
  {
    href: '/fraud',
    label: 'Risk',
    hint: 'Alerts & signals',
    icon: AlertTriangle,
    variant: 'outline' as const,
  },
];

export default function DashboardFocusStrip() {
  const today = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <section
      aria-label="Operational priorities"
      className="rounded-2xl border border-base-300/70 bg-base-100/85 p-4 shadow-md backdrop-blur-md md:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-400">
            Today · {today}
          </p>
          <h2 className="mt-1 text-lg font-bold text-ink-950 md:text-xl font-display">
            Where to look first
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-600">
            Three shortcuts for day-to-day operations—fewer clicks, clearer next steps.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          {priorities.map(({ href, label, hint, icon: Icon, variant }) => (
            <Button
              key={href}
              asChild
              variant={variant === 'primary' ? 'primary' : 'outline'}
              className={
                variant === 'primary'
                  ? 'min-h-[44px] gap-2 rounded-xl px-4 shadow-md transition-transform duration-200 hover:-translate-y-0.5'
                  : 'min-h-[44px] gap-2 rounded-xl border-base-300 bg-white/70 px-4 hover:border-brand-400 hover:bg-white'
              }
            >
              <Link href={href}>
                <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                <span className="flex flex-col items-start text-left leading-tight">
                  <span className="font-bold">{label}</span>
                  <span className="text-xs font-normal opacity-80">{hint}</span>
                </span>
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
