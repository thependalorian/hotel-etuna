/**
 * ErrorState Component - Empty State Pattern
 * 
 * Location: mobile/components/ui/ErrorState.tsx
 * Figma Pattern: Empty states with illustration
 * 
 * Features:
 * - Multiple error variants with icons
 * - Retry button
 * - 160px illustration size (using icon)
 * - Haptic feedback on error
 * - Customizable title and message
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { designSystem as DS } from '@/constants/designSystem';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  illustration?: keyof typeof Ionicons.glyphMap;
  variant?: 'default' | 'network' | 'notFound' | 'unauthorized';
  style?: ViewStyle;
}

export function ErrorState({
  title,
  message,
  onRetry,
  illustration,
  variant = 'default',
  style,
}: ErrorStateProps) {
  const iconMap = {
    default: 'alert-circle-outline',
    network: 'cloud-offline-outline',
    notFound: 'search-outline',
    unauthorized: 'lock-closed-outline',
  } as const;

  const defaultIcon = illustration || iconMap[variant];

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRetry?.();
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.illustrationContainer}>
        <Ionicons
          name={defaultIcon}
          size={160}
          color={DS.colors.error}
          accessibilityLabel="Error illustration"
        />
      </View>

      {title && <Text style={styles.title}>{title}</Text>}
      
      <Text style={styles.message}>{message}</Text>

      {onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry"
          accessibilityHint="Tap to try the action again"
        >
          <Ionicons name="refresh" size={20} color={DS.colors.background} />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DS.spacing.xl,
  },
  illustrationContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DS.spacing.lg,
  },
  title: {
    fontSize: DS.typography.fontSize.xl,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    textAlign: 'center',
    marginBottom: DS.spacing.sm,
  },
  message: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.textSecondary,
    textAlign: 'center',
    marginBottom: DS.spacing.lg,
    maxWidth: 280,
    lineHeight: DS.typography.fontSize.base * DS.typography.lineHeight.normal,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    paddingHorizontal: DS.spacing.xl,
    paddingVertical: DS.spacing.md,
    backgroundColor: DS.colors.primary,
    borderRadius: DS.radius.md,
    minHeight: 48,
    ...DS.shadows.md,
  },
  retryText: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.background,
    fontWeight: DS.typography.fontWeight.semibold,
  },
});
