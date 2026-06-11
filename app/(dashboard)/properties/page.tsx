/**
 * Property Page
 * 
 * Purpose: View and manage Hotel Etuna's property details.
 * Location: /app/(dashboard)/properties/page.tsx
 * 
 * Design System v1.0.0:
 * - PageHeader component with actions
 * - Single property card (Hotel Etuna is a single-property OS)
 * - EmptyState component when no property seeded
 */

import React from 'react';
import PropertyCard from '@/components/features/property/PropertyCard';
import { PropertyService } from '@/lib/services/property/PropertyService';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { AppError } from '@/lib/utils/errors';
import Link from 'next/link';
import EmptyState from '@/components/shared/EmptyState';
import PageHeader from '@/components/shared/PageHeader';
import { Plus } from 'lucide-react';
import { securityLogger } from '@/lib/utils/security-logger.client';

export const dynamic = 'force-dynamic';

async function getProperties() {
  try {
    const session = await getSessionWithTenantContext();
    if (!session || !session.user?.tenantId) {
      throw new AppError(401, 'Unauthorized');
    }
    const propertyService = new PropertyService();
    const properties = await propertyService.getPropertiesByTenant(session.user.tenantId as string);
    return Array.isArray(properties) ? properties : [];
  } catch (error) {
    securityLogger.error("[PropertiesPage] load error", error);
    return [];
  }
}

const PropertiesPage = async () => {
  const properties = await getProperties();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Property"
          description="Manage your hotel's details, rooms, and services."
          actions={
            <Link 
              href="/properties/new" 
              className="btn btn-primary gentle-lift min-h-[44px] shadow-nude-soft hover:shadow-nude-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Edit Property
            </Link>
          }
        />

        {properties && properties.length > 0 ? (
          <div className="max-w-2xl">
            {properties.map((property) => (
              <div key={property.id} className="animate-slide-up">
                <PropertyCard property={property} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Property Found"
            description="Set up Hotel Etuna to begin managing your operations."
            action={{
              label: "Set Up Your Property",
              href: "/properties/new"
            }}
            size="md"
          />
        )}
      </div>
    </div>
  );
};

export default PropertiesPage;
