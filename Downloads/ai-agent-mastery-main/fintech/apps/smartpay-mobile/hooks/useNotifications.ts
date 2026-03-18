import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { notificationService } from '@/services/notifications';
import type {
  NotificationPermissionStatus,
  PushNotificationPayload,
} from '@/types/notifications';

export interface UseNotificationsReturn {
  permissionStatus: NotificationPermissionStatus | null;
  isLoading: boolean;
  pushToken: string | null;
  lastNotification: Notifications.Notification | null;
  requestPermission: () => Promise<boolean>;
  setupNotifications: () => Promise<void>;
  clearBadge: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);
  
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const requestPermission = async (): Promise<boolean> => {
    try {
      const status = await notificationService.requestPermissions();
      setPermissionStatus(status);
      return status.granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const setupNotifications = async (): Promise<void> => {
    try {
      setIsLoading(true);

      await notificationService.setupChannels();

      const cachedToken = await notificationService.getCachedPushToken();
      if (cachedToken) {
        setPushToken(cachedToken);
      }

      const status = await Notifications.getPermissionsAsync();
      setPermissionStatus({
        granted: status.status === 'granted',
        canAskAgain: status.canAskAgain,
      });

      if (status.status === 'granted') {
        const token = await notificationService.getPushToken();
        if (token) {
          setPushToken(token);
        }
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearBadge = async (): Promise<void> => {
    await notificationService.clearBadgeCount();
  };

  const handleNotification = (notification: Notifications.Notification) => {
    setLastNotification(notification);
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const payload = notificationService.parsePayload(response.notification);
    
    if (payload) {
      const deepLink = notificationService.getDeepLink(payload);
      if (deepLink) {
        router.push(deepLink as any);
      }
    }
  };

  useEffect(() => {
    setupNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(handleNotification);

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return {
    permissionStatus,
    isLoading,
    pushToken,
    lastNotification,
    requestPermission,
    setupNotifications,
    clearBadge,
  };
}
