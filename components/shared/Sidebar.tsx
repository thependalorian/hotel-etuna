/**
 * Sidebar — main app navigation (Design System v1.2.0 — dark chocolate rail)
 *
 * Purpose: Tenant-aware nav with clear hierarchy and ≥44px touch targets on mobile.
 * Visual: premium deep-chocolate rail (CI chocolate #2A1D15) with cream text and a gold
 * active accent, for a luxe contrast against the off-white content canvas.
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
  Lightbulb,
  Gauge,
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
  { href: "/command-centre", label: "Command centre", icon: Gauge, section: "Operations" },
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
  { href: "/intelligence", label: "Intelligence", icon: Lightbulb, section: "Admin" },
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
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "group relative flex min-h-touch-mobile items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-normal md:min-h-touch-desktop",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2A1D15]",
            isActive
              ? "bg-white/10 text-white shadow-sm"
              : "text-[#E9DDCD]/75 hover:bg-white/5 hover:text-white"
          )}
        >
          {/* Gold active accent bar */}
          <span
            className={cn(
              "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#D4AF37] transition-opacity",
              isActive ? "opacity-100" : "opacity-0"
            )}
            aria-hidden
          />
          <Icon
            className={cn(
              "h-5 w-5 shrink-0 transition-colors",
              isActive ? "text-[#D4AF37]" : "text-[#E9DDCD]/55 group-hover:text-[#E9DDCD]"
            )}
            aria-hidden
          />
          <span>{item.label}</span>
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
          "flex h-full w-64 flex-col border-r border-white/5 bg-gradient-to-b from-[#2A1D15] to-[#1B120C] text-[#E9DDCD]",
          "fixed left-0 top-0 z-40 transition-transform duration-slow ease-out-expo lg:sticky",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-4 md:p-6">
          <div className="flex flex-1 flex-col gap-2">
            <span className="inline-flex w-fit rounded-xl bg-[#F3E8D7] px-3 py-2 shadow-sm ring-1 ring-black/5">
              <HotelEtunaLogo size="sm" variant="compact" href="/dashboard" />
            </span>
            <p className="flex items-center gap-1.5 pl-1 text-xs font-medium text-[#C6A46A]">
              <span className="h-1 w-1 rounded-full bg-[#C6A46A]" aria-hidden />
              Ongwediva, Namibia
            </p>
          </div>
          <button
            type="button"
            onClick={() => onMobileClose?.()}
            className="flex min-h-touch-mobile min-w-touch-mobile items-center justify-center rounded-xl text-[#E9DDCD]/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] lg:hidden"
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
            <div key={section} className="mb-6 last:mb-0">
              <p className="px-4 pb-2 text-[0.66rem] font-bold uppercase tracking-[0.18em] text-[#C6A46A]/80">
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
                        <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#E9DDCD]/65 transition-colors hover:bg-white/5 hover:text-[#E9DDCD] [&::-webkit-details-marker]:hidden">
                          {label}
                          <span className="text-[#C6A46A]/70 transition-transform group-open:rotate-180" aria-hidden>
                            ▾
                          </span>
                        </summary>
                        <ul className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-1">
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

        <div className="border-t border-white/10 p-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-[#E9DDCD]/70">
            <p className="flex items-center gap-2 font-semibold text-white">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Sofia AI online
            </p>
            <p className="mt-1 pl-4">Tenant-aware operations assistant</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
