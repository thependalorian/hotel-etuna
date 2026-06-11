/**
 * WelcomeBanner — personalised greeting for the guest dashboard.
 *
 * Location: components/features/guest/WelcomeBanner.tsx
 * Voice: warm, Oshiwambo "Moro" (Hello) per brand tone (PRD §9.4).
 */

import { Sparkles } from 'lucide-react';

export interface WelcomeBannerProps {
  firstName: string;
  loyaltyTier?: string | null;
}

/**
 * Render the dashboard hero greeting with an optional loyalty-tier badge.
 *
 * @param props - Guest first name and loyalty tier label.
 */
export function WelcomeBanner({ firstName, loyaltyTier }: WelcomeBannerProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-terracotta-900 to-khaki-700 p-6 text-white shadow-card sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-2xl font-bold sm:text-3xl">Moro, {firstName} 👋</p>
          <p className="mt-1 text-white/80">Welcome to your Hotel Etuna stay hub.</p>
        </div>
        {loyaltyTier ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold capitalize backdrop-blur">
            <Sparkles className="h-4 w-4" aria-hidden />
            {loyaltyTier} member
          </span>
        ) : null}
      </div>
    </div>
  );
}
