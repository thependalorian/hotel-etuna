/**
 * TenantList Component
 *
 * Purpose: Route-level tenant listing wrapper used by platform admin pages.
 * Location: components/features/admin/platform/TenantList.tsx
 */
'use client';

import TenantManagement from '@/components/features/admin/platform/TenantManagement';

interface TenantWithCounts {
  id: string;
  name: string;
  subdomain: string | null;
  domain: string | null;
  status: string;
  room_count: number;
  property_type: string | null;
  has_restaurant_features: boolean;
  created_at: string;
  updated_at: string;
  user_count: number;
  property_count: number;
}

interface TenantListProps {
  tenants: TenantWithCounts[];
  userRole: string;
}

export default function TenantList({ tenants, userRole }: TenantListProps) {
  return <TenantManagement tenants={tenants} userRole={userRole} />;
}
