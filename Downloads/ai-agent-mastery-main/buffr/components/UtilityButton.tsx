/**
 * UtilityButton Component
 * 
 * Location: components/UtilityButton.tsx
 * Purpose: Reusable utility/service button for the grid
 * 
 * Displays utility service button with icon and label
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

interface UtilityButtonProps {
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  iconColor?: string;
  width?: number;
  onPress?: () => void;
}

export default function UtilityButton({
  label,
  icon,
  iconColor = Colors.primary,
  width,
  onPress,
}: UtilityButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.utilityButton, { width }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <FontAwesome name={icon} size={24} color={iconColor} />
      <Text style={styles.utilityButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  utilityButton: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 100,
    gap: 8,
    marginBottom: 12,
    shadowColor: Colors.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  utilityButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 14,
  },
});
