/**
 * HeaderBackButton - Smartpay Copilot
 * 
 * Figma Specs:
 * - Icon: 24px
 * - Touch target: 44px (via hitSlop)
 * - Haptic feedback on press
 * 
 * Props:
 * - onPress: Callback
 * - color: Icon color (default: text primary)
 * 
 * Location: components/layout/HeaderBackButton.tsx
 */
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { designSystem as DS } from '@/constants/designSystem';

export interface HeaderBackButtonProps {
  onPress: () => void;
  color?: string;
}

export function HeaderBackButton({
  onPress,
  color = DS.colors.text,
}: HeaderBackButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      accessibilityLabel="Go back"
      accessibilityRole="button"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      activeOpacity={0.7}
    >
      <Ionicons 
        name="chevron-back" 
        size={DS.components.header.iconSize} 
        color={color} 
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: DS.components.header.iconSize,
    height: DS.components.header.iconSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
