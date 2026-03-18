/**
 * AuthError - Error message display component
 * Location: fintech/smartpay/components/auth/feedback/AuthError.tsx
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { designSystem } from '@/constants/designSystem';

export interface AuthErrorProps {
  message: string;
  onDismiss?: () => void;
  dismissible?: boolean;
  icon?: string;
  testID?: string;
}

export function AuthError({
  message,
  onDismiss,
  dismissible = false,
  icon = '⚠️',
  testID = 'auth-error',
}: AuthErrorProps) {
  if (!message) return null;

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.content}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      {dismissible && onDismiss && (
        <Pressable
          onPress={onDismiss}
          style={styles.dismissButton}
          accessibilityLabel="Dismiss error"
          testID={`${testID}-dismiss`}
        >
          <Text style={styles.dismissIcon}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

const ds = designSystem;
const { colors, spacing, radius } = ds;

const styles = StyleSheet.create({
  container: {
    backgroundColor: `${colors.error}15`,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    fontSize: 20,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: colors.error,
    lineHeight: 20,
  },
  dismissButton: {
    padding: spacing.xs,
  },
  dismissIcon: {
    fontSize: 18,
    color: colors.error,
  },
});
