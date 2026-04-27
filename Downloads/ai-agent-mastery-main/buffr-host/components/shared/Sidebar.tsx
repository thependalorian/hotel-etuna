/**
 * Sidebar Component - Enhanced Navigation
 * 
 * Purpose: Main navigation sidebar with active states and icons
 * Location: /components/shared/Sidebar.tsx
 * 
 * Features:
 * - Active route highlighting (Jakob's Law - familiar patterns)
 * - Icon-based navigation (Miller's Law - visual chunking)
 * - Smooth transitions (Doherty Threshold)
 * - Responsive design
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building2, 
  Calendar, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  User,
  Shield,
  Bot,
  Menu,
  X,
  BedDouble,
  UtensilsCrossed,
  BookOpenCheck,
  LifeBuoy,
  AlertTriangle,
  ClipboardCheck
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section: 'Operations' | 'Experience' | 'Risk' | 'Admin';
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Command center', icon: LayoutDashboard, section: 'Operations' },
  { href: '/properties', label: 'Properties', icon: Building2, section: 'Operations' },
  { href: '/rooms', label: 'Rooms', icon: BedDouble, section: 'Operations' },
  { href: '/bookings', label: 'Bookings', icon: Calendar, section: 'Operations' },
  { href: '/restaurant/orders', label: 'Restaurant orders', icon: UtensilsCrossed, section: 'Operations' },
  { href: '/restaurant/menu', label: 'Restaurant menu', icon: BookOpenCheck, section: 'Operations' },
  { href: '/crm', label: 'Guest CRM', icon: Users, section: 'Experience' },
  { href: '/crm/knowledge', label: 'Sofia knowledge', icon: FileText, section: 'Experience' },
  { href: '/ai', label: 'Sofia AI', icon: Bot, section: 'Experience' },
  { href: '/sofia/email', label: 'Sofia email', icon: LifeBuoy, section: 'Experience' },
  { href: '/staff', label: 'Staff', icon: ClipboardCheck, section: 'Risk' },
  { href: '/compliance/kyc', label: 'KYC / KYB', icon: Shield, section: 'Risk' },
  { href: '/fraud', label: 'Fraud alerts', icon: AlertTriangle, section: 'Risk' },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, section: 'Admin' },
  { href: '/admin/platform/support', label: 'Support', icon: LifeBuoy, section: 'Admin' },
  { href: '/admin', label: 'Admin', icon: Shield, section: 'Admin' },
  { href: '/settings', label: 'Settings', icon: Settings, section: 'Admin' },
  { href: '/profile', label: 'Profile', icon: User, section: 'Admin' },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar = ({ isMobileOpen = false, onMobileClose }: SidebarProps) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    if (pathname && (isOpen || isMobileOpen)) {
      setIsOpen(false);
      if (onMobileClose) {
        onMobileClose();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-base-200 hover:bg-base-300 rounded-lg p-3 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-lg border border-base-300 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-primary"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-base-content" />
        ) : (
          <Menu className="w-5 h-5 text-base-content" />
        )}
      </button>

      {/* Mobile Overlay */}
      {(isOpen || isMobileOpen) && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => {
            setIsOpen(false);
            onMobileClose?.();
          }}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'bg-surface-sidebar text-white border-r border-white/10 flex flex-col h-full shadow-2xl',
          'fixed lg:sticky top-0 left-0 z-40',
          'w-64 transition-transform duration-300 ease-out',
          // Mobile: slide in/out, Desktop: always visible
          (isOpen || isMobileOpen) ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
      {/* Logo/Brand (Halo Effect - Beauty = Trust) */}
      <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group flex-1">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-brand-300 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-300 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-md">
              <span className="text-2xl font-bold text-white">H</span>
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-display text-white">Buffr Host</div>
            <div className="text-xs font-medium text-white/55">Hospitality OS</div>
          </div>
        </Link>
        {/* Mobile Close Button */}
        <button
          onClick={() => {
            setIsOpen(false);
            onMobileClose?.();
          }}
          className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Navigation (Hick's Law - limit to 5-7 items, Miller's Law - chunked) */}
      <nav className="flex-1 p-4 overflow-y-auto scrollbar-thin">
        {(['Operations', 'Experience', 'Risk', 'Admin'] as const).map((section) => (
          <div key={section} className="mb-5 last:mb-0">
            <p className="px-4 pb-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white/35">
              {section}
            </p>
            <ul className="space-y-1">
          {navItems.filter((item) => item.section === section).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href);
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    // Base styles (Fitt's Law - 44px minimum touch target, Doherty Threshold - <400ms)
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    'min-h-[44px] font-medium',
                    // Active state (Von Restorff - standout)
                    isActive 
                      ? 'bg-white text-ink-950 shadow-lg' 
                      : 'text-white/68 hover:bg-white/10 hover:text-white',
                    // Focus state (Accessibility)
                    'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
                    // Hover lift (Fitt's Law - clear feedback)
                    !isActive && 'hover:-translate-y-0.5'
                  )}
                >
                  <Icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-brand-600' : 'text-white/45')} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-brand-500"></div>
                  )}
                </Link>
              </li>
            );
          })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="rounded-2xl bg-white/8 p-3 text-xs text-white/58">
          <p className="font-semibold text-white/85">Sofia AI online</p>
          <p>Tenant-aware operations assistant</p>
        </div>
      </div>
      </aside>
    </>
  );
};

export default Sidebar;