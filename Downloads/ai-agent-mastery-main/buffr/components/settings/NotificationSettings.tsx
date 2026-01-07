/**
 * NotificationSettings Component
 * 
 * Location: components/settings/NotificationSettings.tsx
 * Purpose: Configure notification preferences
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, StyleSheet } from 'react-native';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';

interface NotificationOption {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

interface NotificationSettingsProps {
  onSettingsChange?: (settings: { [key: string]: boolean }) => void;
}

const defaultNotifications: NotificationOption[] = [
  {
    id: 'transactions',
    title: 'Transaction Notifications',
    description: 'Get notified about all transactions',
    enabled: true,
  },
  {
    id: 'requests',
    title: 'Money Requests',
    description: 'Notifications for money requests',
    enabled: true,
  },
  {
    id: 'payments',
    title: 'Payment Reminders',
    description: 'Reminders for upcoming payments',
    enabled: true,
  },
  {
    id: 'promotions',
    title: 'Promotions & Offers',
    description: 'Receive promotional notifications',
    enabled: false,
  },
];

export default function NotificationSettings({
  onSettingsChange,
}: NotificationSettingsProps) {
  const [notifications, setNotifications] = useState(defaultNotifications);

  const handleToggle = (id: string, value: boolean) => {
    const updated = notifications.map((notif) =>
      notif.id === id ? { ...notif, enabled: value } : notif
    );
    setNotifications(updated);

    const settingsMap = updated.reduce(
      (acc, notif) => ({ ...acc, [notif.id]: notif.enabled }),
      {} as { [key: string]: boolean }
    );
    onSettingsChange?.(settingsMap);
  };

  return (
    <ScrollView style={defaultStyles.containerFull} contentContainerStyle={styles.content}>
      <Text style={defaultStyles.headerMedium}>Notification Settings</Text>
      <Text style={defaultStyles.descriptionText}>
        Choose what notifications you want to receive
      </Text>

      <View style={styles.optionsList}>
        {notifications.map((option) => (
          <View key={option.id} style={styles.optionItem}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            <Switch
              value={option.enabled}
              onValueChange={(value) => handleToggle(option.id, value)}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  optionsList: {
    marginTop: 24,
    gap: 16,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionInfo: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
