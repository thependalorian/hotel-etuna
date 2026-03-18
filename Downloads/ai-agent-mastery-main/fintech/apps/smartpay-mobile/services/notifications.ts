/**
 * Notifications Service - SmartPay Mobile
 * Handles user notifications and alerts
 * Location: mobile/services/notifications.ts
 */

import { api } from './api';
import { Notification } from '../types/api';

export { Notification };

/**
 * Get user notifications
 * GET /api/v1/mobile/notifications
 * 
 * Note: This endpoint may not be implemented yet in the backend.
 * For now, return empty array or mock data.
 */
export async function getNotifications(options?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}): Promise<Notification[]> {
  try {
    const params: Record<string, unknown> = {};
    
    if (options?.limit) params.limit = options.limit;
    if (options?.offset) params.offset = options.offset;
    if (options?.unreadOnly) params.unreadOnly = options.unreadOnly;

    const response = await api.get<{ notifications: Notification[] }>(
      '/api/v1/mobile/notifications',
      { params, retry: true }
    );

    return response.notifications || [];
  } catch (error) {
    console.error('getNotifications error:', error);
    
    // Return empty array if endpoint not implemented
    return [];
  }
}

/**
 * Mark notification as read
 * PATCH /api/v1/mobile/notifications/:id/read
 */
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
  try {
    await api.patch(`/api/v1/mobile/notifications/${notificationId}/read`, {});
    return { success: true };
  } catch (error) {
    console.error('markNotificationAsRead error:', error);
    return { success: false };
  }
}

/**
 * Mark all notifications as read
 * POST /api/v1/mobile/notifications/mark-all-read
 */
export async function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
  try {
    await api.post('/api/v1/mobile/notifications/mark-all-read', {});
    return { success: true };
  } catch (error) {
    console.error('markAllNotificationsAsRead error:', error);
    return { success: false };
  }
}

/**
 * Delete notification
 * DELETE /api/v1/mobile/notifications/:id
 */
export async function deleteNotification(notificationId: string): Promise<{ success: boolean }> {
  try {
    await api.delete(`/api/v1/mobile/notifications/${notificationId}`);
    return { success: true };
  } catch (error) {
    console.error('deleteNotification error:', error);
    return { success: false };
  }
}

/**
 * Notification service object for convenient access
 */
export const notificationService = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
