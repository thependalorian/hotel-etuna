/**
 * PropertyList Component
 *
 * Purpose: Route-level property listing wrapper used by platform admin pages.
 * Location: components/features/admin/platform/PropertyList.tsx
 */
'use client';

import PropertyManagement from '@/components/features/admin/platform/PropertyManagement';

interface PropertyWithCounts {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  property_type: string | null;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  base_price: number | null;
  status: string;
  is_featured: boolean;
  tenant_id: string;
  created_at: string;
  tenant_name: string | null;
  room_count: number;
}

interface PropertyListProps {
  properties: PropertyWithCounts[];
  userRole: string;
}

export default function PropertyList({ properties, userRole }: PropertyListProps) {
  return <PropertyManagement properties={properties} userRole={userRole} />;
}
