/**
 * Housekeeping Tasks API
 * 
 * Endpoints:
 * - GET /api/housekeeping/tasks - List all tasks for staff's property
 * - POST /api/housekeeping/tasks - Create a new housekeeping task
 * 
 * Authorization: Housekeeping staff and managers only
 * Rate Limit: Part 11 Gap 8 - Applied via middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { housekeepingTasks, staff, rooms, bookings } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

// Input validation schema
const createTaskSchema = z.object({
  roomId: z.string().uuid(),
  bookingId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  taskType: z.string().default('checkout_cleaning'),
  notes: z.string().optional(),
});

/**
 * GET /api/housekeeping/tasks
 * List housekeeping tasks for the staff's property
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get staff record to find property
    const staffRecord = await db
      .select()
      .from(staff)
      .where(eq(staff.userId, session.user.id))
      .limit(1);

    if (!staffRecord.length) {
      return NextResponse.json({ error: 'Staff record not found' }, { status: 403 });
    }

    const propertyId = staffRecord[0].propertyId;

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Query tasks
    let query = db
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
      .where(eq(housekeepingTasks.propertyId, propertyId));

    // Apply status filter if provided
    if (status && ['dirty', 'cleaning', 'inspecting', 'clean'].includes(status)) {
      query = query.where(eq(housekeepingTasks.status, status as any));
    }

    const tasks = await query.orderBy(desc(housekeepingTasks.createdAt));

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching housekeeping tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/housekeeping/tasks
 * Create a new housekeeping task
 * Authorization: Managers and supervisors only
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get staff record and verify role
    const staffRecord = await db
      .select()
      .from(staff)
      .where(eq(staff.userId, session.user.id))
      .limit(1);

    if (!staffRecord.length) {
      return NextResponse.json({ error: 'Staff record not found' }, { status: 403 });
    }

    const staffData = staffRecord[0];
    
    // Only managers, admin, and housekeeping supervisors can create tasks
    if (!['manager', 'admin', 'housekeeping_supervisor'].includes(staffData.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse and validate input
    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);

    // Verify room belongs to the same property
    const room = await db
      .select()
      .from(rooms)
      .where(eq(rooms.id, validatedData.roomId))
      .limit(1);

    if (!room.length || room[0].propertyId !== staffData.propertyId) {
      return NextResponse.json(
        { error: 'Invalid room or room not in your property' },
        { status: 400 }
      );
    }

    // Create the task
    const [newTask] = await db
      .insert(housekeepingTasks)
      .values({
        propertyId: staffData.propertyId,
        roomId: validatedData.roomId,
        bookingId: validatedData.bookingId,
        assignedTo: validatedData.assignedTo,
        priority: validatedData.priority,
        taskType: validatedData.taskType,
        notes: validatedData.notes,
        status: 'dirty',
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating housekeeping task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
