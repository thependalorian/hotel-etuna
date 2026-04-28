/**
 * Shared Data Access Layer — Partners
 *
 * Purpose: Single source of truth for partner/referral queries
 * Location: lib/data/partners.ts
 *
 * Routing uses property.slug (partner detail URLs are `/partners/:propertySlug`).
 */

import { db } from '@/lib/db';
import { tenants, properties, rooms } from '@/lib/db/schema';
import { eq, and, ne, asc, count } from 'drizzle-orm';
import { cache } from 'react';

const HUB_TENANT_ID = process.env.HUB_TENANT_ID!;

/**
 * Active partner tenants plus primary property summary for referral listings.
 */
export const getReferralPartners = cache(async () => {
  try {
    const partnerTenants = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        subdomain: tenants.subdomain,
      })
      .from(tenants)
      .where(
        and(
          ne(tenants.id, HUB_TENANT_ID),
          eq(tenants.type, 'partner'),
          eq(tenants.status, 'active'),
        ),
      )
      .orderBy(tenants.name);

    const partnersWithDetails = await Promise.all(
      partnerTenants.map(async (tenant) => {
        const partnerProperties = await db
          .select({
            id: properties.id,
            slug: properties.slug,
            name: properties.name,
            address: properties.address,
            city: properties.city,
            state: properties.state,
            country: properties.country,
            images: properties.images,
            amenities: properties.amenities,
            starRating: properties.starRating,
            type: properties.type,
          })
          .from(properties)
          .where(eq(properties.tenantId, tenant.id))
          .orderBy(asc(properties.name));

        const propertyIds = partnerProperties.map((p) => p.id);
        const roomCount =
          propertyIds.length > 0
            ? (await db
                .select({ count: count() })
                .from(rooms)
                .where(
                  and(
                    eq(rooms.propertyId, propertyIds[0]),
                    eq(rooms.status, 'available'),
                  ),
                ))[0]?.count || 0
            : 0;

        const primaryProperty = partnerProperties[0];
        const listSlug =
          primaryProperty?.slug ??
          tenant.subdomain ??
          primaryProperty?.id ??
          '';

        return {
          id: tenant.id,
          name: tenant.name,
          slug: listSlug,
          description:
            primaryProperty?.name
              ? `Partner accommodation — ${primaryProperty.name}`
              : 'Partner accommodation property',
          location: {
            city: primaryProperty?.city || 'Windhoek',
            state: primaryProperty?.state || 'Khomas',
            country: primaryProperty?.country || 'Namibia',
          },
          starRating: primaryProperty?.starRating || 0,
          images: primaryProperty?.images || [],
          amenities: primaryProperty?.amenities || [],
          type: primaryProperty?.type || 'hotel',
          roomCount: Number(roomCount),
          tenantId: tenant.id,
          tenantName: tenant.name,
        };
      }),
    );

    return partnersWithDetails;
  } catch (error) {
    console.error('[getReferralPartners] Error:', error);
    return [];
  }
});

/**
 * Detail view: resolve partner context by canonical property slug.
 */
export const getPartnerBySlug = cache(async (slug: string) => {
  try {
    const matched = await db
      .select({
        tenant: tenants,
        property: properties,
      })
      .from(properties)
      .innerJoin(tenants, eq(properties.tenantId, tenants.id))
      .where(
        and(
          eq(properties.slug, slug),
          eq(tenants.type, 'partner'),
          ne(tenants.id, HUB_TENANT_ID),
          eq(tenants.status, 'active'),
        ),
      )
      .limit(1);

    if (!matched.length) {
      return null;
    }

    const partner = matched[0].tenant;
    const matchedProperty = matched[0].property;

    const partnerProperties = await db
      .select()
      .from(properties)
      .where(eq(properties.tenantId, partner.id))
      .orderBy(asc(properties.name));

    const orderedProperties = [
      matchedProperty,
      ...partnerProperties.filter((p) => p.id !== matchedProperty.id),
    ];

    const partnerRooms =
      matchedProperty.id
        ? await db
            .select()
            .from(rooms)
            .where(
              and(
                eq(rooms.propertyId, matchedProperty.id),
                eq(rooms.status, 'available'),
              ),
            )
            .orderBy(rooms.roomType, rooms.baseRate)
        : [];

    return {
      partner,
      properties: orderedProperties,
      rooms: partnerRooms,
    };
  } catch (error) {
    console.error('[getPartnerBySlug] Error:', error);
    return null;
  }
});

export type ReferralPartner = Awaited<ReturnType<typeof getReferralPartners>>[0];
export type PartnerDetail = Awaited<ReturnType<typeof getPartnerBySlug>>;
