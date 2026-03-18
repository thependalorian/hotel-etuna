import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { designSystem as DS } from '@/constants/designSystem';
import { useNotificationsContext } from '@/contexts/NotificationsContext';

export interface NotificationBellProps {
  size?: number;
  color?: string;
}

export function NotificationBell({ 
  size = DS.components.header.iconSize, 
  color = DS.colors.text 
}: NotificationBellProps) {
  const router = useRouter();
  const { unreadCount } = useNotificationsContext();
  const hasUnread = unreadCount > 0;

  const handlePress = () => {
    router.push('/notifications');
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      accessibilityLabel={`Notifications${hasUnread ? `, ${unreadCount} unread` : ''}`}
      accessibilityRole="button"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="notifications-outline" size={size} color={color} />
      {hasUnread && (
        <View style={styles.badge}>
          {unreadCount < 10 && (
            <View style={styles.badgeDot} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: DS.spacing[2],
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: DS.components.header.notificationBadge,
    height: DS.components.header.notificationBadge,
    backgroundColor: DS.colors.error,
    borderRadius: DS.components.header.notificationBadge / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeDot: {
    width: DS.components.header.notificationBadge,
    height: DS.components.header.notificationBadge,
    borderRadius: DS.components.header.notificationBadge / 2,
    backgroundColor: DS.colors.error,
  },
});
