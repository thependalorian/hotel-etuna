/**
 * @fileoverview GuestService — CRUD for guest records (booking/CRM domain).
 *
 * Manages rows in the `guests` table. Distinct from
 * `lib/services/guest/GuestProfileService.ts`, which serves the signed-in
 * guest hub profile APIs.
 * Location: lib/services/booking/GuestService.ts
 */
import { db } from '@/lib/db';
import { guests } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import type { Guest } from '@/lib/db/schema';
import { GuestData } from '@/lib/types/guest';
import { AppError, handleServiceError } from '@/lib/utils/errors';

export class GuestService {
  async createGuest(tenantId: string, data: GuestData): Promise<Guest> {
    try {
      const [guest] = await db
        .insert(guests)
        .values({
          tenantId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth
            ? (typeof data.dateOfBirth === 'string'
                ? data.dateOfBirth
                : data.dateOfBirth.toISOString().slice(0, 10))
            : undefined,
          nationality: data.nationality,
          passportNumber: data.passportNumber,
          idNumber: data.idNumber,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          postalCode: data.postalCode,
          preferences: (data.preferences ?? {}) as Record<string, unknown>,
          marketingConsent: data.marketingConsent ?? false,
          isSignedUp: data.isSignedUp ?? false,
          signUpCompletedAt: data.isSignedUp ? sql`now()` : null,
        })
        .returning();
      if (!guest) throw new Error('Insert did not return guest');
      return guest;
    } catch (error) {
      return handleServiceError(error, 'Error creating guest');
    }
  }

  async getGuestsByTenant(tenantId: string): Promise<Guest[]> {
    try {
      return await db
        .select()
        .from(guests)
        .where(eq(guests.tenantId, tenantId))
        .orderBy(desc(guests.createdAt));
    } catch (error) {
      handleServiceError(error, 'Error fetching guests');
      return [];
    }
  }

  async getGuestById(guestId: string, tenantId: string): Promise<Guest> {
    try {
      const [guest] = await db
        .select()
        .from(guests)
        .where(eq(guests.id, guestId))
        .limit(1);
      if (!guest || guest.tenantId !== tenantId) {
        throw new AppError(404, 'Guest not found');
      }
      return guest;
    } catch (error) {
      return handleServiceError(error, 'Error fetching guest');
    }
  }

  async updateGuest(guestId: string, tenantId: string, data: Partial<GuestData>): Promise<Guest> {
    try {
      const dateOfBirthStr =
        data.dateOfBirth === undefined
          ? undefined
          : typeof data.dateOfBirth === 'string'
            ? data.dateOfBirth
            : data.dateOfBirth.toISOString().slice(0, 10);
      const [updated] = await db
        .update(guests)
        .set({
          ...(data.email !== undefined && { email: data.email }),
          ...(data.firstName !== undefined && { firstName: data.firstName }),
          ...(data.lastName !== undefined && { lastName: data.lastName }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(dateOfBirthStr !== undefined && { dateOfBirth: dateOfBirthStr }),
          ...(data.nationality !== undefined && { nationality: data.nationality }),
          ...(data.passportNumber !== undefined && { passportNumber: data.passportNumber }),
          ...(data.idNumber !== undefined && { idNumber: data.idNumber }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.city !== undefined && { city: data.city }),
          ...(data.state !== undefined && { state: data.state }),
          ...(data.country !== undefined && { country: data.country }),
          ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
          ...(data.preferences !== undefined && {
            preferences: data.preferences as Record<string, unknown>,
          }),
          ...(data.marketingConsent !== undefined && { marketingConsent: data.marketingConsent }),
          ...(data.isSignedUp !== undefined && { isSignedUp: data.isSignedUp }),
          ...(data.isSignedUp === true && { signUpCompletedAt: sql`now()` }),
        })
        .where(eq(guests.id, guestId))
        .returning();
      if (!updated || updated.tenantId !== tenantId) {
        throw new AppError(404, 'Guest not found');
      }
      return updated;
    } catch (error) {
      return handleServiceError(error, 'Error updating guest');
    }
  }
}