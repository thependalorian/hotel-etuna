/**
 * PlatformSidebar — Navigation for Buffr platform operators
 *
 * Purpose: Sidebar for super-admin platform management (tenants, users, properties, billing, SOC2, audit).
 * Location: /components/shared/PlatformSidebar.tsx
 *
 * Features:
 * - Platform-specific nav items (Tenants, Users, Properties, Support, etc.)
 * - Same responsive drawer behavior as staff/partner sidebars
 * - Distinct branding (Buffr platform vs Hotel Etuna)
 * - Follows Part 9: daisyUI, touch targets, accessibility
 */

'use client';

import React, { useEffect, useRef, type ElementRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  LifeBuoy,
  CreditCard,
  Shield,
  FileText,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { HotelEtunaLogo } from '@/components/brand/HotelEtunaLogo';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const platformNavItems: NavItem[] = [
  { href: '/admin/platform/tenants', label: 'Tenants', icon: LayoutDashboard },
  { href: '/admin/platform/users', label: 'Users', icon: Users },
  { href: '/admin/platform/properties', label: 'Properties', icon: Building2 },
  { href: '/admin/platform/support', label: 'Support tickets', icon: LifeBuoy },
  { href: '/admin/platform/billing', label: 'Platform billing', icon: CreditCard },
  { href: '/admin/platform/soc2', label: 'SOC2 evidence', icon: Shield },
  { href: '/admin/platform/audit', label: 'Audit log', icon: FileText },
  { href: '/admin/platform/settings', label: 'Settings', icon: Settings },
];

interface PlatformSidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function PlatformSidebar({ isMobileOpen = false, onMobileClose }: PlatformSidebarProps) {
  const pathname = usePathname();
  const asideRef = useRef<ElementRef<'aside'>>(null);

  useEffect(() => {
    if (pathname && isMobileOpen) {
      onMobileClose?.();
    }
  }, [pathname, isMobileOpen, onMobileClose]);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const mq = window.matchMedia('(max-width: 1023px)');

    const syncScrollLock = () => {
      if (mq.matches && isMobileOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };

    syncScrollLock();
    mq.addEventListener('change', syncScrollLock);

    return () => {
      mq.removeEventListener('change', syncScrollLock);
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  return (
    <>
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-nude-900/40 backdrop-blur-sm"
          onClick={() => onMobileClose?.()}
          aria-hidden
        />
      )}

      <aside
        ref={asideRef}
        className={cn(
          'flex h-full w-64 flex-col border-r border-nude-200 bg-surface-sidebar text-nude-900 shadow-nude-soft',
          'fixed left-0 top-0 z-40 transition-transform duration-slow ease-out-expo lg:sticky',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between border-b border-nude-200 p-4 md:p-6">
          <div className="group flex flex-1 flex-col gap-1">
            <HotelEtunaLogo size="sm" href="/admin/platform" />
            <p className="text-xs font-medium text-terracotta-800 pl-1">Platform Console</p>
          </div>
          <button
            type="button"
            onClick={() => onMobileClose?.()}
            className="flex min-h-touch-mobile min-w-touch-mobile items-center justify-center rounded-lg text-nude-700 transition-colors hover:bg-nude-200/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nude-500 focus-visible:ring-offset-2 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <nav className="scrollbar-thin flex-1 overflow-y-auto p-4" aria-label="Platform navigation">
          <div className="mb-2">
            <p className="px-4 pb-2 text-[0.68rem] font-bold uppercase tracking-widest text-nude-500">
              Platform Management
            </p>
          </div>
          <ul className="space-y-1">
            {platformNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex min-h-touch-mobile items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all duration-normal md:min-h-touch-desktop',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nude-500 focus-visible:ring-offset-2',
                      isActive
                        ? 'border border-nude-200 bg-surface-elevated text-nude-900 shadow-nude-soft'
                        : 'text-nude-700 hover:border-nude-200/80 hover:bg-nude-50/90 hover:text-nude-900',
                      !isActive && 'hover:-translate-y-px'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 shrink-0',
                        isActive ? 'text-nude-600' : 'text-nude-500'
                      )}
                      aria-hidden
                    />
                    <span>{item.label}</span>
                    {isActive ? (
                      <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-nude-500" aria-hidden />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-nude-200 p-4">
          <div className="rounded-xl border border-nude-200 bg-nude-50/90 p-3 text-xs text-nude-700 shadow-inner">
            <p className="font-semibold text-nude-900">Super-admin access</p>
            <p>Buffr platform operations</p>
          </div>
        </div>
      </aside>
    </>
  );
}
