/**
 * @fileoverview API route //api/housekeeping/tasks/[id]
 * Location: /app/api/housekeeping/tasks/[id]/route.ts
 */

/**
 * Individual Housekeeping Task API
 *
 * Endpoints:
 * - GET /api/housekeeping/tasks/[id] — Get task details
 * - PATCH /api/housekeeping/tasks/[id] — Update task status and details
 * - DELETE /api/housekeeping/tasks/[id] — Delete task (managers only)
 *
 * RLS: Active via withApiAuth wrapper.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { housekeepingTasks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { withApiAuth } from '@/lib/utils/api-helpers';
import { securityLogger } from '@/lib/utils/security-logger';

const updateTaskSchema = z.object({
  status: z.enum(['dirty', 'cleaning', 'inspecting', 'clean']).optional(),
  assignedTo: z.string().uuid().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  notes: z.string().optional(),
  inspectionNotes: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
});

function hasMgmtRole(role: string | null | undefined): boolean {
  return ['owner', 'manager', 'admin'].includes((role ?? '').toLowerCase());
}

/**
 * GET /api/housekeeping/tasks/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withApiAuth(request, async (_req, _user) => {
    const [task] = await db
      .select()
      .from(housekeepingTasks)
      .where(eq(housekeepingTasks.id, id))
      .limit(1);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task });
  });
}

/**
 * PATCH /api/housekeeping/tasks/[id]
 * Staff can update tasks they're assigned to; managers can update any.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withApiAuth(request, async (_req, user) => {
    const body = await _req.json();
    const validatedData = updateTaskSchema.parse(body);

    // Get existing task
    const [existing] = await db
      .select()
      .from(housekeepingTasks)
      .where(eq(housekeepingTasks.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Authorisation: assigned staff or manager role
    const isAssigned = existing.assignedTo === user.id;
    if (!isAssigned && !hasMgmtRole(user.role)) {
      return NextResponse.json(
        { error: 'You can only update tasks assigned to you' },
        { status: 403 }
      );
    }

    // Auto-set timestamps on status transitions
    const updates: Record<string, unknown> = { ...validatedData, updatedBy: user.id };
    if (validatedData.status === 'cleaning' && !existing.startedAt) {
      updates.startedAt = new Date().toISOString();
    }
    if (validatedData.status === 'clean' && !existing.completedAt) {
      updates.completedAt = new Date().toISOString();
      updates.startedAt = updates.startedAt ?? existing.startedAt ?? new Date().toISOString();
    }

    const [updated] = await db
      .update(housekeepingTasks)
      .set(updates)
      .where(eq(housekeepingTasks.id, id))
      .returning();

    return NextResponse.json({ task: updated });
  });
}

/**
 * DELETE /api/housekeeping/tasks/[id]
 * Managers only.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withApiAuth(request, async (_req, user) => {
    if (!hasMgmtRole(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await db
      .delete(housekeepingTasks)
      .where(and(eq(housekeepingTasks.id, id)));

    return NextResponse.json({ success: true });
  });
}
