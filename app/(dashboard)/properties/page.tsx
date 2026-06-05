/**
 * Properties List Page
 * 
 * Purpose: Display and manage all properties in a responsive grid
 * Location: /app/(dashboard)/properties/page.tsx
 * 
 * Design System v1.0.0:
 * - PageHeader component with actions
 * - Grid layout: 1 → 2 → 3 columns (mobile → tablet → desktop)
 * - Property cards with interactive Card variant
 * - EmptyState component when no properties
 * - Staggered animations on load
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
          title="Properties"
          description="Manage your hotels, restaurants, and venues"
          actions={
            <Link 
              href="/properties/new" 
              className="btn btn-primary gentle-lift min-h-[44px] shadow-nude-soft hover:shadow-nude-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Property
            </Link>
          }
        />

        {properties && properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {properties.map((property, index) => (
              <div 
                key={property.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <PropertyCard property={property} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Properties Found"
            description="Get started by adding your first property to begin managing your hospitality business."
            action={{
              label: "Create Your First Property",
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
