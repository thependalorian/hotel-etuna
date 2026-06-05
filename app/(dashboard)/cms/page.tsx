/**
 * CMS Page - Content Management System
 *
 * Purpose: Manage content and media for properties
 * Location: /app/(dashboard)/cms/page.tsx
 *
 * Features:
 * - Content management (descriptions, policies, pages)
 * - Media library (images, videos, documents)
 * - Property-specific content organization
 * - Version control and publishing workflow
 */

import React from 'react';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { redirect } from 'next/navigation';
import { db, properties, cmsContent, cmsMedia } from '@/lib/db';
import { eq, and, asc, desc } from 'drizzle-orm';
import CmsDashboard from '@/components/features/cms/CmsDashboard';
import { securityLogger } from '@/lib/utils/security-logger.client';

export const dynamic = 'force-dynamic';

const CmsPage = async () => {
  try {
    const session = await getSessionWithTenantContext();

    if (!session || !session.user?.tenantId) {
      redirect('/login');
    }

    const tenantId = session.user.tenantId;
    let propertiesList: typeof properties.$inferSelect[] = [];

    try {
      propertiesList = await db
        .select()
        .from(properties)
        .where(eq(properties.tenantId, tenantId))
        .orderBy(asc(properties.name));
    } catch (error) {
      securityLogger.error('[CmsPage] Error fetching properties:', error);
    }

    let initialContent: typeof cmsContent.$inferSelect[] = [];
    let initialMedia: typeof cmsMedia.$inferSelect[] = [];

    if (propertiesList.length > 0) {
      const firstPropertyId = propertiesList[0].id;

      try {
        initialContent = await db
          .select()
          .from(cmsContent)
          .where(
            and(
              eq(cmsContent.tenantId, tenantId),
              eq(cmsContent.propertyId, firstPropertyId)
            )
          )
          .orderBy(desc(cmsContent.updatedAt));
      } catch (error) {
        securityLogger.error('[CmsPage] Error fetching content:', error);
      }

      try {
        initialMedia = await db
          .select()
          .from(cmsMedia)
          .where(
            and(
              eq(cmsMedia.tenantId, tenantId),
              eq(cmsMedia.propertyId, firstPropertyId)
            )
          )
          .orderBy(desc(cmsMedia.createdAt));
      } catch (error) {
        securityLogger.error('[CmsPage] Error fetching media:', error);
      }
    }

    // Map Drizzle to shape CmsDashboard expects (snake_case + createdAt/updatedAt)
    const contentForDashboard = initialContent.map((c) => {
      const createdAt = c.createdAt ?? new Date();
      const updatedAt = c.updatedAt ?? new Date();
      return {
        id: c.id,
        tenant_id: c.tenantId ?? '',
        property_id: c.propertyId,
        content_type: c.contentType,
        title: c.title,
        content: c.content,
        metadata: c.metadata,
        status: c.status ?? 'draft',
        version: c.version ?? 1,
        published_at: c.publishedAt,
        created_at: createdAt,
        updated_at: updatedAt,
        createdAt,
        updatedAt,
      };
    });
    const mediaForDashboard = initialMedia.map((m) => {
      const createdAt = m.createdAt ?? new Date();
      return {
        id: m.id,
        tenant_id: m.tenantId ?? '',
        property_id: m.propertyId,
        content_id: m.contentId,
        file_name: m.fileName,
        file_path: m.filePath,
        file_type: m.fileType,
        file_size: m.fileSize,
        mime_type: m.mimeType,
        storage_location: m.storageLocation,
        alt_text: m.altText,
        caption: m.caption,
        display_order: m.displayOrder ?? 0,
        metadata: m.metadata ?? {},
        created_at: createdAt,
        createdAt,
      };
    });
    const propertiesForDashboard = propertiesList.map((p) => ({
      id: p.id,
      tenant_id: p.tenantId ?? '',
      owner_id: p.ownerId,
      name: p.name,
      slug: p.slug,
      type: p.type,
      description: p.description,
      address: p.address,
      city: p.city,
      state: p.state,
      country: p.country,
      postal_code: p.postalCode,
      latitude: p.latitude,
      longitude: p.longitude,
      star_rating: p.starRating,
      room_count: p.roomCount ?? 0,
      status: p.status ?? 'active',
      amenities: p.amenities,
      images: p.images,
      check_in_time: p.checkInTime,
      check_out_time: p.checkOutTime,
      has_restaurant_features: p.hasRestaurantFeatures ?? false,
      is_enterprise: p.isEnterprise ?? false,
      created_at: p.createdAt ?? new Date(),
      updated_at: p.updatedAt ?? new Date(),
    }));

    return (
      <CmsDashboard
        initialContent={contentForDashboard as any}
        initialMedia={mediaForDashboard as any}
        properties={propertiesForDashboard as any}
      />
    );
  } catch (error) {
    securityLogger.error('[CmsPage] Fatal error:', error);
    return (
      <CmsDashboard
        initialContent={[]}
        initialMedia={[]}
        properties={[]}
      />
    );
  }
};

export default CmsPage;
