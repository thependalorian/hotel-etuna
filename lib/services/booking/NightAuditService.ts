/**
 * @fileoverview NightAuditService — domain service module.
 * NightAuditService — automated end-of-day operations
 *
 * Purpose: Post room tariffs, process no-shows, advance stayovers, lock charges, generate revenue reports
 * Location: /lib/services/booking/NightAuditService.ts
 *
 * Operations (idempotent):
 * 1. Post room tariffs to in-house folios
 * 2. Process no-shows (confirmed past arrival date)
 * 3. Advance stayover statuses (checked_in → stayover)
 * 4. Mark due-outs (departing next day)
 * 5. Lock charges for the business date
 * 6. Generate revenue summary (ADR, RevPAR, occupancy)
 *
 * Integration: Works with BookingService, FolioService, ReservationStateMachine
 */

import { db, bookings, bookingCharges, nightAuditRuns, properties, rooms } from '@/lib/db';
import { and, eq, gte, lte, inArray, sql } from 'drizzle-orm';
import { AppError, handleServiceError } from '@/lib/utils/errors';
import { FolioService } from '@/lib/services/folio/FolioService';
import { BookingService } from '@/lib/services/booking/BookingService';
import type { ReservationStatus } from '@/lib/services/booking/ReservationStateMachine';
import Decimal from 'decimal.js';
import {
  computeNightAuditTariffCharges,
  getHotelEtunaPropertyTaxProfile,
} from '@/lib/platform/namibia-tax';
import { toNumber } from '@/lib/utils/money';

export interface NightAuditRunInput {
  propertyId: string;
  tenantId: string;
  businessDate: string;
  userId?: string;
}

export interface NightAuditResult {
  businessDate: string;
  propertyId: string;
  tariffResult: TariffResult;
  noShowResult: NoShowResult;
  stayoverResult: StayoverResult;
  dueOutResult: DueOutResult;
  revenueSummary: RevenueSummary;
  errors: AuditError[];
  completedAt: Date;
  runId?: string;
}

export interface TariffResult {
  totalRoom: string;
  totalTax: string;
  count: number;
  errors: AuditError[];
}

export interface NoShowResult {
  count: number;
  bookingIds: string[];
  errors: AuditError[];
}

export interface StayoverResult {
  advanced: number;
}

export interface DueOutResult {
  markedDueOut: number;
}

export interface RevenueSummary {
  roomRevenue: number;
  taxRevenue: number;
  totalRevenue: number;
  roomsSold: number;
  occupancyRate: number;
  adr: number;
  revpar: number;
}

export interface AuditError {
  message: string;
  entity?: string;
}

export class NightAuditService {
  private folioService: FolioService;
  private bookingService: BookingService;

  constructor() {
    this.folioService = new FolioService();
    this.bookingService = new BookingService();
  }

  /**
   * Main night audit orchestrator.
   * Idempotent — can be re-run for same date (skips already processed items).
   */
  async runAudit(input: NightAuditRunInput): Promise<NightAuditResult> {
    try {
      const errors: AuditError[] = [];

      // 1. Post room tariffs to all in-house folios
      const tariffResult = await this.postRoomTariffs(
        input.propertyId,
        input.tenantId,
        input.businessDate,
        input.userId
      );
      errors.push(...tariffResult.errors);

      // 2. Process no-shows
      const noShowResult = await this.processNoShows(
        input.propertyId,
        input.tenantId,
        input.businessDate
      );
      errors.push(...noShowResult.errors);

      // 3. Advance stayover reservations (checked_in → stayover)
      const stayoverResult = await this.advanceStayovers(
        input.propertyId,
        input.tenantId,
        input.businessDate
      );

      // 4. Mark due-outs (departure date = business date + 1)
      const dueOutResult = await this.markDueOuts(
        input.propertyId,
        input.tenantId,
        input.businessDate
      );

      // 5. Generate revenue summary
      const revenueSummary = await this.generateRevenueSummary(
        input.propertyId,
        input.tenantId,
        input.businessDate
      );

      const result: NightAuditResult = {
        businessDate: input.businessDate,
        propertyId: input.propertyId,
        tariffResult,
        noShowResult,
        stayoverResult,
        dueOutResult,
        revenueSummary,
        errors,
        completedAt: new Date(),
      };

      const runId = await this.persistAuditRun(input, result);
      return { ...result, runId };
    } catch (error) {
      throw handleServiceError(error, 'Error running night audit');
    }
  }

