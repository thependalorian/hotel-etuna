/**
 * Sidebar — main app navigation (Design System v1.0.0)
 *
 * Purpose: Tenant-aware nav with clear hierarchy and ≥44px touch targets on mobile.
 * Location: components/shared/Sidebar.tsx
 */

"use client";

import React, { useEffect, useRef, type ElementRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  X,
  BedDouble,
  UtensilsCrossed,
  BookOpenCheck,
  LifeBuoy,
  AlertTriangle,
  ClipboardCheck,
  QrCode,
  Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { HotelEtunaLogo } from '@/components/brand/HotelEtunaLogo';
import { useSession } from "next-auth/react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section: "Operations" | "Experience" | "Risk" | "Admin";
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Command center", icon: LayoutDashboard, section: "Operations" },
  { href: "/properties", label: "Properties", icon: Building2, section: "Operations" },
  { href: "/rooms", label: "Rooms", icon: BedDouble, section: "Operations" },
  { href: "/bookings", label: "Bookings", icon: Calendar, section: "Operations" },
  { href: "/payments/desk", label: "Payments desk", icon: QrCode, section: "Operations" },
  { href: "/payments/reconciliation", label: "Cash reconciliation", icon: Banknote, section: "Operations" },
  { href: "/restaurant/orders", label: "Restaurant orders", icon: UtensilsCrossed, section: "Operations" },
  { href: "/restaurant/menu", label: "Restaurant menu", icon: BookOpenCheck, section: "Operations" },
  { href: "/crm/guests", label: "Guest CRM", icon: Users, section: "Experience" },
  { href: "/crm/knowledge", label: "Sofia knowledge", icon: FileText, section: "Experience" },
  { href: "/ai", label: "Sofia AI", icon: Bot, section: "Experience" },
  { href: "/sofia/email", label: "Sofia email", icon: LifeBuoy, section: "Experience" },
  { href: "/staff", label: "Staff", icon: ClipboardCheck, section: "Risk" },
  { href: "/compliance/kyc", label: "KYC / KYB", icon: Shield, section: "Risk" },
  { href: "/compliance/soc2", label: "SOC 2 readiness", icon: Shield, section: "Risk" },
  { href: "/fraud", label: "Fraud alerts", icon: AlertTriangle, section: "Risk" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, section: "Admin" },
  { href: "/admin/platform/support", label: "Support", icon: LifeBuoy, section: "Admin" },
  { href: "/admin", label: "Admin", icon: Shield, section: "Admin" },
  { href: "/settings", label: "Settings", icon: Settings, section: "Admin" },
  { href: "/profile", label: "Profile", icon: User, section: "Admin" },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar = ({ isMobileOpen = false, onMobileClose }: SidebarProps) => {
  const pathname = usePathname();
  const asideRef = useRef<ElementRef<"aside">>(null);
  const { data: session } = useSession();
  const role = String(session?.user?.role ?? '').toLowerCase();
  const isPartner = role.startsWith('partner');

  const visibleNavItems = isPartner
    ? navItems.filter((item) =>
        [
          "/dashboard",
          "/properties",
          "/rooms",
          "/bookings",
          "/settings",
        ].includes(item.href)
      )
    : navItems;

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
          "flex h-full w-64 flex-col border-r border-nude-200 bg-surface-sidebar text-nude-900 shadow-nude-soft",
          "fixed left-0 top-0 z-40 transition-transform duration-slow ease-out-expo lg:sticky",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between border-b border-nude-200 p-4 md:p-6">
          <div className="group flex flex-1 flex-col gap-1">
            <HotelEtunaLogo size="sm" href="/dashboard" />
            <p className="text-xs font-medium text-terracotta-800 pl-1">Ongwediva, Namibia</p>
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

        <nav className="scrollbar-thin flex-1 overflow-y-auto p-4" aria-label="Main navigation">
          {(["Operations", "Experience", "Risk", "Admin"] as const).map((section) => {
            const sectionItems = visibleNavItems.filter((item) => item.section === section);
            if (sectionItems.length === 0) return null;
            return (
            <div key={section} className="mb-5 last:mb-0">
              <p className="px-4 pb-2 text-[0.68rem] font-bold uppercase tracking-widest text-nude-500">
                {section}
              </p>
              <ul className="space-y-1">
                {sectionItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex min-h-touch-mobile items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all duration-normal md:min-h-touch-desktop",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nude-500 focus-visible:ring-offset-2",
                            isActive
                              ? "border border-nude-200 bg-surface-elevated text-nude-900 shadow-nude-soft"
                              : "text-nude-700 hover:border-nude-200/80 hover:bg-nude-50/90 hover:text-nude-900",
                            !isActive && "hover:-translate-y-px"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-5 w-5 shrink-0",
                              isActive ? "text-nude-600" : "text-nude-500"
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
            </div>
          );
          })}
        </nav>

        <div className="border-t border-nude-200 p-4">
          <div className="rounded-xl border border-nude-200 bg-nude-50/90 p-3 text-xs text-nude-700 shadow-inner">
            <p className="font-semibold text-nude-900">Sofia AI online</p>
            <p>Tenant-aware operations assistant</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
