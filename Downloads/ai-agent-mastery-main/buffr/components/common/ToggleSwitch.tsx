/**
 * Toggle Switch Component
 * 
 * Location: components/common/ToggleSwitch.tsx
 * Purpose: Reusable toggle switch component for consistent autopay and settings toggles
 * 
 * Features:
 * - Animated thumb with smooth transitions
 * - Consistent sizing (51x31px)
 * - Active/inactive states
 * - Customizable colors
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';

interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  activeColor?: string;
  inactiveColor?: string;
  disabled?: boolean;
}

export default function ToggleSwitch({
  value,
  onValueChange,
  activeColor = Colors.primary,
  inactiveColor = '#E2E8F0',
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <TouchableOpacity
      style={[
        styles.toggle,
        value && { backgroundColor: activeColor },
        !value && { backgroundColor: inactiveColor },
        disabled && styles.toggleDisabled,
      ]}
      onPress={() => !disabled && onValueChange(!value)}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View
        style={[
          styles.toggleThumb,
          value && styles.toggleThumbActive,
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggle: {
    width: 51,
    height: 31,
    borderRadius: 15.5,
    justifyContent: 'center',
    paddingHorizontal: 2,
    position: 'relative',
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  toggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    position: 'absolute',
    left: 2,
  },
  toggleThumbActive: {
    left: 22,
  },
});
