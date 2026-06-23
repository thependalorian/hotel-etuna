/**
 * @fileoverview MaintenanceInsightsService — predictive maintenance from request history.
 * Location: lib/services/intelligence/MaintenanceInsightsService.ts
 *
 * Read-only analytics: scans maintenance-type guest service requests over a trailing window and
 * flags rooms with repeat issues so ops can proactively inspect them before they recur. No new
 * table — this derives from existing `guest_service_requests`. Reason: surfacing a signal, not
 * mutating state, so it stays a pure query with no approval workflow.
 */
import {
  db,
  guestServiceRequests,
  rooms as roomsSchema,
  and,
  eq,
  gte,
  desc,
} from '@/lib/db';
import { handleServiceError } from '@/lib/utils/errors';

/** A room flagged for inspection because maintenance issues keep recurring. */
export type RoomMaintenanceFlag = {
  roomId: string;
  roomNumber: string | null;
  roomType: string | null;
  issueCount: number;
  openCount: number;
  categories: string[];
  lastReportedAt: string | null;
  severity: 'watch' | 'inspect';
};

export class MaintenanceInsightsService {
  /**
   * Rooms with repeat maintenance issues in the trailing window.
   * @param input - tenant + optional property + lookback days (default 90) + min issues to flag (default 3).
   * @returns Flagged rooms, most issues first.
   */
  async getRepeatIssueRooms(input: {
    tenantId: string;
    propertyId?: string | null;
    lookbackDays?: number;
    minIssues?: number;
  }): Promise<RoomMaintenanceFlag[]> {
    try {
      const lookbackDays = Math.max(7, Math.min(365, input.lookbackDays ?? 90));
      const minIssues = Math.max(2, input.minIssues ?? 3);
      const since = new Date(Date.now() - lookbackDays * 86_400_000);

      const where = input.propertyId
        ? and(
            eq(guestServiceRequests.tenantId, input.tenantId),
            eq(guestServiceRequests.propertyId, input.propertyId),
            eq(guestServiceRequests.requestType, 'maintenance'),
            gte(guestServiceRequests.createdAt, since),
          )
        : and(
            eq(guestServiceRequests.tenantId, input.tenantId),
            eq(guestServiceRequests.requestType, 'maintenance'),
            gte(guestServiceRequests.createdAt, since),
          );

      const rows = await db
        .select({
          roomId: guestServiceRequests.roomId,
          roomNumber: roomsSchema.roomNumber,
          roomType: roomsSchema.roomType,
          category: guestServiceRequests.category,
          status: guestServiceRequests.status,
          createdAt: guestServiceRequests.createdAt,
        })
        .from(guestServiceRequests)
        .leftJoin(roomsSchema, eq(guestServiceRequests.roomId, roomsSchema.id))
        .where(where)
        .orderBy(desc(guestServiceRequests.createdAt));

      const byRoom = new Map<string, RoomMaintenanceFlag>();
      for (const r of rows) {
        if (!r.roomId) continue; // unroomed requests can't point at an asset
        const existing = byRoom.get(r.roomId);
        const isOpen = r.status !== 'resolved' && r.status !== 'cancelled';
        const reportedAt = r.createdAt ? new Date(r.createdAt).toISOString() : null;
        if (existing) {
          existing.issueCount += 1;
          if (isOpen) existing.openCount += 1;
          if (r.category && !existing.categories.includes(r.category)) existing.categories.push(r.category);
        } else {
          byRoom.set(r.roomId, {
            roomId: r.roomId,
            roomNumber: r.roomNumber,
            roomType: r.roomType,
            issueCount: 1,
            openCount: isOpen ? 1 : 0,
            categories: r.category ? [r.category] : [],
            lastReportedAt: reportedAt, // rows are desc by createdAt → first seen is the latest
            severity: 'watch',
          });
        }
      }

      return [...byRoom.values()]
        .filter((flag) => flag.issueCount >= minIssues)
        .map((flag): RoomMaintenanceFlag => ({
          ...flag,
          severity: flag.issueCount >= minIssues + 2 || flag.openCount >= 2 ? 'inspect' : 'watch',
        }))
        .sort((a, b) => b.issueCount - a.issueCount);
    } catch (error) {
      throw handleServiceError(error, 'Error building maintenance insights');
    }
  }
}

export const maintenanceInsightsService = new MaintenanceInsightsService();
