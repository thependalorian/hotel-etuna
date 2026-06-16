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
  Bot,
  X,
  UtensilsCrossed,
  BookOpenCheck,
  MessageCircle,
  Mail,
  Headphones,
  ClipboardCheck,
  QrCode,
  Banknote,
  Sparkles,
  Gift,
  UserCheck,
  Receipt,
  CreditCard,
  FileBarChart,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { HotelEtunaLogo } from '@/components/brand/HotelEtunaLogo';
import { dashboardCopy } from '@/lib/copy/dashboard';
import { useSession } from "next-auth/react";
import { isPlatformAdminRole } from "@/lib/auth/roles";
import { hubTeamNavHrefAllowed } from "@/lib/auth/hub-team";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section: "Operations" | "Experience" | "Admin";
  platformOnly?: boolean;
  /** Nested group within Experience — reduces flat nav overload (UX-STAFF-06). */
  experienceGroup?: "guests" | "sofia";
}

const EXPERIENCE_GROUPS = [
  { key: "guests" as const, label: "Guests & loyalty" },
  { key: "sofia" as const, label: "Sofia & comms" },
];

const navItems: NavItem[] = [
  { href: "/dashboard", label: dashboardCopy.nav.today, icon: LayoutDashboard, section: "Operations" },
  { href: "/properties", label: dashboardCopy.nav.property, icon: Building2, section: "Operations" },
  { href: "/bookings", label: "Bookings", icon: Calendar, section: "Operations" },
  { href: "/housekeeping", label: "Housekeeping", icon: Sparkles, section: "Operations" },
  { href: "/payments/desk", label: "Payments desk", icon: QrCode, section: "Operations" },
  { href: "/payments/reconciliation", label: "Payment reconciliation", icon: Banknote, section: "Operations" },
  { href: "/restaurant/orders", label: "Restaurant orders", icon: UtensilsCrossed, section: "Operations" },
  { href: "/restaurant/menu", label: "Restaurant menu", icon: BookOpenCheck, section: "Operations" },
  { href: "/crm", label: "Guest CRM", icon: Users, section: "Experience", experienceGroup: "guests" },
  { href: "/crm/reviews", label: "Reviews", icon: FileText, section: "Experience", experienceGroup: "guests" },
  { href: "/crm/introducers", label: "Introducers", icon: UserCheck, section: "Experience", experienceGroup: "guests" },
  { href: "/crm/loyalty/catalog", label: "Loyalty catalog", icon: Gift, section: "Experience", experienceGroup: "guests" },
  { href: "/crm/loyalty/transactions", label: "Loyalty ledger", icon: Receipt, section: "Experience", experienceGroup: "guests" },
  { href: "/cms/pages", label: "CMS pages", icon: PanelLeft, section: "Experience", experienceGroup: "sofia" },
  { href: "/crm/knowledge", label: "Sofia knowledge", icon: FileText, section: "Experience", experienceGroup: "sofia" },
  { href: "/ai", label: "Sofia AI", icon: Bot, section: "Experience", experienceGroup: "sofia" },
  { href: "/communications", label: "Communications", icon: MessageCircle, section: "Experience", experienceGroup: "sofia" },
  { href: "/sofia/email", label: "Sofia email", icon: Mail, section: "Experience", experienceGroup: "sofia" },
  { href: "/staff", label: "Staff", icon: ClipboardCheck, section: "Operations" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, section: "Admin" },
  { href: "/reports/accounting", label: "Accounting", icon: FileBarChart, section: "Admin" },
  { href: "/reports/property-vat", label: "VAT report", icon: FileBarChart, section: "Admin" },
  {
    href: "/payments/platform-billing",
    label: dashboardCopy.nav.platformFees,
    icon: CreditCard,
    section: "Admin",
    platformOnly: true,
  },
  {
    href: "/admin/platform/support",
    label: "Support",
    icon: Headphones,
    section: "Admin",
    platformOnly: true,
  },
  { href: "/admin", label: dashboardCopy.nav.platformConsole, icon: LayoutDashboard, section: "Admin", platformOnly: true },
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
  const role = String(session?.user?.role ?? '');
  const roleLower = role.toLowerCase();
  const isPartner = roleLower.startsWith('partner');
  const isPlatformOperator =
    isPlatformAdminRole(role) &&
    String(session?.user?.email ?? '')
      .toLowerCase()
      .endsWith('@buffr.ai');

  const userEmail = String(session?.user?.email ?? '');

  const renderNavLink = (item: NavItem) => {
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
            className={cn("h-5 w-5 shrink-0", isActive ? "text-nude-600" : "text-nude-500")}
            aria-hidden
          />
          <span>{item.label}</span>
          {isActive ? (
            <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-nude-500" aria-hidden />
          ) : null}
        </Link>
      </li>
    );
  };

  const visibleNavItems = isPartner
    ? navItems.filter((item) =>
        ['/dashboard', '/properties', '/bookings', '/settings'].includes(item.href),
      )
    : navItems.filter((item) => {
        if (item.platformOnly && !isPlatformOperator) return false;
        return hubTeamNavHrefAllowed(userEmail, role, item.href);
      });

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
          {(["Operations", "Experience", "Admin"] as const).map((section) => {
            const sectionItems = visibleNavItems.filter((item) => item.section === section);
            if (sectionItems.length === 0) return null;
            return (
            <div key={section} className="mb-5 last:mb-0">
              <p className="px-4 pb-2 text-[0.68rem] font-bold uppercase tracking-widest text-nude-500">
                {section}
              </p>
              {section === "Experience" ? (
                <div className="space-y-1">
                  {EXPERIENCE_GROUPS.map(({ key, label }) => {
                    const groupItems = sectionItems.filter((item) => item.experienceGroup === key);
                    if (groupItems.length === 0) return null;
                    const groupActive = groupItems.some(
                      (item) => pathname === item.href || pathname?.startsWith(`${item.href}/`),
                    );
                    return (
                      <details key={key} className="group px-1" open={groupActive}>
                        <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-nude-600 hover:bg-nude-50/90 [&::-webkit-details-marker]:hidden">
                          {label}
                          <span className="text-nude-400 transition-transform group-open:rotate-180" aria-hidden>
                            ▾
                          </span>
                        </summary>
                        <ul className="mt-1 space-y-1 border-l border-nude-200/80 ml-4 pl-1">
                          {groupItems.map((item) => renderNavLink(item))}
                        </ul>
                      </details>
                    );
                  })}
                </div>
              ) : (
                <ul className="space-y-1">{sectionItems.map((item) => renderNavLink(item))}</ul>
              )}
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
