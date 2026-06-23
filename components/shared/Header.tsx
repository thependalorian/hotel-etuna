/**
 * Header Component - Design System v1.0.0
 * 
 * Purpose: Top navigation bar with search, notifications, and user menu
 * Location: /components/shared/Header.tsx
 * 
 * Features:
 * - Elevated surface with backdrop blur
 * - Global search functionality
 * - Notifications with badge indicator
 * - User menu dropdown
 * - Mobile-responsive design
 */

'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Bell, Search, User, LogOut, Settings, ChevronDown, Menu } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';
import { dashboardCopy } from '@/lib/copy/dashboard';
import { PropertySwitcher } from '@/components/features/property/PropertySwitcher';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

const Header = ({ onMobileMenuToggle }: HeaderProps) => {
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-16 bg-surface-elevated/95 backdrop-blur-md border-b border-nude-200 shadow-etuna-elevated sticky top-0 z-30">
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-4 flex-1">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => onMobileMenuToggle?.()}
            className="lg:hidden p-2 rounded-etuna-input hover:bg-nude-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-ink-800" aria-hidden="true" />
          </button>

          {/* Breadcrumbs - Desktop Only */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="text-ink-600 hover:text-ink-800 transition-colors">
              {dashboardCopy.breadcrumbToday}
            </Link>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <PropertySwitcher />
          {/* Search — disabled until global search ships (UX-STAFF-05) */}
          <div
            className="hidden md:flex relative opacity-60"
            title="Global search coming soon"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-600 pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search (coming soon)"
              aria-label="Search bookings, properties, and guests"
              disabled
              aria-disabled="true"
              className="w-64 h-10 pl-10 pr-4 rounded-full bg-nude-50 border border-nude-200 text-sm text-ink-800 placeholder:text-ink-600 cursor-not-allowed"
            />
          </div>

          {/* Notifications — disabled until inbox ships (UX-STAFF-05) */}
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Notifications coming soon"
            className={cn(
              'relative p-2 rounded-etuna-input transition-colors opacity-60 cursor-not-allowed',
              'min-w-[44px] min-h-[44px] flex items-center justify-center'
            )}
            aria-label="Notifications (coming soon)"
          >
            <Bell className="w-5 h-5 text-ink-600" aria-hidden="true" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={cn(
                'flex items-center gap-2 md:gap-3 rounded-full md:rounded-etuna-input bg-nude-50 px-2 md:px-3 py-2 transition-colors',
                'hover:bg-nude-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-primary',
                'min-h-[44px]'
              )}
              aria-label="User menu"
              aria-expanded={showUserMenu}
            >
              <div className="w-8 h-8 rounded-full bg-nude-300 flex items-center justify-center">
                <User className="w-4 h-4 text-ink-800" aria-hidden="true" />
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-ink-800">
                  {session?.user?.name?.split(' ')[0] || 'User'}
                </div>
                <div className="text-xs text-ink-600">
                  {session?.user?.email?.split('@')[0]}
                </div>
              </div>
              <ChevronDown 
                className={cn(
                  'hidden md:block w-4 h-4 text-ink-600 transition-transform duration-200',
                  showUserMenu && 'rotate-180'
                )} 
                aria-hidden="true" 
              />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-etuna-card border border-nude-200 bg-white shadow-etuna-elevated animate-scale-in z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-nude-200">
                    <p className="text-sm font-semibold text-ink-800">
                      {session?.user?.name || 'User'}
                    </p>
                    <p className="text-xs text-ink-600 truncate">
                      {session?.user?.email}
                    </p>
                  </div>
                  <div className="py-2">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-nude-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4 text-ink-600" aria-hidden="true" />
                      <span className="text-sm font-medium text-ink-800">Profile</span>
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-nude-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="w-4 h-4 text-ink-600" aria-hidden="true" />
                      <span className="text-sm font-medium text-ink-800">Settings</span>
                    </Link>
                  </div>
                  <div className="border-t border-nude-200">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        signOut({ callbackUrl: '/' });
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-semantic-error-light text-semantic-error w-full text-left transition-colors"
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                      <span className="text-sm font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;