  /**
   * Upsert audit result — idempotent per property + business date.
   */
  async persistAuditRun(
    input: NightAuditRunInput,
    result: NightAuditResult
  ): Promise<string> {
    const status = result.errors.length > 0 ? 'completed_with_errors' : 'completed';
    const now = new Date();
    const payload = {
      ...result,
      completedAt: result.completedAt.toISOString(),
    };

    const [row] = await db
      .insert(nightAuditRuns)
      .values({
        tenantId: input.tenantId,
        propertyId: input.propertyId,
        businessDate: input.businessDate,
        result: payload,
        status,
        runBy: input.userId ?? null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [nightAuditRuns.propertyId, nightAuditRuns.businessDate],
        set: {
          result: payload,
          status,
          runBy: input.userId ?? null,
          updatedAt: now,
        },
      })
      .returning({ id: nightAuditRuns.id });

    if (!row?.id) {
      throw new AppError(500, 'Failed to persist night audit run');
    }

    return row.id;
  }

  /** Load the most recent persisted run for a property + date. */
  async getAuditRun(propertyId: string, businessDate: string) {
    const [row] = await db
      .select()
      .from(nightAuditRuns)
      .where(
        and(
          eq(nightAuditRuns.propertyId, propertyId),
          eq(nightAuditRuns.businessDate, businessDate)
        )
      )
      .limit(1);

    return row ?? null;
  }

