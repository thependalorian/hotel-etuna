/**
 * Navigation Header Component
 * 
 * Purpose: Landing page navigation header with logo, navigation links, and CTA button
 * Location: /components/sections/landing/NavigationHeader.tsx
 * 
 * Features:
 * - Sticky header with backdrop blur
 * - Responsive navigation with mobile menu
 * - Logo with hover animation
 * - Primary CTA button
 * - Mobile hamburger menu (44x44px touch target)
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Button size: min-h-[44px] (Fitt's Law)
 * - Sticky positioning with z-index: 50
 * 
 * Accessibility:
 * - Semantic HTML (header, nav)
 * - Keyboard navigation support
 * - ARIA labels for navigation
 * - WCAG 2.1 AA compliant touch targets (44px minimum)
 * 
 * @module NavigationHeader
 */

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { HotelEtunaLogo } from '@/components/brand/HotelEtunaLogo';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { PublicAuthNav } from '@/components/shared/PublicAuthNav';
import { GuestNavLink } from '@/components/shared/GuestNavLink';

export default function NavigationHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-base-100/95 backdrop-blur-md border-b border-base-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <HotelEtunaLogo size="md" href="/" />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            <Link href="/rooms" className="text-sm font-medium text-base-content hover:text-primary transition-colors">Rooms</Link>
            <Link href="/dining" className="text-sm font-medium text-base-content hover:text-primary transition-colors">Dining</Link>
            <Link href="/about" className="text-sm font-medium text-base-content hover:text-primary transition-colors">About</Link>
            <Link href="/contact" className="text-sm font-medium text-base-content hover:text-primary transition-colors">Contact</Link>
            <GuestNavLink className="text-sm font-medium text-base-content hover:text-primary transition-colors" />
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <PublicAuthNav variant="header" />
            <Link href="/rooms?book=1">
              <Button variant="primary" size="default" className="min-h-[44px]">Book Now</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg hover:bg-nude-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-base-content" />
            ) : (
              <Menu className="w-6 h-6 text-base-content" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          id="mobile-menu"
          className="md:hidden border-t border-base-300 bg-base-100"
          role="dialog"
          aria-label="Mobile navigation"
        >
          <nav className="px-4 py-4 space-y-3" aria-label="Mobile navigation">
            <Link 
              href="/rooms" 
              className="py-3 text-base font-medium text-base-content hover:text-primary transition-colors min-h-[44px] flex items-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Rooms
            </Link>
            <Link href="/dining" className="py-3 text-base font-medium text-base-content hover:text-primary transition-colors min-h-[44px] flex items-center" onClick={() => setMobileMenuOpen(false)}>Dining</Link>
            <Link href="/about" className="py-3 text-base font-medium text-base-content hover:text-primary transition-colors min-h-[44px] flex items-center" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link href="/contact" className="py-3 text-base font-medium text-base-content hover:text-primary transition-colors min-h-[44px] flex items-center" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
            <GuestNavLink
              className="py-3 text-base font-medium text-base-content hover:text-primary transition-colors min-h-[44px] flex items-center"
              onNavigate={() => setMobileMenuOpen(false)}
            />
            <PublicAuthNav
              variant="header"
              className="py-1"
              onNavigate={() => setMobileMenuOpen(false)}
            />
            <Link href="/rooms?book=1" className="block" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" size="lg" className="w-full min-h-12">Book Now</Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
