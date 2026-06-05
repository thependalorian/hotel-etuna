/**
 * Individual Housekeeping Task API
 * 
 * Endpoints:
 * - GET /api/housekeeping/tasks/[id] - Get task details
 * - PATCH /api/housekeeping/tasks/[id] - Update task status and details
 * - DELETE /api/housekeeping/tasks/[id] - Delete task (managers only)
 * 
 * Authorization: Staff can view and update assigned tasks, managers can delete
 * Rate Limit: Part 11 Gap 8 - Applied via middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { housekeepingTasks, staff } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { securityLogger } from '@/lib/utils/security-logger.client';

// Input validation schema for updates
const updateTaskSchema = z.object({
  status: z.enum(['dirty', 'cleaning', 'inspecting', 'clean']).optional(),
  assignedTo: z.string().uuid().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  notes: z.string().optional(),
  inspectionNotes: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
});

/**
 * GET /api/housekeeping/tasks/[id]
 * Get a single housekeeping task
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get staff record
    const staffRecord = await db
      .select()
      .from(staff)
      .where(eq(staff.userId, session.user.id))
      .limit(1);

    if (!staffRecord.length || !staffRecord[0].propertyId) {
      return NextResponse.json({ error: 'Staff record not found' }, { status: 403 });
    }

    // Get task
    const task = await db
      .select()
      .from(housekeepingTasks)
      .where(
        and(
          eq(housekeepingTasks.id, id),
          eq(housekeepingTasks.propertyId, staffRecord[0].propertyId)
        )
      )
      .limit(1);

    if (!task.length) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task: task[0] });
  } catch (error) {
    securityLogger.error('Error fetching housekeeping task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/housekeeping/tasks/[id]
 * Update a housekeeping task
 * Staff can update tasks they're assigned to or tasks in their property (if supervisor/manager)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get staff record
    const staffRecord = await db
      .select()
      .from(staff)
      .where(eq(staff.userId, session.user.id))
      .limit(1);

    if (!staffRecord.length || !staffRecord[0].propertyId) {
      return NextResponse.json({ error: 'Staff record not found' }, { status: 403 });
    }

    const staffData = staffRecord[0];

    // Get the task
    const existingTask = await db
      .select()
      .from(housekeepingTasks)
      .where(
        and(
          eq(housekeepingTasks.id, id),
          eq(housekeepingTasks.propertyId, staffData.propertyId!)
        )
      )
      .limit(1);

    if (!existingTask.length) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Authorization check: staff can only update their own tasks unless they're a supervisor/manager
    const isSupervisor = ['manager', 'admin', 'housekeeping_supervisor'].includes(staffData.position ?? '');
    const isAssigned = existingTask[0].assignedTo === staffData.id;

    if (!isSupervisor && !isAssigned) {
      return NextResponse.json(
        { error: 'You can only update tasks assigned to you' },
        { status: 403 }
      );
    }

    // Parse and validate input
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    // Auto-set startedAt when status changes to 'cleaning'
    const updates: any = {
      ...validatedData,
      updatedBy: session.user.id,
    };

    if (validatedData.status === 'cleaning' && !existingTask[0].startedAt) {
      updates.startedAt = new Date().toISOString();
    }

    // Auto-set completedAt when status changes to 'clean'
    if (validatedData.status === 'clean' && !existingTask[0].completedAt) {
      updates.completedAt = new Date().toISOString();
    }

    // Update the task
    const [updatedTask] = await db
      .update(housekeepingTasks)
      .set(updates)
      .where(eq(housekeepingTasks.id, id))
      .returning();

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    securityLogger.error('Error updating housekeeping task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/housekeeping/tasks/[id]
 * Delete a housekeeping task (managers only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    if (!staffRecord.length || !staffRecord[0].propertyId) {
      return NextResponse.json({ error: 'Staff record not found' }, { status: 403 });
    }

    const staffData = staffRecord[0];

    // Only managers and admins can delete tasks
    if (!['manager', 'admin', 'housekeeping_supervisor'].includes(staffData.position ?? '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Delete the task
    await db
      .delete(housekeepingTasks)
      .where(
        and(
          eq(housekeepingTasks.id, id),
          eq(housekeepingTasks.propertyId, staffData.propertyId!)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    securityLogger.error('Error deleting housekeeping task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
