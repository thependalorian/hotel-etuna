/**
 * RoundBtn – Circular icon button with label (Revolut-style quick action).
 * Enhanced with haptic feedback. Used on Home for Send, Cash out, etc.
 * Location: fintech/smartpay/components/RoundBtn.tsx
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { designSystem } from '@/constants/designSystem';

const ds = designSystem;
const { colors } = ds;

type SymbolName = { ios: string; android: string; web: string } | string;

export interface RoundBtnProps {
  icon: SymbolName;
  text: string;
  onPress?: () => void;
  disabled?: boolean;
}

export default function RoundBtn({ icon, text, onPress, disabled }: RoundBtnProps) {
  const symbolName = typeof icon === 'string' ? { ios: icon, android: icon, web: icon } : icon;
  
  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={styles.circle}>
        <SymbolView
          name={symbolName}
          size={28}
          tintColor={colors.brand.primary}
        />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {text}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: ds.spacing.sm,
    minWidth: 72,
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.brand.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.neutral.text,
  },
});
