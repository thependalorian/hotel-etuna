/**
 * Dashboard Welcome Header Component
 * 
 * Purpose: Welcome header for dashboard home page
 * Location: /components/features/DashboardWelcome.tsx
 * 
 * Features:
 * - Personalized greeting
 * - Gradient background
 * - Decorative pattern
 * 
 * Design System:
 * - Uses semantic tokens: text-primary-content
 * - Gradient: from-nude-600 via-nude-500 to-nude-400
 * 
 * Accessibility:
 * - Proper heading hierarchy (h1)
 * 
 * @param {string} userName - User's name or email prefix
 * 
 * @module DashboardWelcome
 */

interface DashboardWelcomeProps {
  userName: string;
}

export default function DashboardWelcome({ userName }: DashboardWelcomeProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-400 p-8 text-white shadow-xl md:p-10">
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
          Command center
        </p>
        <h1 className="mb-3 font-display text-3xl font-bold md:text-4xl lg:text-5xl">
          Welcome back, {userName}
        </h1>
        <p className="text-base leading-relaxed text-white/95 md:text-lg">
          One place for bookings, guest experience, and operational signals—prioritized so you can act fast.
        </p>
      </div>
    </div>
  );
}
