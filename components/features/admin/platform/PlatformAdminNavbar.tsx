/**
 * Platform Admin Navbar Component
 * 
 * Purpose: Navigation bar for platform admin dashboard
 * Location: components/features/admin/platform/PlatformAdminNavbar.tsx
 * 
 * Features:
 * - Platform admin navigation links
 * - User info display
 * - Active route highlighting
 * - Responsive design
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  BarChart3,
  HelpCircle,
  FileText,
  Shield,
  Bot,
  KeyRound,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface PlatformAdminNavbarProps {
  user: {
    email: string;
    role: string;
    first_name?: string | null;
    last_name?: string | null;
  };
}

const navItems = [
  { href: '/admin/platform', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/platform/tenants', label: 'Tenants', icon: Building2 },
  { href: '/admin/platform/users', label: 'Users', icon: Users },
  { href: '/admin/platform/properties', label: 'Properties', icon: Building2 },
  { href: '/admin/platform/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/platform/ai-observability', label: 'AI observability', icon: Bot },
  { href: '/admin/platform/secrets', label: 'Secrets', icon: KeyRound },
  { href: '/admin/platform/support', label: 'Support', icon: HelpCircle },
  { href: '/admin/platform/audit', label: 'Audit Logs', icon: FileText },
  { href: '/admin/platform/settings', label: 'Settings', icon: Settings },
];

export default function PlatformAdminNavbar({ user }: PlatformAdminNavbarProps) {
  const pathname = usePathname();
  const isSuperAdmin = user.role === 'super-admin';

  return (
    <nav className="bg-base-100 shadow-lg border-b border-base-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <Shield className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold">Platform Admin</h1>
              <p className="text-xs text-base-content/70">
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              
              // Hide settings for non-super-admins
              if (item.href === '/admin/platform/settings' && !isSuperAdmin) {
                return null;
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    'hover:bg-base-200 min-h-[44px] flex items-center gap-2',
                    isActive
                      ? 'bg-primary text-primary-content'
                      : 'text-base-content hover:text-primary'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">
                {user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user.email}
              </p>
              <p className="text-xs text-base-content/70">{user.email}</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
