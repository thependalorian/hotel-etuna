import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/constants/designSystem';
import { AppHeader } from '@/components/layout';
import { useNotificationsContext } from '@/contexts/NotificationsContext';
import type { NotificationData } from '@/types/notifications';

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

function getNotificationIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'payment_received':
      return 'arrow-down-circle';
    case 'payment_sent':
      return 'arrow-up-circle';
    case 'kyc_status_update':
      return 'shield-checkmark';
    case 'proof_of_life_reminder':
      return 'time';
    case 'voucher_received':
      return 'gift';
    case 'group_invitation':
      return 'people';
    case 'loan_status_update':
      return 'card';
    case 'transaction_failed':
      return 'alert-circle';
    case 'wallet_low_balance':
      return 'wallet';
    case 'payment_request_received':
    case 'payment_request_paid':
      return 'swap-horizontal';
    case 'system_announcement':
      return 'megaphone';
    default:
      return 'notifications';
  }
}

function getNotificationColor(type: string): string {
  switch (type) {
    case 'payment_received':
    case 'voucher_received':
      return designSystem.colors.success;
    case 'payment_sent':
    case 'transaction_failed':
      return designSystem.colors.error;
    case 'kyc_status_update':
      return designSystem.colors.brand.primary;
    case 'proof_of_life_reminder':
    case 'wallet_low_balance':
      return designSystem.colors.warning;
    case 'loan_status_update':
      return '#FF5722';
    case 'group_invitation':
      return '#9C27B0';
    default:
      return designSystem.colors.textSecondary;
  }
}

function NotificationItem({
  notification,
  onPress,
  onDelete,
}: {
  notification: NotificationData;
  onPress: () => void;
  onDelete: () => void;
}) {
  const icon = getNotificationIcon(notification.type);
  const color = getNotificationColor(notification.type);

  return (
    <TouchableOpacity
      style={[styles.notificationItem, !notification.read && styles.unreadNotification]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.notificationTime}>
            {formatTimestamp(notification.timestamp)}
          </Text>
        </View>
        
        <Text style={styles.notificationBody} numberOfLines={2}>
          {notification.body}
        </Text>
        
        {!notification.read && <View style={styles.unreadDot} />}
      </View>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={onDelete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close-circle" size={20} color={designSystem.colors.textTertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
    refreshNotifications,
  } = useNotificationsContext();

  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: NotificationData) => {
    await markAsRead(notification.id);
    
    if (notification.data?.deepLink) {
      router.push(notification.data.deepLink);
    }
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    
    clearAll();
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return;
    markAllAsRead();
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader
          title="Notifications"
          showSearch={false}
          showBackButton={true}
          onBackPress={() => router.back()}
        />

        <View style={styles.controls}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.controlButton} onPress={handleMarkAllRead}>
              <Text style={styles.controlButtonText}>Mark all read</Text>
            </TouchableOpacity>
          )}
          
          {notifications.length > 0 && (
            <TouchableOpacity style={styles.controlButton} onPress={handleClearAll}>
              <Text style={[styles.controlButtonText, styles.clearAllText]}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons 
                name="notifications-outline" 
                size={64} 
                color={designSystem.colors.textTertiary} 
              />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyMessage}>
                You'll see payment updates, reminders, and important alerts here
              </Text>
            </View>
          ) : (
            <View style={styles.notificationsList}>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onPress={() => handleNotificationPress(notification)}
                  onDelete={() => deleteNotification(notification.id)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: designSystem.colors.background,
  },
  safe: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: designSystem.spacing[4],
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: designSystem.spacing[2],
    paddingHorizontal: designSystem.spacing[4],
    paddingVertical: designSystem.spacing[3],
  },
  controlButton: {
    paddingHorizontal: designSystem.spacing[3],
    paddingVertical: designSystem.spacing[2],
  },
  controlButtonText: {
    fontSize: designSystem.typography.fontSize.sm,
    fontWeight: designSystem.typography.fontWeight.medium,
    color: designSystem.colors.brand.primary,
  },
  clearAllText: {
    color: designSystem.colors.error,
  },
  notificationsList: {
    gap: designSystem.spacing[2],
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.radius.lg,
    padding: designSystem.spacing[4],
    gap: designSystem.spacing[3],
    ...Platform.select({
      ios: designSystem.shadows.sm,
      android: { elevation: 2 },
    }),
  },
  unreadNotification: {
    borderLeftWidth: 3,
    borderLeftColor: designSystem.colors.brand,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    gap: designSystem.spacing[1],
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: designSystem.spacing[2],
  },
  notificationTitle: {
    flex: 1,
    fontSize: designSystem.typography.fontSize.base,
    fontWeight: designSystem.typography.fontWeight.semibold,
    color: designSystem.colors.text,
  },
  notificationTime: {
    fontSize: designSystem.typography.fontSize.xs,
    color: designSystem.colors.textTertiary,
  },
  notificationBody: {
    fontSize: designSystem.typography.fontSize.sm,
    color: designSystem.colors.textSecondary,
    lineHeight: 20,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: designSystem.colors.brand.primary,
  },
  deleteButton: {
    padding: designSystem.spacing[1],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: designSystem.spacing[12],
    gap: designSystem.spacing[3],
  },
  emptyTitle: {
    fontSize: designSystem.typography.fontSize.xl,
    fontWeight: designSystem.typography.fontWeight.semibold,
    color: designSystem.colors.text,
  },
  emptyMessage: {
    fontSize: designSystem.typography.fontSize.base,
    color: designSystem.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: designSystem.spacing[8],
  },
});
