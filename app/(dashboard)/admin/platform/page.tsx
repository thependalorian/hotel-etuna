/**
 * Platform Admin Dashboard Overview
 * 
 * Purpose: Main dashboard page for platform administrators
 * Location: app/(dashboard)/admin/platform/page.tsx
 * 
 * Database: Uses Drizzle ORM with Neon PostgreSQL
 */

import React from 'react';
import { getCurrentPlatformAdmin } from '@/lib/auth/platform-admin';
import PlatformDashboardOverviewClient from '@/components/features/admin/platform/PlatformDashboardOverview';
import { db, tenants, users, properties, bookings } from '@/lib/db';
import { desc, sql } from 'drizzle-orm';
import { getComplianceSnapshot } from '@/lib/compliance/compliance-snapshot';
import type { ComplianceSnapshot } from '@/lib/compliance/compliance-snapshot';
import { getNamibiaPaymentRailsSummary, labelForRailBucket } from '@/lib/payments/namibia-payment-rails';
import { getPaymentsByRailSince } from '@/lib/compliance/payments-by-rail';

const PAYMENT_RAIL_REPORT_DAYS = 7;

interface PlatformStats {
  totalTenants: number;
  totalUsers: number;
  totalProperties: number;
  totalBookings: number;
  activeBookings: number;
  totalRevenue: number;
  recentTenants: Array<{
    id: string;
    name: string;
    status: string;
    created_at: string;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
  compliance: ComplianceSnapshot;
}

export default async function PlatformAdminDashboard() {
  const user = await getCurrentPlatformAdmin();
  
  if (!user) {
    return null; // Layout will handle redirect
  }

  // Fetch platform statistics using Drizzle ORM
  const [tenantCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tenants);

  const [userCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(sql`${users.role} NOT IN ('super-admin')`);

  const [propertyCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(properties);

  const [bookingCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookings);

  // Get active bookings
  const [activeBookingCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookings)
    .where(sql`${bookings.status} IN ('confirmed', 'checked_in')`);

  // Get recent tenants
  const recentTenantsData = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      status: tenants.status,
      created_at: tenants.createdAt,
    })
    .from(tenants)
    .orderBy(desc(tenants.createdAt))
    .limit(5);

  // Calculate total revenue (simplified - actual implementation would sum amounts)
  const [revenueResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(total_amount), 0)` })
    .from(bookings);

  const compliance = await getComplianceSnapshot();
  const paymentRails = getNamibiaPaymentRailsSummary();
  const paymentSince = new Date(
    Date.now() - PAYMENT_RAIL_REPORT_DAYS * 24 * 60 * 60 * 1000
  );
  const paymentsByRail = {
    windowDays: PAYMENT_RAIL_REPORT_DAYS,
    rows: (await getPaymentsByRailSince(paymentSince)).map((r) => ({
      ...r,
      label: labelForRailBucket(r.bucket),
    })),
  };

  // Monthly revenue data (mock for now - would need more complex query)
  const monthlyRevenue = [
    { month: 'Jan', revenue: 45000 },
    { month: 'Feb', revenue: 52000 },
    { month: 'Mar', revenue: 48000 },
    { month: 'Apr', revenue: 61000 },
    { month: 'May', revenue: 55000 },
    { month: 'Jun', revenue: 67000 },
  ];

  const stats: PlatformStats = {
    totalTenants: Number(tenantCount?.count || 0),
    totalUsers: Number(userCount?.count || 0),
    totalProperties: Number(propertyCount?.count || 0),
    totalBookings: Number(bookingCount?.count || 0),
    activeBookings: Number(activeBookingCount?.count || 0),
    totalRevenue: Number(revenueResult?.total || 0),
    recentTenants: recentTenantsData.map((t) => ({
      id: t.id,
      name: t.name,
      status: t.status ?? 'active',
      created_at: t.created_at ? (t.created_at instanceof Date ? t.created_at.toISOString() : String(t.created_at)) : '',
    })),
    monthlyRevenue,
    compliance,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="buffr-page-title mb-2">Platform Dashboard</h1>
        <p className="text-base-content/70">
          Overview of the Buffr Host platform
        </p>
      </div>

      <PlatformDashboardOverviewClient
        stats={stats}
        userRole={user.role ?? 'admin'}
        paymentRails={paymentRails}
        paymentsByRail={paymentsByRail}
      />
    </div>
  );
}
