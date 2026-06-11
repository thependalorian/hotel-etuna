/**
 * StaffShiftService — CRUD for staff_shifts roster rows.
 * Location: lib/services/staff/StaffShiftService.ts
 */

import { db, staffShifts } from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import { AppError, handleServiceError } from '@/lib/utils/errors';

export type CreateShiftInput = {
  staffId: string;
  propertyId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  position?: string;
  shiftType?: string;
  notes?: string;
};

export class StaffShiftService {
  async createShift(tenantId: string, input: CreateShiftInput) {
    try {
      const [row] = await db
        .insert(staffShifts)
        .values({
          staffId: input.staffId,
          tenantId,
          propertyId: input.propertyId,
          shiftDate: input.shiftDate,
          startTime: input.startTime,
          endTime: input.endTime,
          position: input.position ?? null,
          shiftType: input.shiftType ?? 'regular',
          status: 'scheduled',
          notes: input.notes ?? null,
        })
        .returning();
      if (!row) throw new AppError(500, 'Failed to create shift');
      return row;
    } catch (error) {
      throw handleServiceError(error, 'Error creating shift');
    }
  }

  async updateShift(
    tenantId: string,
    shiftId: string,
    input: Partial<CreateShiftInput> & { status?: string }
  ) {
    try {
      const [row] = await db
        .update(staffShifts)
        .set({
          ...(input.shiftDate ? { shiftDate: input.shiftDate } : {}),
          ...(input.startTime ? { startTime: input.startTime } : {}),
          ...(input.endTime ? { endTime: input.endTime } : {}),
          ...(input.position !== undefined ? { position: input.position } : {}),
          ...(input.shiftType ? { shiftType: input.shiftType } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          ...(input.status ? { status: input.status } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(staffShifts.id, shiftId), eq(staffShifts.tenantId, tenantId)))
        .returning();
      if (!row) throw new AppError(404, 'Shift not found');
      return row;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleServiceError(error, 'Error updating shift');
    }
  }

  async deleteShift(tenantId: string, shiftId: string): Promise<void> {
    try {
      const [row] = await db
        .delete(staffShifts)
        .where(and(eq(staffShifts.id, shiftId), eq(staffShifts.tenantId, tenantId)))
        .returning({ id: staffShifts.id });
      if (!row) throw new AppError(404, 'Shift not found');
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleServiceError(error, 'Error deleting shift');
    }
  }
}
