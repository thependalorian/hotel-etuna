/**
 * GuestProfileService — read/update the signed-in guest's own profile.
 *
 * Location: lib/services/guest/GuestProfileService.ts
 *
 * Guests are resolved by email (same pattern as GuestStayService). Contact fields live on
 * `guests`; stay preferences live on `guest_profiles`. Email is identity → not editable here.
 */

import { db } from '@/lib/db';
import { guests, guestProfiles } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export interface GuestProfile {
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  nationality: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  postalCode: string | null;
  marketingConsent: boolean;
  preferredRoomType: string | null;
  dietaryRestrictions: string[];
  accessibilityNeeds: string[];
}

export interface GuestProfilePatch {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  nationality?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
  marketingConsent?: boolean;
  preferredRoomType?: string | null;
  dietaryRestrictions?: string[];
  accessibilityNeeds?: string[];
}

export class GuestProfileService {
  /** Resolve the `guests` row (id + tenant) for an email (case-insensitive), or null. */
  private async findGuestByEmail(
    email: string,
  ): Promise<{ id: string; tenantId: string | null } | null> {
    const normalized = email.trim().toLowerCase();
    const [row] = await db
      .select({ id: guests.id, tenantId: guests.tenantId })
      .from(guests)
      .where(sql`lower(${guests.email}) = ${normalized}`)
      .limit(1);
    return row ?? null;
  }

  /** Return the guest's profile (contact + preferences), or null if no guest record. */
  async getByEmail(email: string): Promise<GuestProfile | null> {
    const normalized = email.trim().toLowerCase();
    const [row] = await db
      .select({
        email: guests.email,
        firstName: guests.firstName,
        lastName: guests.lastName,
        phone: guests.phone,
        nationality: guests.nationality,
        address: guests.address,
        city: guests.city,
        country: guests.country,
        postalCode: guests.postalCode,
        marketingConsent: guests.marketingConsent,
        preferredRoomType: guestProfiles.preferredRoomType,
        dietaryRestrictions: guestProfiles.dietaryRestrictions,
        accessibilityNeeds: guestProfiles.accessibilityNeeds,
      })
      .from(guests)
      .leftJoin(guestProfiles, eq(guestProfiles.guestId, guests.id))
      .where(sql`lower(${guests.email}) = ${normalized}`)
      .limit(1);

    if (!row) return null;
    return {
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      phone: row.phone,
      nationality: row.nationality,
      address: row.address,
      city: row.city,
      country: row.country,
      postalCode: row.postalCode,
      marketingConsent: row.marketingConsent ?? false,
      preferredRoomType: row.preferredRoomType ?? null,
      dietaryRestrictions: row.dietaryRestrictions ?? [],
      accessibilityNeeds: row.accessibilityNeeds ?? [],
    };
  }

  /**
   * Apply a partial update to the guest's contact fields (`guests`) and preferences
   * (`guest_profiles`, upserted), then return the fresh profile.
   *
   * @param email - Authenticated guest email.
   * @param patch - Allowed fields to update.
   * @returns The updated profile, or null if no guest record exists for the email.
   */
  async updateByEmail(email: string, patch: GuestProfilePatch): Promise<GuestProfile | null> {
    const guest = await this.findGuestByEmail(email);
    if (!guest) return null;
    const guestId = guest.id;

    const contact: Record<string, unknown> = {};
    for (const key of [
      'firstName', 'lastName', 'phone', 'nationality', 'address', 'city', 'country',
      'postalCode', 'marketingConsent',
    ] as const) {
      if (patch[key] !== undefined) contact[key] = patch[key];
    }
    if (Object.keys(contact).length > 0) {
      contact.updatedAt = new Date();
      await db.update(guests).set(contact).where(eq(guests.id, guestId));
    }

    const prefs: Record<string, unknown> = {};
    if (patch.preferredRoomType !== undefined) prefs.preferredRoomType = patch.preferredRoomType;
    if (patch.dietaryRestrictions !== undefined) prefs.dietaryRestrictions = patch.dietaryRestrictions;
    if (patch.accessibilityNeeds !== undefined) prefs.accessibilityNeeds = patch.accessibilityNeeds;
    if (Object.keys(prefs).length > 0) {
      const [existing] = await db
        .select({ id: guestProfiles.id })
        .from(guestProfiles)
        .where(eq(guestProfiles.guestId, guestId))
        .limit(1);
      if (existing) {
        await db.update(guestProfiles).set(prefs).where(eq(guestProfiles.guestId, guestId));
      } else {
        await db.insert(guestProfiles).values({ guestId, tenantId: guest.tenantId, ...prefs });
      }
    }

    return this.getByEmail(email);
  }
}
