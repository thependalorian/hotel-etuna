/**
 * AuthSuccess - Success message display component
 * Location: fintech/smartpay/components/auth/feedback/AuthSuccess.tsx
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { designSystem } from '@/constants/designSystem';

export interface AuthSuccessProps {
  message: string;
  icon?: string;
  testID?: string;
}

export function AuthSuccess({
  message,
  icon = '✓',
  testID = 'auth-success',
}: AuthSuccessProps) {
  if (!message) return null;

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const ds = designSystem;
const { colors, spacing, radius } = ds;

const styles = StyleSheet.create({
  container: {
    backgroundColor: `${colors.success}15`,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    fontSize: 20,
    color: colors.success,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: colors.success,
    lineHeight: 20,
    fontWeight: '600',
  },
});
