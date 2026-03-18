import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { notificationService } from '@/services/notifications';
import type { NotificationData, PushNotificationPayload } from '@/types/notifications';

const NOTIFICATIONS_STORAGE_KEY = 'smartpay_notifications';
const MAX_STORED_NOTIFICATIONS = 100;

interface NotificationsContextType {
  notifications: NotificationData[];
  unreadCount: number;
  isLoading: boolean;
  pushToken: string | null;
  permissionGranted: boolean;
  addNotification: (notification: NotificationData) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  requestPermission: () => Promise<boolean>;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const router = useRouter();

  const loadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        const parsed: NotificationData[] = JSON.parse(stored);
        setNotifications(parsed);
        const unread = parsed.filter(n => !n.read).length;
        setUnreadCount(unread);
        await notificationService.setBadgeCount(unread);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const saveNotifications = async (notifications: NotificationData[]) => {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  const addNotification = async (notification: NotificationData) => {
    try {
      const updated = [notification, ...notifications].slice(0, MAX_STORED_NOTIFICATIONS);
      setNotifications(updated);
      await saveNotifications(updated);
      
      if (!notification.read) {
        const newUnreadCount = unreadCount + 1;
        setUnreadCount(newUnreadCount);
        await notificationService.setBadgeCount(newUnreadCount);
      }
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const updated = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      setNotifications(updated);
      await saveNotifications(updated);
      
      const unread = updated.filter(n => !n.read).length;
      setUnreadCount(unread);
      await notificationService.setBadgeCount(unread);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const updated = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updated);
      await saveNotifications(updated);
      setUnreadCount(0);
      await notificationService.clearBadgeCount();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearAll = async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);
      await AsyncStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
      await notificationService.clearBadgeCount();
      await notificationService.dismissAll();
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      const updated = notifications.filter(n => n.id !== notificationId);
      setNotifications(updated);
      await saveNotifications(updated);
      
      if (notification && !notification.read) {
        const newUnreadCount = Math.max(0, unreadCount - 1);
        setUnreadCount(newUnreadCount);
        await notificationService.setBadgeCount(newUnreadCount);
      }
      
      await notificationService.dismissNotification(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const status = await notificationService.requestPermissions();
      setPermissionGranted(status.granted);
      
      if (status.granted) {
        const token = await notificationService.getPushToken();
        if (token) {
          setPushToken(token);
        }
      }
      
      return status.granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const refreshNotifications = async () => {
    await loadNotifications();
  };

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        setIsLoading(true);
        await notificationService.setupChannels();
        await loadNotifications();

        const { status } = await Notifications.getPermissionsAsync();
        setPermissionGranted(status === 'granted');

        if (status === 'granted') {
          const token = await notificationService.getPushToken();
          if (token) {
            setPushToken(token);
          }
        }

        const cachedToken = await notificationService.getCachedPushToken();
        if (cachedToken) {
          setPushToken(cachedToken);
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeNotifications();

    const notificationListener = Notifications.addNotificationReceivedListener(
      async (notification) => {
        const payload = notificationService.parsePayload(notification);
        if (payload) {
          const notificationData: NotificationData = {
            id: notification.request.identifier,
            type: payload.type,
            title: payload.title,
            body: payload.message,
            data: payload.metadata,
            timestamp: notification.date,
            read: false,
          };
          await addNotification(notificationData);
        }
      }
    );

    const responseListener = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const notificationId = response.notification.request.identifier;
        await markAsRead(notificationId);

        const payload = notificationService.parsePayload(response.notification);
        if (payload) {
          const deepLink = notificationService.getDeepLink(payload);
          if (deepLink) {
            setTimeout(() => {
              router.push(deepLink as any);
            }, 100);
          }
        }
      }
    );

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        pushToken,
        permissionGranted,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        deleteNotification,
        requestPermission,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext(): NotificationsContextType {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotificationsContext must be used within a NotificationsProvider');
  }
  return context;
}
