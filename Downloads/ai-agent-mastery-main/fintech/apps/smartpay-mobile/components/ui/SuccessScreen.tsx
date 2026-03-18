import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { designSystem } from '@/constants/designSystem';

interface SuccessScreenProps {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function SuccessScreen({
  title,
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: SuccessScreenProps) {
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handlePrimaryAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAction();
  };

  const handleSecondaryAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSecondary?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={80} color={designSystem.colors.success} />
      </View>
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handlePrimaryAction}>
        <Text style={styles.primaryButtonText}>{actionLabel}</Text>
      </TouchableOpacity>

      {secondaryLabel && onSecondary && (
        <TouchableOpacity style={styles.secondaryButton} onPress={handleSecondaryAction}>
          <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
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
    padding: designSystem.spacing.xl,
  },
  iconContainer: {
    marginBottom: designSystem.spacing.xl,
  },
  title: {
    ...designSystem.typography.textStyles.heading,
    color: designSystem.colors.text,
    textAlign: 'center',
    marginBottom: designSystem.spacing.md,
  },
  message: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.textSecondary,
    textAlign: 'center',
    marginBottom: designSystem.spacing['2xl'],
  },
  primaryButton: {
    width: '100%',
    height: designSystem.components?.button?.height ?? 48,
    backgroundColor: designSystem.colors.primary,
    borderRadius: designSystem.components?.button?.borderRadius ?? 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designSystem.spacing.md,
    ...designSystem.shadows.md,
  },
  primaryButtonText: {
    ...designSystem.typography.textStyles.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    height: designSystem.components?.button?.height ?? 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.primary,
    fontWeight: '600',
  },
});
