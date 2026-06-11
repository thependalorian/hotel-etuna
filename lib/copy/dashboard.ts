/**
 * Staff dashboard copy — single-property Hotel Etuna OS (not Buffr Host SaaS voice).
 * Location: lib/copy/dashboard.ts
 */

import { brand } from '@/lib/copy/brand';
import { platformConsole } from '@/lib/config/platform-console';

export const dashboardCopy = {
  homeEyebrow: `Today at ${brand.name}`,
  homeLead: brand.leadLine,
  homeSubtitle:
    'Bookings, guest care, restaurant, and payments — everything for your property in one place.',
  nav: {
    today: 'Today',
    property: 'Property',
    platformConsole: platformConsole.navLabel,
    platformFees: 'Platform fees',
  },
  breadcrumbToday: 'Today',
  billing: {
    platformFeesTitle: 'Platform fees',
    platformFeesDesc:
      'Guest card revenue settles to your property account. Monthly platform and processing fees are invoiced separately.',
    providerAccount: 'Platform provider account',
  },
} as const;
