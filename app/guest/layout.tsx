/**
 * Guest portal layout
 *
 * Purpose: Authenticated guest self-service hub (overview, loyalty, profile, data rights).
 * Location: /app/guest/layout.tsx
 */

import NavigationHeader from '@/components/sections/landing/NavigationHeader';
import Footer from '@/components/shared/Footer';
import { GuestSubNav } from '@/components/features/guest/GuestSubNav';

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-background flex flex-col">
      <NavigationHeader />
      <main id="main-content" className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <GuestSubNav />
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
