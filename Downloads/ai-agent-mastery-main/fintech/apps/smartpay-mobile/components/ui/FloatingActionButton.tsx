/**
 * FloatingActionButton – Circular FAB for primary actions
 * Figma spec: 56×56px circular, 28px icon, shadow lg
 * Position: bottom-right (16px from edge, 100px from bottom)
 * Press animation: scale 0.98
 * Location: mobile/components/ui/FloatingActionButton.tsx
 * 
 * USAGE:
 * ```tsx
 * <FloatingActionButton
 *   icon="arrow-up"
 *   label="Send"
 *   onPress={() => router.push('/send-money')}
 * />
 * ```
 */

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { designSystem as DS } from '@/constants/designSystem';

export interface FloatingActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  onPress: () => void;
  backgroundColor?: string;
  iconColor?: string;
}

export function FloatingActionButton({
  icon,
  label,
  onPress,
  backgroundColor = DS.colors.primary,
  iconColor = DS.colors.background,
}: FloatingActionButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(scaleAnim, {
      toValue: DS.animations.buttonPress.scale,
      duration: DS.animations.buttonPress.duration,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...DS.animations.spring,
    }).start();
  };

  const handlePress = () => {
    onPress();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        style={[styles.fab, { backgroundColor }]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        accessibilityLabel={label || 'Action button'}
        accessibilityRole="button"
      >
        <Ionicons name={icon} size={DS.components.fab.iconSize} color={iconColor} />
        {label && <Text style={[styles.label, { color: iconColor }]}>{label}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: DS.components.fab.right,
    bottom: DS.components.fab.bottom,
  },
  fab: {
    width: DS.components.fab.size,
    height: DS.components.fab.size,
    borderRadius: DS.components.fab.size / 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...DS.shadows.lg,
  },
  label: {
    fontSize: 10,
    fontWeight: DS.typography.fontWeight.semibold,
    marginTop: 2,
  },
});
