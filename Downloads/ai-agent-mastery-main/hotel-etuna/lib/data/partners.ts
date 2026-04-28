/**
 * Shared Data Access Layer — Partners
 * 
 * Purpose: Single source of truth for partner/referral queries
 * Location: lib/data/partners.ts
 * 
 * @version 1.0.0
 * @since April 28, 2026
 */

import { db } from '@/lib/db';
import { tenants, properties, rooms } from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { cache } from 'react';

const HUB_TENANT_ID = process.env.HUB_TENANT_ID!;

/**
 * Get all active referral partners
 */
export const getReferralPartners = cache(async () => {
  try {
    const partners = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        description: tenants.description,
        logo: tenants.logo,
        contactEmail: tenants.contactEmail,
        contactPhone: tenants.contactPhone,
        website: tenants.website,
        isActive: tenants.isActive,
        createdAt: tenants.createdAt,
      })
      .from(tenants)
      .where(
        and(
          ne(tenants.id, HUB_TENANT_ID), // Exclude hub itself
          eq(tenants.isActive, true),
          eq(tenants.isReferralPartner, true)
        )
      )
      .orderBy(tenants.name);

    return partners;
  } catch (error) {
    console.error('[getReferralPartners] Error:', error);
    return [];
  }
});

/**
 * Get partner by slug with properties and rooms
 */
export const getPartnerBySlug = cache(async (slug: string) => {
  try {
    // Get partner tenant
    const [partner] = await db
      .select()
      .from(tenants)
      .where(
        and(
          eq(tenants.slug, slug),
          ne(tenants.id, HUB_TENANT_ID),
          eq(tenants.isActive, true),
          eq(tenants.isReferralPartner, true)
        )
      )
      .limit(1);

    if (!partner) {
      return null;
    }

    // Get partner properties
    const partnerProperties = await db
      .select()
      .from(properties)
      .where(eq(properties.tenantId, partner.id));

    // Get rooms for first property (most partners have one property)
    const partnerRooms = partnerProperties.length > 0
      ? await db
          .select()
          .from(rooms)
          .where(
            and(
              eq(rooms.propertyId, partnerProperties[0].id),
              eq(rooms.isAvailable, true)
            )
          )
          .orderBy(rooms.roomType, rooms.pricePerNight)
      : [];

    return {
      partner,
      properties: partnerProperties,
      rooms: partnerRooms,
    };
  } catch (error) {
    console.error('[getPartnerBySlug] Error:', error);
    return null;
  }
});

/**
 * Type exports
 */
export type ReferralPartner = Awaited<ReturnType<typeof getReferralPartners>>[0];
export type PartnerDetail = Awaited<ReturnType<typeof getPartnerBySlug>>;
