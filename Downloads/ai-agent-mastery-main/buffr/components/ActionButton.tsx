/**
 * ActionButton Component
 * 
 * Location: components/ActionButton.tsx
 * Purpose: Reusable action button (Send, Scan, etc.)
 * 
 * Displays action button with icon and label
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

interface ActionButtonProps {
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  variant?: 'primary' | 'dark';
  onPress?: () => void;
}

export default function ActionButton({
  label,
  icon,
  variant = 'primary',
  onPress,
}: ActionButtonProps) {
  const backgroundColor = variant === 'primary' ? Colors.primary : Colors.dark;

  return (
    <TouchableOpacity
      style={[styles.actionButton, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <FontAwesome name={icon} size={22} color={Colors.white} />
      <Text style={styles.actionButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
    maxWidth: 160,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: Colors.dark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
