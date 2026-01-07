/**
 * SettingsItem Component
 * 
 * Location: components/common/SettingsItem.tsx
 * Purpose: Reusable settings list item with icon, title, and chevron
 * 
 * Features:
 * - Icon on the left
 * - Title text
 * - Chevron indicator on the right
 * - Consistent styling with profile/settings screens
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

interface SettingsItemProps {
  title: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  onPress?: () => void;
  isLast?: boolean;
}

export default function SettingsItem({
  title,
  icon,
  onPress,
  isLast = false,
}: SettingsItemProps) {
  return (
    <TouchableOpacity
      style={[styles.settingsItem, isLast && styles.settingsItemLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingsItemLeft}>
        <View style={styles.settingsIconContainer}>
          <FontAwesome
            name={icon as any}
            size={20}
            color={Colors.primary}
          />
        </View>
        <Text style={styles.settingsItemTitle}>{title}</Text>
      </View>
      <FontAwesome name="chevron-right" size={14} color={Colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingsItemLast: {
    borderBottomWidth: 0,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text, // Ensure good contrast
    flex: 1,
  },
});
