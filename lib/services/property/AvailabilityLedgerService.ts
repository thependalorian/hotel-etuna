/**
 * AvailabilityLedgerService — daily room inventory buckets (OSS W6 / innkeeper pattern)
 *
 * Purpose: Upsert and query per-room daily availability state (sold, blocked, stop-sell, CTA/CTD).
 * Location: lib/services/property/AvailabilityLedgerService.ts
 */

import { db } from '@/lib/db';
import {
  properties,
  roomAvailabilityLedger,
  rooms,
  type RoomAvailabilityLedger,
} from '@/lib/db/schema';
import { and, eq, gte, lt, lte } from 'drizzle-orm';
import { AppError, handleServiceError } from '@/lib/utils/errors';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface UpsertLedgerBucketInput {
  tenantId: string;
  propertyId: string;
  roomId: string;
  businessDate: string;
  sold?: number;
  blocked?: number;
  outOfOrder?: boolean;
  stopSell?: boolean;
  cta?: boolean;
  ctd?: boolean;
}

export interface ApplyStopSellInput {
  tenantId: string;
  propertyId: string;
  businessDate: string;
  stopSell: boolean;
  roomId?: string | null;
}

/** Night keys for a stay: check-in inclusive, check-out exclusive. */
export function generateStayNightDates(checkIn: Date, checkOut: Date): string[] {
  const nights: string[] = [];
  const cursor = new Date(checkIn);
  const end = new Date(checkOut);
  while (cursor < end) {
    nights.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return nights;
}

/** Pure helper: ledger row blocks selling the room for that night. */
export function isLedgerRowBlockingSale(
  row: Pick<
    RoomAvailabilityLedger,
    'blocked' | 'outOfOrder' | 'stopSell' | 'sold'
  >,
  options?: { ignoreSold?: boolean }
): boolean {
  if (row.stopSell || row.outOfOrder) return true;
  if (row.blocked > 0) return true;
  if (!options?.ignoreSold && row.sold > 0) return true;
  return false;
}

export class AvailabilityLedgerService {
  async assertPropertyInTenant(propertyId: string, tenantId: string): Promise<void> {
    if (!UUID_PATTERN.test(propertyId)) {
      throw new AppError(404, 'Property not found');
    }
    const [row] = await db
      .select({ id: properties.id })
      .from(properties)
      .where(and(eq(properties.id, propertyId), eq(properties.tenantId, tenantId)))
      .limit(1);
    if (!row) {
      throw new AppError(403, 'Property not accessible for this tenant');
    }
  }

  async assertRoomInProperty(roomId: string, propertyId: string): Promise<void> {
    if (!UUID_PATTERN.test(roomId)) {
      throw new AppError(404, 'Room not found');
    }
    const [row] = await db
      .select({ id: rooms.id })
      .from(rooms)
      .where(and(eq(rooms.id, roomId), eq(rooms.propertyId, propertyId)))
      .limit(1);
    if (!row) {
      throw new AppError(404, 'Room not found for property');
    }
  }

  /**
   * Upsert a single daily bucket for one room.
   */
  async upsertDailyBucket(input: UpsertLedgerBucketInput): Promise<RoomAvailabilityLedger> {
    try {
      await this.assertPropertyInTenant(input.propertyId, input.tenantId);
      await this.assertRoomInProperty(input.roomId, input.propertyId);

      const values = {
        tenantId: input.tenantId,
        propertyId: input.propertyId,
        roomId: input.roomId,
        businessDate: input.businessDate,
        sold: input.sold ?? 0,
        blocked: input.blocked ?? 0,
        outOfOrder: input.outOfOrder ?? false,
        stopSell: input.stopSell ?? false,
        cta: input.cta ?? false,
        ctd: input.ctd ?? false,
        updatedAt: new Date(),
      };

      const [row] = await db
        .insert(roomAvailabilityLedger)
        .values(values)
        .onConflictDoUpdate({
          target: [
            roomAvailabilityLedger.propertyId,
            roomAvailabilityLedger.roomId,
            roomAvailabilityLedger.businessDate,
          ],
          set: {
            sold: values.sold,
            blocked: values.blocked,
            outOfOrder: values.outOfOrder,
            stopSell: values.stopSell,
            cta: values.cta,
            ctd: values.ctd,
            updatedAt: values.updatedAt,
          },
        })
        .returning();

      if (!row) {
        throw new AppError(500, 'Failed to upsert availability ledger bucket');
      }
      return row;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleServiceError(error, 'Error upserting availability ledger bucket');
    }
  }

  /**
   * Fetch ledger rows for a property across [startDate, endDate) nights.
   */
  async getLedgerForDateRange(
    propertyId: string,
    startDate: string,
    endDate: string,
    tenantId?: string
  ): Promise<RoomAvailabilityLedger[]> {
    try {
      if (tenantId) {
        await this.assertPropertyInTenant(propertyId, tenantId);
      }

      return await db
        .select()
        .from(roomAvailabilityLedger)
        .where(
          and(
            eq(roomAvailabilityLedger.propertyId, propertyId),
            gte(roomAvailabilityLedger.businessDate, startDate),
            lt(roomAvailabilityLedger.businessDate, endDate)
          )
        )
        .orderBy(roomAvailabilityLedger.businessDate, roomAvailabilityLedger.roomId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleServiceError(error, 'Error fetching availability ledger');
    }
  }

  /**
   * Apply stop-sell for one date — property-wide when roomId omitted, else per room.
   */
  async applyStopSell(input: ApplyStopSellInput): Promise<RoomAvailabilityLedger[]> {
    try {
      await this.assertPropertyInTenant(input.propertyId, input.tenantId);

      const targetRooms = input.roomId
        ? [{ id: input.roomId }]
        : await db
            .select({ id: rooms.id })
            .from(rooms)
            .where(
              and(
                eq(rooms.propertyId, input.propertyId),
                eq(rooms.inventoryKind, 'guest_room')
              )
            );

      if (input.roomId) {
        await this.assertRoomInProperty(input.roomId, input.propertyId);
      }

      const results: RoomAvailabilityLedger[] = [];
      for (const room of targetRooms) {
        const row = await this.upsertDailyBucket({
          tenantId: input.tenantId,
          propertyId: input.propertyId,
          roomId: room.id,
          businessDate: input.businessDate,
          stopSell: input.stopSell,
        });
        results.push(row);
      }
      return results;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleServiceError(error, 'Error applying stop-sell');
    }
  }

  /**
   * Returns true when ledger restrictions allow the room for the full stay.
   */
  async isRoomAvailableByLedger(
    roomId: string,
    propertyId: string,
    checkInDate: Date,
    checkOutDate: Date
  ): Promise<boolean> {
    const nights = generateStayNightDates(checkInDate, checkOutDate);
    if (nights.length === 0) return true;

    const start = nights[0];
    const checkInStr = checkInDate.toISOString().slice(0, 10);
    const checkOutStr = checkOutDate.toISOString().slice(0, 10);

    const rows = await db
      .select()
      .from(roomAvailabilityLedger)
      .where(
        and(
          eq(roomAvailabilityLedger.propertyId, propertyId),
          eq(roomAvailabilityLedger.roomId, roomId),
          gte(roomAvailabilityLedger.businessDate, start),
          lte(roomAvailabilityLedger.businessDate, checkOutStr)
        )
      );

    const rowByDate = new Map(rows.map((r) => [r.businessDate, r]));

    for (const night of nights) {
      const row = rowByDate.get(night);
      if (row && isLedgerRowBlockingSale(row)) {
        return false;
      }
      if (night === checkInStr && row?.cta) {
        return false;
      }
    }

    const checkOutRow = rowByDate.get(checkOutStr);
    if (checkOutRow?.ctd) {
      return false;
    }

    return true;
  }

  /**
   * Room IDs blocked by ledger for any night in the stay range.
   */
  async getLedgerBlockedRoomIds(
    propertyId: string,
    checkInDate: Date,
    checkOutDate: Date
  ): Promise<Set<string>> {
    const nights = generateStayNightDates(checkInDate, checkOutDate);
    if (nights.length === 0) return new Set();

    const start = nights[0];
    const checkInStr = checkInDate.toISOString().slice(0, 10);
    const checkOutStr = checkOutDate.toISOString().slice(0, 10);

    const rows = await db
      .select()
      .from(roomAvailabilityLedger)
      .where(
        and(
          eq(roomAvailabilityLedger.propertyId, propertyId),
          gte(roomAvailabilityLedger.businessDate, start),
          lte(roomAvailabilityLedger.businessDate, checkOutStr)
        )
      );

    const blocked = new Set<string>();
    for (const row of rows) {
      const dateKey = row.businessDate;
      const inStayNight = dateKey < checkOutStr;
      const blocks =
        (inStayNight && isLedgerRowBlockingSale(row)) ||
        (dateKey === checkInStr && row.cta) ||
        (dateKey === checkOutStr && row.ctd);
      if (blocks) {
        blocked.add(row.roomId);
      }
    }
    return blocked;
  }
}

export const availabilityLedgerService = new AvailabilityLedgerService();
