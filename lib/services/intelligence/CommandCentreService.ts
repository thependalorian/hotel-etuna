/**
 * @fileoverview CommandCentreService — today's live operational snapshot for the staff command centre.
 * Location: lib/services/intelligence/CommandCentreService.ts
 *
 * Aggregates the day's shape (arrivals/departures/in-house/occupancy), F&B activity, housekeeping
 * and maintenance load, stock health, and pending approvals into one snapshot. The snapshot feeds
 * deriveCommandCentreAlerts() for the colour-coded alert feed. All counts are scoped to the tenant
 * (and property where the table carries one).
 */
import {
  db,
  bookings as bookingsSchema,
  rooms as roomsSchema,
  restaurantOrders,
  housekeepingTasks,
  guestServiceRequests,
  inventoryItems,
  rateRecommendations,
  reorderRecommendations,
  and,
  eq,
  inArray,
  gte,
  lt,
} from '@/lib/db';
import { sql } from 'drizzle-orm';
import { accommodationBookingCondition } from '@/lib/bookings/booking-kind';
import { handleServiceError } from '@/lib/utils/errors';
import type { CommandCentreSnapshot } from '@/lib/services/intelligence/command-centre-alerts';

export class CommandCentreService {
  /**
   * Build today's live snapshot.
   * @param input - tenant + optional property (property scopes rooms + housekeeping).
   */
  async getSnapshot(input: { tenantId: string; propertyId?: string | null }): Promise<CommandCentreSnapshot> {
    try {
      const { tenantId, propertyId } = input;
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const roomWhere = propertyId
        ? and(eq(roomsSchema.propertyId, propertyId), eq(roomsSchema.inventoryKind, 'guest_room'))
        : eq(roomsSchema.inventoryKind, 'guest_room');

      const num = (rows: { value: number }[]) => Number(rows[0]?.value ?? 0);
      const countExpr = sql<number>`count(*)::int`;

      const [
        totalRoomsRows,
        arrivalsRows,
        departuresRows,
        inHouseRows,
        overdueRows,
        ordersRows,
        revenueRows,
        housekeepingRows,
        maintenanceRows,
        invRows,
        rateRecRows,
        reorderRecRows,
      ] = await Promise.all([
        db.select({ value: countExpr }).from(roomsSchema).where(roomWhere),
        db
          .select({ value: countExpr })
          .from(bookingsSchema)
          .where(
            and(
              eq(bookingsSchema.tenantId, tenantId),
              eq(bookingsSchema.checkInDate, sql`CURRENT_DATE`),
              inArray(bookingsSchema.status, ['confirmed', 'assigned']),
              accommodationBookingCondition(),
            ),
          ),
        db
          .select({ value: countExpr })
          .from(bookingsSchema)
          .where(
            and(
              eq(bookingsSchema.tenantId, tenantId),
              eq(bookingsSchema.checkOutDate, sql`CURRENT_DATE`),
              inArray(bookingsSchema.status, ['checked_in', 'stayover', 'due_out']),
              accommodationBookingCondition(),
            ),
          ),
        db
          .select({ value: countExpr })
          .from(bookingsSchema)
          .where(
            and(
              eq(bookingsSchema.tenantId, tenantId),
              inArray(bookingsSchema.status, ['checked_in', 'stayover']),
              accommodationBookingCondition(),
            ),
          ),
        db
          .select({ value: countExpr })
          .from(bookingsSchema)
          .where(
            and(
              eq(bookingsSchema.tenantId, tenantId),
              lt(bookingsSchema.checkOutDate, sql`CURRENT_DATE`),
              inArray(bookingsSchema.status, ['checked_in', 'stayover']),
              accommodationBookingCondition(),
            ),
          ),
        db
          .select({ value: countExpr })
          .from(restaurantOrders)
          .where(and(eq(restaurantOrders.tenantId, tenantId), gte(restaurantOrders.createdAt, startOfToday))),
        db
          .select({ value: sql<string>`coalesce(sum(total_amount), 0)::text` })
          .from(restaurantOrders)
          .where(and(eq(restaurantOrders.tenantId, tenantId), gte(restaurantOrders.createdAt, startOfToday))),
        db
          .select({ value: countExpr })
          .from(housekeepingTasks)
          .where(
            propertyId
              ? and(
                  eq(housekeepingTasks.propertyId, propertyId),
                  inArray(housekeepingTasks.status, ['dirty', 'cleaning', 'inspecting']),
                )
              : inArray(housekeepingTasks.status, ['dirty', 'cleaning', 'inspecting']),
          ),
        db
          .select({ value: countExpr })
          .from(guestServiceRequests)
          .where(
            and(
              eq(guestServiceRequests.tenantId, tenantId),
              eq(guestServiceRequests.requestType, 'maintenance'),
              inArray(guestServiceRequests.status, ['open', 'acknowledged', 'in_progress']),
            ),
          ),
        db
          .select({ quantityOnHand: inventoryItems.quantityOnHand, reorderPoint: inventoryItems.reorderPoint })
          .from(inventoryItems)
          .where(and(eq(inventoryItems.tenantId, tenantId), eq(inventoryItems.isActive, true))),
        db
          .select({ value: countExpr })
          .from(rateRecommendations)
          .where(and(eq(rateRecommendations.tenantId, tenantId), eq(rateRecommendations.status, 'pending'))),
        db
          .select({ value: countExpr })
          .from(reorderRecommendations)
          .where(and(eq(reorderRecommendations.tenantId, tenantId), eq(reorderRecommendations.status, 'pending'))),
      ]);

      const totalRooms = num(totalRoomsRows);
      const inHouse = num(inHouseRows);

      let lowStock = 0;
      let outOfStock = 0;
      for (const row of invRows) {
        const onHand = Number(row.quantityOnHand ?? 0);
        const reorderPoint = Number(row.reorderPoint ?? 0);
        if (onHand <= 0) outOfStock += 1;
        else if (onHand <= reorderPoint) lowStock += 1;
      }

      return {
        generatedAt: new Date().toISOString(),
        arrivalsToday: num(arrivalsRows),
        departuresToday: num(departuresRows),
        inHouse,
        totalRooms,
        occupancyRate: totalRooms > 0 ? inHouse / totalRooms : 0,
        overdueCheckouts: num(overdueRows),
        ordersToday: num(ordersRows),
        revenueToday: Math.round(Number(revenueRows[0]?.value ?? 0) * 100) / 100,
        pendingHousekeeping: num(housekeepingRows),
        openMaintenance: num(maintenanceRows),
        lowStock,
        outOfStock,
        pendingRateRecs: num(rateRecRows),
        pendingReorderRecs: num(reorderRecRows),
      };
    } catch (error) {
      throw handleServiceError(error, 'Error building command-centre snapshot');
    }
  }
}

export const commandCentreService = new CommandCentreService();