  /**
   * Post room tariffs to all in-house folios.
   * Idempotent — skips if room charge already posted for the date.
   */
  private async postRoomTariffs(
    propertyId: string,
    tenantId: string,
    businessDate: string,
    userId?: string
  ): Promise<TariffResult> {
    const errors: AuditError[] = [];
    let totalRoom = new Decimal(0);
    let totalTax = new Decimal(0);
    let count = 0;

    try {
      // Get all checked-in / stayover / due_out bookings
      const inHouseBookings = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.propertyId, propertyId),
            eq(bookings.tenantId, tenantId),
            inArray(bookings.status, ['checked_in', 'stayover', 'due_out'] as const)
          )
        );

      for (const booking of inHouseBookings) {
        try {
          // Check if room charge already posted for this date
          const existingCharges = await db
            .select({ id: bookingCharges.id })
            .from(bookingCharges)
            .where(
              and(
                eq(bookingCharges.bookingId, booking.id),
                eq(bookingCharges.tenantId, tenantId),
                eq(bookingCharges.chargeType, 'room'),
                sql`DATE(${bookingCharges.createdAt}) = ${businessDate}`
              )
            )
            .limit(1);

          if (existingCharges.length > 0) {
            continue; // Already posted, skip
          }

          // Calculate nightly rate
          const totalAmount = toNumber(booking.totalAmount);
          const nights = this.calculateNights(
            booking.checkInDate,
            booking.checkOutDate
          );
          const nightlyRate = nights > 0 ? totalAmount / nights : totalAmount;
          const taxProfile = getHotelEtunaPropertyTaxProfile();
          const tariff = computeNightAuditTariffCharges(nightlyRate, taxProfile);

          await db.insert(bookingCharges).values({
            tenantId,
            bookingId: booking.id,
            chargeType: 'room',
            description: `Room tariff - ${businessDate}`,
            amount: tariff.roomAmount.toFixed(2),
            currency: booking.currency ?? 'NAD',
            status: 'open',
            createdBy: userId ?? null,
          });

          totalRoom = totalRoom.plus(new Decimal(tariff.roomAmount));
          count++;

          if (tariff.vatAmount > 0) {
            await db.insert(bookingCharges).values({
              tenantId,
              bookingId: booking.id,
              chargeType: 'tax',
              description: `VAT (${tariff.vatRatePercent}%) - ${businessDate}`,
              amount: tariff.vatAmount.toFixed(2),
              currency: booking.currency ?? 'NAD',
              status: 'open',
              createdBy: userId ?? null,
            });
            totalTax = totalTax.plus(new Decimal(tariff.vatAmount));
          }

          if (tariff.ntbLevyAmount > 0) {
            await db.insert(bookingCharges).values({
              tenantId,
              bookingId: booking.id,
              chargeType: 'adjustment',
              description: `NTB tourism levy (2%) - ${businessDate}`,
              amount: tariff.ntbLevyAmount.toFixed(2),
              currency: booking.currency ?? 'NAD',
              status: 'open',
              createdBy: userId ?? null,
            });
          }
        } catch (err: unknown) {
          errors.push({
            message: `Failed to post tariff for booking ${booking.id}: ${err instanceof Error ? err.message : String(err)}`,
            entity: booking.id,
          });
        }
      }

      return {
        totalRoom: totalRoom.toFixed(2),
        totalTax: totalTax.toFixed(2),
        count,
        errors,
      };
    } catch (error) {
      throw handleServiceError(error, 'Error posting room tariffs');
    }
  }

  /**
   * Process no-shows: mark bookings past arrival date that never checked in.
   */
  private async processNoShows(
    propertyId: string,
    tenantId: string,
    businessDate: string
  ): Promise<NoShowResult> {
    const errors: AuditError[] = [];
    const bookingIds: string[] = [];
    let count = 0;

    try {
      // Find bookings where arrival <= businessDate and still confirmed
      const noShowCandidates = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.propertyId, propertyId),
            eq(bookings.tenantId, tenantId),
            lte(bookings.checkInDate, businessDate),
            eq(bookings.status, 'confirmed')
          )
        );

      for (const booking of noShowCandidates) {
        try {
          // Update booking to no_show status
          await db
            .update(bookings)
            .set({
              status: 'no_show',
              updatedAt: new Date(),
            })
            .where(eq(bookings.id, booking.id));

          bookingIds.push(booking.id);
          count++;

          // Post no-show fee if configured (NAD 500 default)
          const noShowFee = 500;
          await db.insert(bookingCharges).values({
            tenantId,
            bookingId: booking.id,
            chargeType: 'adjustment',
            description: 'No-show fee',
            amount: noShowFee.toFixed(2),
            currency: booking.currency ?? 'NAD',
            status: 'open',
          });
        } catch (err: unknown) {
          errors.push({
            message: `Failed to process no-show for booking ${booking.id}: ${err instanceof Error ? err.message : String(err)}`,
            entity: booking.id,
          });
        }
      }

      return { count, bookingIds, errors };
    } catch (error) {
      throw handleServiceError(error, 'Error processing no-shows');
    }
  }

  /**
   * Advance checked_in → stayover for multi-night stays.
   * Only advances bookings where check-in was before business date.
   */
  private async advanceStayovers(
    propertyId: string,
    tenantId: string,
    businessDate: string
  ): Promise<StayoverResult> {
    try {
      const result = await db
        .update(bookings)
        .set({
          status: 'stayover',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(bookings.propertyId, propertyId),
            eq(bookings.tenantId, tenantId),
            eq(bookings.status, 'checked_in'),
            sql`DATE(${bookings.checkInDate}) < ${businessDate}`
          )
        )
        .returning({ id: bookings.id });

      return { advanced: result.length };
    } catch (error) {
      throw handleServiceError(error, 'Error advancing stayovers');
    }
  }

  /**
   * Mark stayover bookings departing next day as due_out.
   * Must run AFTER advanceStayovers.
   */
  private async markDueOuts(
    propertyId: string,
    tenantId: string,
    businessDate: string
  ): Promise<DueOutResult> {
    try {
      const nextDay = this.addDays(businessDate, 1);

      const result = await db
        .update(bookings)
        .set({
          status: 'due_out',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(bookings.propertyId, propertyId),
            eq(bookings.tenantId, tenantId),
            eq(bookings.status, 'stayover'),
            eq(bookings.checkOutDate, nextDay)
          )
        )
        .returning({ id: bookings.id });

      return { markedDueOut: result.length };
    } catch (error) {
      throw handleServiceError(error, 'Error marking due-outs');
    }
  }

  /**
   * Generate revenue summary with KPIs.
   * ADR = room revenue / rooms sold
   * RevPAR = ADR x occupancy rate
   */
  private async generateRevenueSummary(
    propertyId: string,
    tenantId: string,
    businessDate: string
  ): Promise<RevenueSummary> {
    try {
      // Room revenue for the date
      const revenueRows = await db
        .select({
          roomRevenue: sql<string>`COALESCE(SUM(CASE WHEN ${bookingCharges.chargeType} = 'room' THEN ${bookingCharges.amount}::numeric ELSE 0 END), 0)`,
          taxRevenue: sql<string>`COALESCE(SUM(CASE WHEN ${bookingCharges.chargeType} = 'tax' THEN ${bookingCharges.amount}::numeric ELSE 0 END), 0)`,
          totalRevenue: sql<string>`COALESCE(SUM(${bookingCharges.amount}::numeric), 0)`,
        })
        .from(bookingCharges)
        .innerJoin(bookings, eq(bookingCharges.bookingId, bookings.id))
        .where(
          and(
            eq(bookings.propertyId, propertyId),
            eq(bookings.tenantId, tenantId),
            sql`DATE(${bookingCharges.createdAt}) = ${businessDate}`
          )
        );

      const revenueResult = revenueRows[0];
      const roomRevenueDec = new Decimal(revenueResult?.roomRevenue ?? '0');
      const taxRevenueDec = new Decimal(revenueResult?.taxRevenue ?? '0');
      const totalRevenueDec = new Decimal(revenueResult?.totalRevenue ?? '0');

      // Rooms sold (in-house bookings)
      const roomsSoldRows = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(bookings)
        .where(
          and(
            eq(bookings.propertyId, propertyId),
            eq(bookings.tenantId, tenantId),
            inArray(bookings.status, ['checked_in', 'stayover', 'due_out'] as const),
            lte(bookings.checkInDate, businessDate)
          )
        );

      const roomsSold = roomsSoldRows[0]?.count ?? 0;

      // Total available rooms
      const propertyRows = await db
        .select({ id: properties.id })
        .from(properties)
        .where(eq(properties.id, propertyId))
        .limit(1);

      if (propertyRows.length === 0) {
        throw new AppError(404, 'Property not found');
      }

      // Count total rooms
      const totalRoomsRows = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(rooms)
        .where(eq(rooms.propertyId, propertyId));

      const totalRooms = totalRoomsRows[0]?.count ?? 0;

      // Calculate metrics
      const occupancyRate = totalRooms > 0 ? roomsSold / totalRooms : 0;
      const adrDec = roomsSold > 0 ? roomRevenueDec.div(roomsSold) : new Decimal(0);
      const revparDec = adrDec.times(occupancyRate);

      return {
        roomRevenue: roomRevenueDec.toNumber(),
        taxRevenue: taxRevenueDec.toNumber(),
        totalRevenue: totalRevenueDec.toNumber(),
        roomsSold,
        occupancyRate: Math.round(occupancyRate * 10000) / 10000,
        adr: Math.round(adrDec.toNumber() * 100) / 100,
        revpar: Math.round(revparDec.toNumber() * 100) / 100,
      };
    } catch (error) {
      throw handleServiceError(error, 'Error generating revenue summary');
    }
  }

  // --- Utilities ---

  private calculateNights(checkInDate: string, checkOutDate: string): number {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  }

  private addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0]!;
  }
}

export const nightAuditService = new NightAuditService();
