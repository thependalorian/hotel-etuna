/**
 * Header Component - Enhanced Dashboard Header
 * 
 * Purpose: Top navigation bar with user menu and notifications
 * Location: /components/shared/Header.tsx
 * 
 * Features:
 * - User profile menu
 * - Notifications indicator
 * - Search functionality (future)
 * - Responsive design
 */

'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Bell, Search, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Avatar } from '@/components/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Command Center',
  '/properties': 'Properties',
  '/rooms': 'Rooms',
  '/bookings': 'Bookings',
  '/restaurant/orders': 'Restaurant Orders',
  '/restaurant/menu': 'Restaurant Menu',
  '/crm/knowledge': 'Sofia Knowledge',
  '/crm': 'Guest CRM',
  '/ai': 'Sofia AI',
  '/sofia/email': 'Sofia Email',
  '/staff': 'Staff',
  '/compliance/kyc': 'KYC / KYB',
  '/fraud': 'Fraud Alerts',
  '/analytics': 'Analytics',
  '/admin/platform/support': 'Support',
  '/admin': 'Admin',
  '/settings': 'Settings',
  '/profile': 'Profile',
};

function getTitle(pathname: string | null): string {
  if (!pathname) return 'Dashboard';
  const match = Object.keys(pageTitles)
    .sort((a, b) => b.length - a.length)
    .find((key) => pathname === key || pathname.startsWith(`${key}/`));
  return match ? pageTitles[match] : 'Dashboard';
}

const Header = () => {
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-base-300/70 bg-surface-canvas/82 px-4 py-3 shadow-sm backdrop-blur-xl sm:px-6 sm:py-4">
      <div className="flex items-center justify-between gap-4">
      {/* Left Section - Title/Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <div className="min-w-0">
          <p className="hidden text-xs font-bold uppercase tracking-[0.18em] text-ink-400 sm:block">
            Buffr Host Operations
          </p>
          <h1 className="truncate text-xl font-black text-ink-950 sm:text-2xl md:text-3xl">
            {title}
          </h1>
        </div>
        {/* Search Bar (Hick's Law - progressive disclosure) */}
        <div className="hidden lg:flex items-center gap-2 flex-1 max-w-md ml-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search guests, bookings, rooms..."
              className="min-h-[44px] w-full rounded-2xl border border-base-300 bg-white/80 py-3 pl-11 pr-4 text-sm text-ink-900 shadow-xs placeholder:text-ink-400 transition-all duration-200 hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
            />
          </div>
        </div>
      </div>

      {/* Right Section - Actions & User Menu */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Notifications (Von Restorff - visual distinction) */}
        <button
          className={cn(
            'relative p-2 rounded-xl transition-all duration-200',
            'hover:bg-white/80 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            'min-w-[44px] min-h-[44px] flex items-center justify-center'
          )}
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-ink-600" />
          <span className="absolute top-1 right-1 w-3 h-3 bg-error rounded-full border-2 border-surface-canvas" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={cn(
              'flex items-center gap-3 rounded-2xl bg-white/55 px-3 py-2 shadow-xs transition-all duration-200',
              'hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              'min-h-[44px]'
            )}
            aria-label="User menu"
          >
            <Avatar
              src={session?.user?.image || null}
              name={session?.user?.name || session?.user?.email || 'User'}
              size="md"
              showOnline
              isOnline={true}
            />
            <div className="hidden md:block text-left">
              <div className="text-sm font-bold text-ink-900">
                {session?.user?.name?.split(' ')[0] || session?.user?.email?.split('@')[0] || 'User'}
              </div>
              <div className="text-xs text-ink-500">
                {session?.user?.email}
              </div>
            </div>
            <ChevronDown className={cn(
              'w-4 h-4 text-ink-500 transition-transform duration-200',
              showUserMenu && 'transform rotate-180'
            )} />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-base-300 bg-white py-2 shadow-card animate-scale-in z-50">
              <Link
                href="/profile"
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-50 transition-colors duration-200"
                onClick={() => setShowUserMenu(false)}
              >
                <User className="w-4 h-4 text-ink-500" />
                <span className="text-sm text-ink-800">Profile</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-50 transition-colors duration-200"
                onClick={() => setShowUserMenu(false)}
              >
                <Settings className="w-4 h-4 text-ink-500" />
                <span className="text-sm text-ink-800">Settings</span>
              </Link>
              <div className="border-t border-base-300 my-2" />
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  signOut({ callbackUrl: '/' });
                }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-error/10 text-error w-full text-left transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
      </div>
    </header>
  );
};

export default Header;