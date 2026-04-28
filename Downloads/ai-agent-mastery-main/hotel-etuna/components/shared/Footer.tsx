/**
 * Footer Component
 * 
 * Purpose: Main page footer for public and guest-facing pages
 * Location: /components/shared/Footer.tsx
 * 
 * Features:
 * - Company branding and information
 * - Navigation links (Legal pages only - About, Contact, Features pages do not exist yet)
 * - Legal links (Privacy, Terms, Cookies, Security)
 * - Copyright notice
 * - Responsive design (mobile-first)
 * - Design system compliance (DaisyUI + Tailwind)
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface FooterProps {
  variant?: 'public' | 'dashboard' | 'minimal';
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ 
  variant = 'public',
  className = '' 
}) => {
  if (variant === 'minimal') {
    return (
      <footer className={cn('bg-base-200 border-t border-base-300 py-6', className)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-base-content/70">
              <span className="text-base font-bold text-primary">H</span>
              <span>Powered by Sofia AI</span>
            </div>
            <p className="text-xs text-base-content/60">
              © {new Date().getFullYear()} Hotel Etuna. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  if (variant === 'dashboard') {
    return (
      <footer className={cn('bg-base-200 border-t border-base-300 py-4', className)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-base-content/70">
              <span className="text-base font-bold text-primary">H</span>
              <span>Powered by Sofia AI</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-base-content/60">
              <Link href="/legal/privacy" className="hover:text-primary transition-colors">
                Privacy
              </Link>
              <Link href="/legal/terms" className="hover:text-primary transition-colors">
                Terms
              </Link>
              <Link href="/legal/cookies" className="hover:text-primary transition-colors">
                Cookies
              </Link>
              <Link href="/legal/security" className="hover:text-primary transition-colors">
                Security
              </Link>
            </div>
            <p className="text-xs text-base-content/60">
              © {new Date().getFullYear()} Hotel Etuna. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={cn('bg-base-200 border-t border-base-300', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-nude-600 to-nude-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-md">
                <span className="text-xl font-bold text-white">H</span>
              </div>
              <div>
                <div className="text-lg font-bold font-display text-base-content">Hotel Etuna</div>
              </div>
            </Link>
            <p className="text-sm text-base-content/70">
              He Takes Care of Us.
            </p>
          </div>

          {/* Company Section */}
          <div>
            <h3 className="text-sm font-semibold text-base-content mb-4">Company</h3>
            <ul className="space-y-2">
              {/* Note: About and Contact pages do not exist yet - links removed to avoid 404s */}
              <li>
                <Link href="/legal/privacy" className="text-sm text-base-content/70 hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="text-sm text-base-content/70 hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="text-sm text-base-content/70 hover:text-primary transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/security" className="text-sm text-base-content/70 hover:text-primary transition-colors">
                  Security Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-base-300">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <p className="text-xs text-base-content/60">
              © {new Date().getFullYear()} Hotel Etuna. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-base-content/70">
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3 shrink-0" />
                <a href="mailto:concierge@buffr.ai" className="hover:text-primary transition-colors">
                  concierge@hoteletuna.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 shrink-0" />
                <a href="tel:+264812345678" className="hover:text-primary transition-colors">
                  +264 65 231 177
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 shrink-0" />
                <span>Ongwediva, Namibia</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
