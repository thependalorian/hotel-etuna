/**
 * GuestServiceRequestService
 *
 * Purpose: Create and list guest-raised service/maintenance requests for an active
 *   stay. Housekeeping & maintenance requests also spawn a linked housekeeping_tasks
 *   row so they appear on the staff board (/housekeeping) immediately — the agentic
 *   guest → staff loop.
 * Location: /lib/services/guest/GuestServiceRequestService.ts
 * Reference: PRD §1.1 Goal 1, §3.4a; PLANNING § Agentic CRM & Intelligent OS roadmap.
 */

import { db, bookings, bookingRooms, rooms, housekeepingTasks, guestServiceRequests } from '@/lib/db';
import { and, desc, eq } from 'drizzle-orm';
import { AppError } from '@/lib/utils/errors';
import type { GuestServiceRequest } from '@/lib/db/schema';
import {
  defaultPriority,
  housekeepingTaskType,
  spawnsHousekeepingTask,
  type GuestServiceRequestType,
} from '@/lib/services/guest/guest-service-request-mapping';

export interface CreateGuestServiceRequestInput {
  requestType: GuestServiceRequestType;
  category?: string | null;
  description?: string | null;
  photos?: string[];
}

export interface CreateGuestServiceRequestOptions {
  createdByUserId?: string | null;
}

export class GuestServiceRequestService {
  /**
   * Create a guest service/maintenance request for a stay and, for
   * housekeeping/maintenance, a linked housekeeping task for staff.
   * @param bookingId - The stay the request belongs to.
   * @param input - Request type, category, description, optional photos.
   * @param options - Audit metadata (createdByUserId).
   * @returns The created guest_service_requests row.
   */
  async createRequest(
    bookingId: string,
    input: CreateGuestServiceRequestInput,
    options: CreateGuestServiceRequestOptions = {}
  ): Promise<GuestServiceRequest> {
    const bookingRows = await db
      .select({
        tenantId: bookings.tenantId,
        propertyId: bookings.propertyId,
        guestId: bookings.guestId,
        status: bookings.status,
      })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    const booking = bookingRows[0];
    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }
    if (booking.status !== 'checked_in') {
      throw new AppError(400, 'Service requests are available once you are checked in');
    }
    if (!booking.tenantId || !booking.propertyId) {
      throw new AppError(400, 'Booking is not linked to a property');
    }

    // Resolve the (first) room on the stay so staff know where to go.
    const roomRows = await db
      .select({ roomId: bookingRooms.roomId, roomNumber: rooms.roomNumber })
      .from(bookingRooms)
      .leftJoin(rooms, eq(bookingRooms.roomId, rooms.id))
      .where(eq(bookingRooms.bookingId, bookingId))
      .limit(1);
    const room = roomRows[0];

    const priority = defaultPriority(input.requestType, input.category);
    const photos = input.photos ?? [];

    // Spawn a staff task for housekeeping/maintenance requests.
    let housekeepingTaskId: string | null = null;
    if (spawnsHousekeepingTask(input.requestType) && room?.roomId) {
      const taskNote = [
        `Guest ${input.requestType} request`,
        input.category ? `(${input.category})` : null,
        input.description ? `— ${input.description}` : null,
        room?.roomNumber ? `[Room ${room.roomNumber}]` : null,
      ]
        .filter(Boolean)
        .join(' ');

      const [task] = await db
        .insert(housekeepingTasks)
        .values({
          propertyId: booking.propertyId,
          roomId: room.roomId,
          bookingId,
          status: 'dirty',
          priority,
          taskType: housekeepingTaskType(input.requestType, input.category),
          notes: taskNote,
          photos,
          createdBy: options.createdByUserId ?? null,
        })
        .returning({ id: housekeepingTasks.id });
      housekeepingTaskId = task?.id ?? null;
    }

    const [created] = await db
      .insert(guestServiceRequests)
      .values({
        tenantId: booking.tenantId,
        propertyId: booking.propertyId,
        bookingId,
        roomId: room?.roomId ?? null,
        guestId: booking.guestId ?? null,
        requestType: input.requestType,
        category: input.category ?? null,
        description: input.description ?? null,
        photos,
        status: 'open',
        priority,
        housekeepingTaskId,
        createdBy: options.createdByUserId ?? null,
      })
      .returning();

    if (!created) {
      throw new AppError(500, 'Failed to create service request');
    }
    return created;
  }

  /**
   * List service requests for a stay, newest first.
   * @param bookingId - The stay to list requests for.
   * @returns The guest_service_requests rows for the booking.
   */
  async listForBooking(bookingId: string): Promise<GuestServiceRequest[]> {
    return db
      .select()
      .from(guestServiceRequests)
      .where(eq(guestServiceRequests.bookingId, bookingId))
      .orderBy(desc(guestServiceRequests.createdAt));
  }

  /**
   * List open/active service requests for a property (staff view).
   * @param propertyId - The property to scope to.
   * @returns Unresolved guest_service_requests rows, newest first.
   */
  async listOpenForProperty(propertyId: string): Promise<GuestServiceRequest[]> {
    return db
      .select()
      .from(guestServiceRequests)
      .where(
        and(
          eq(guestServiceRequests.propertyId, propertyId),
          eq(guestServiceRequests.status, 'open')
        )
      )
      .orderBy(desc(guestServiceRequests.createdAt));
  }
}
