/**
 * LoadingSpinner - Loading state indicator
 * Location: fintech/smartpay/components/auth/feedback/LoadingSpinner.tsx
 */
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { designSystem } from '@/constants/designSystem';

export interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  testID?: string;
}

export function LoadingSpinner({
  message,
  size = 'large',
  color = designSystem.colors.brand.primary,
  testID = 'loading-spinner',
}: LoadingSpinnerProps) {
  return (
    <View style={styles.container} testID={testID}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const ds = designSystem;
const { colors, spacing } = ds;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  message: {
    fontSize: 14,
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },
});
