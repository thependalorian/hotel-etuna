import { db, hkTasks, hkTaskPhotos, rooms } from '@/lib/db';
import { and, eq, inArray, desc, sql } from 'drizzle-orm';
import type { HkTask, NewHkTask, HkTaskPhoto, NewHkTaskPhoto } from '@/lib/db/schema';
import { AppError, handleServiceError } from '@/lib/utils/errors';

export interface CreateTaskInput {
  tenantId: string;
  propertyId: string;
  roomId: string;
  bookingId?: string;
  taskType: 'checkout_clean' | 'stayover' | 'deep_clean' | 'maintenance';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  assignedTo?: string;
}

export interface TaskFilters {
  status?: string | string[];
  assignedTo?: string;
  roomId?: string;
  propertyId?: string;
  taskType?: string;
}

export interface AddPhotoInput {
  tenantId: string;
  taskId: string;
  photoUrl: string;
  caption?: string;
  uploadedBy?: string;
}

export class HousekeepingService {
  /**
   * Create a new housekeeping task
   */
  async createTask(data: CreateTaskInput): Promise<HkTask> {
    try {
      const [task] = await db
        .insert(hkTasks)
        .values({
          tenantId: data.tenantId,
          propertyId: data.propertyId,
          roomId: data.roomId,
          bookingId: data.bookingId || null,
          taskType: data.taskType,
          priority: data.priority || 'normal',
          notes: data.notes || null,
          assignedTo: data.assignedTo || null,
          status: 'pending',
        })
        .returning();

      return task;
    } catch (error) {
      throw handleServiceError(error, 'Error creating housekeeping task');
    }
  }

  /**
   * Get tasks with optional filters
   */
  async getTasks(tenantId: string, filters?: TaskFilters): Promise<HkTask[]> {
    try {
      const conditions = [eq(hkTasks.tenantId, tenantId)];

      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          conditions.push(inArray(hkTasks.status, filters.status as any[]));
        } else {
          conditions.push(eq(hkTasks.status, filters.status as any));
        }
      }

      if (filters?.assignedTo) {
        conditions.push(eq(hkTasks.assignedTo, filters.assignedTo));
      }

      if (filters?.roomId) {
        conditions.push(eq(hkTasks.roomId, filters.roomId));
      }

      if (filters?.propertyId) {
        conditions.push(eq(hkTasks.propertyId, filters.propertyId));
      }

      if (filters?.taskType) {
        conditions.push(eq(hkTasks.taskType, filters.taskType as any));
      }

      const tasks = await db
        .select()
        .from(hkTasks)
        .where(and(...conditions))
        .orderBy(desc(hkTasks.createdAt));

      return tasks;
    } catch (error) {
      throw handleServiceError(error, 'Error fetching housekeeping tasks');
    }
  }

  /**
   * Assign task to a user
   */
  async assignTask(taskId: string, userId: string, tenantId: string): Promise<void> {
    try {
      const [task] = await db
        .update(hkTasks)
        .set({ 
          assignedTo: userId,
          updatedAt: new Date(),
        })
        .where(and(
          eq(hkTasks.id, taskId),
          eq(hkTasks.tenantId, tenantId)
        ))
        .returning();

      if (!task) {
        throw new AppError(404, 'Task not found');
      }
    } catch (error) {
      throw handleServiceError(error, 'Error assigning task');
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(
    taskId: string, 
    status: 'pending' | 'in_progress' | 'inspection' | 'completed' | 'cancelled',
    tenantId: string
  ): Promise<HkTask> {
    try {
      const now = new Date();
      const updateData: Partial<HkTask> = {
        status,
        updatedAt: now,
      };

      // Set timestamps based on status
      if (status === 'in_progress' && !updateData.startedAt) {
        updateData.startedAt = now;
      }

      if (status === 'completed') {
        updateData.completedAt = now;
      }

      const [task] = await db
        .update(hkTasks)
        .set(updateData)
        .where(and(
          eq(hkTasks.id, taskId),
          eq(hkTasks.tenantId, tenantId)
        ))
        .returning();

      if (!task) {
        throw new AppError(404, 'Task not found');
      }

      // If task completed, update room status to 'available'
      if (status === 'completed') {
        await db
          .update(rooms)
          .set({ 
            status: 'available',
            updatedAt: now,
          })
          .where(eq(rooms.id, task.roomId));
      }

      return task;
    } catch (error) {
      throw handleServiceError(error, 'Error updating task status');
    }
  }

  /**
   * Auto-generate checkout tasks for checked-out bookings
   * Called from booking checkout flow
   */
  async autoGenerateCheckoutTasks(): Promise<void> {
    try {
      // This method can be called periodically or via webhook
      // For now, it's a placeholder as task creation happens inline during checkout
      // See integration in BookingService
    } catch (error) {
      throw handleServiceError(error, 'Error auto-generating checkout tasks');
    }
  }

  /**
   * Add photo to task
   */
  async addPhoto(data: AddPhotoInput): Promise<HkTaskPhoto> {
    try {
      // Check photo limit (max 5 per task)
      const existingPhotos = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(hkTaskPhotos)
        .where(and(
          eq(hkTaskPhotos.taskId, data.taskId),
          eq(hkTaskPhotos.tenantId, data.tenantId)
        ));

      const photoCount = existingPhotos[0]?.count || 0;
      if (photoCount >= 5) {
        throw new AppError(400, 'Maximum 5 photos per task');
      }

      const [photo] = await db
        .insert(hkTaskPhotos)
        .values({
          tenantId: data.tenantId,
          taskId: data.taskId,
          photoUrl: data.photoUrl,
          caption: data.caption || null,
          uploadedBy: data.uploadedBy || null,
        })
        .returning();

      return photo;
    } catch (error) {
      throw handleServiceError(error, 'Error adding photo to task');
    }
  }

  /**
   * Get photos for a task
   */
  async getTaskPhotos(taskId: string, tenantId: string): Promise<HkTaskPhoto[]> {
    try {
      const photos = await db
        .select()
        .from(hkTaskPhotos)
        .where(and(
          eq(hkTaskPhotos.taskId, taskId),
          eq(hkTaskPhotos.tenantId, tenantId)
        ))
        .orderBy(desc(hkTaskPhotos.uploadedAt));

      return photos;
    } catch (error) {
      throw handleServiceError(error, 'Error fetching task photos');
    }
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string, tenantId: string): Promise<HkTask | null> {
    try {
      const [task] = await db
        .select()
        .from(hkTasks)
        .where(and(
          eq(hkTasks.id, taskId),
          eq(hkTasks.tenantId, tenantId)
        ));

      return task || null;
    } catch (error) {
      throw handleServiceError(error, 'Error fetching task');
    }
  }
}
