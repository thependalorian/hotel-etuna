/**
 * @fileoverview API route //api/housekeeping/tasks
 * Location: /app/api/housekeeping/tasks/route.ts
 */

/**
 * Housekeeping Tasks API
 *
 * Endpoints:
 * - GET /api/housekeeping/tasks - List tasks for staff's property
 * - POST /api/housekeeping/tasks - Create a task (managers/supervisors only)
 *
 * RLS: Active via withApiAuth wrapper — sets app.tenant_id before queries.
 * RLS policies on housekeeping_tasks use app.tenant_id + app.tenant_type (migration 0021).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { housekeepingTasks, staff, rooms, bookings } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { withApiAuth } from '@/lib/utils/api-helpers';
import { securityLogger } from '@/lib/utils/security-logger';

const createTaskSchema = z.object({
  roomId: z.string().uuid(),
  bookingId: z.string().uuid().nullish().transform(val => val ?? undefined),
  assignedTo: z.string().uuid().nullish().transform(val => val ?? undefined),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  taskType: z.string().default('checkout_cleaning'),
  notes: z.string().optional(),
});

/**
 * GET /api/housekeeping/tasks
 * List housekeeping tasks for the staff's property.
 * RLS scopes to tenant via app.tenant_id.
 */
export async function GET(request: NextRequest) {
  return withApiAuth(request, async (req, user) => {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    const conditions = [];
    if (statusFilter && ['dirty', 'cleaning', 'inspecting', 'clean'].includes(statusFilter)) {
      conditions.push(eq(housekeepingTasks.status, statusFilter as 'dirty' | 'cleaning' | 'inspecting' | 'clean'));
    }

    const tasks = await db
      .select({
        task: housekeepingTasks,
        room: rooms,
        booking: bookings,
        assignedStaff: staff,
      })
      .from(housekeepingTasks)
      .leftJoin(rooms, eq(housekeepingTasks.roomId, rooms.id))
      .leftJoin(bookings, eq(housekeepingTasks.bookingId, bookings.id))
      .leftJoin(staff, eq(housekeepingTasks.assignedTo, staff.id))
      .where(and(...conditions))
      .orderBy(desc(housekeepingTasks.createdAt));

    return NextResponse.json({ tasks });
  });
}

/**
 * POST /api/housekeeping/tasks
 * Create a new housekeeping task.
 * Authorization: managers, admin, or housekeeping_supervisor role only.
 */
export async function POST(request: NextRequest) {
  return withApiAuth(request, async (req, user) => {
    // Verify user is a manager/supervisor via role check
    const allowedRoles = ['owner', 'manager', 'admin', 'housekeeping_supervisor'];
    const userRole = (user.role ?? '').toLowerCase();
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions — managers only' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = createTaskSchema.parse(body);

    // Verify room exists in the same tenant (RLS handles scope)
    const room = await db
      .select()
      .from(rooms)
      .where(eq(rooms.id, validatedData.roomId))
      .limit(1);

    if (!room.length) {
      return NextResponse.json({ error: 'Room not found' }, { status: 400 });
    }

    if (!room[0].propertyId) {
      return NextResponse.json({ error: 'Room has no property assigned' }, { status: 400 });
    }

    const [newTask] = await db
      .insert(housekeepingTasks)
      .values({
        propertyId: room[0].propertyId!,
        roomId: validatedData.roomId,
        bookingId: validatedData.bookingId,
        assignedTo: validatedData.assignedTo,
        priority: validatedData.priority,
        taskType: validatedData.taskType,
        notes: validatedData.notes,
        status: 'dirty',
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({ task: newTask }, { status: 201 });
  });
}
