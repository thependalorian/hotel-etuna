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
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function NavigationHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-base-100/95 backdrop-blur-md border-b border-base-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group" aria-label="Buffr Host Home">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-nude-600 to-nude-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-md">
              <span className="text-xl font-bold text-white">H</span>
            </div>
            <span className="text-xl font-bold font-display text-base-content">Buffr Host</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            <Link href="/" className="text-sm font-medium text-base-content hover:text-primary transition-colors">
              Home
            </Link>
            {/* Note: Hotels, Restaurants, About, Contact pages do not exist yet - links removed to avoid 404s */}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/register">
              <Button variant="primary" size="default" className="min-h-[44px]">
                Get Started Free
              </Button>
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
              href="/" 
              className="block py-3 text-base font-medium text-base-content hover:text-primary transition-colors min-h-[44px] flex items-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link href="/register" className="block" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" size="lg" className="w-full min-h-[48px]">
                Get Started Free
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
