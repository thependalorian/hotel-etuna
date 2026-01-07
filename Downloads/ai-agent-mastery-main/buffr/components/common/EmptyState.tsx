/**
 * EmptyState Component
 * 
 * Location: components/common/EmptyState.tsx
 * Purpose: Reusable empty state display for lists and screens
 * 
 * Features:
 * - Icon display
 * - Title and message text
 * - Optional action button
 * - Consistent styling across the app
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import PillButton from './PillButton';

interface EmptyStateProps {
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  iconSize?: number;
  iconColor?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: object;
}

export default function EmptyState({
  icon = 'inbox',
  iconSize = 48,
  iconColor = Colors.textTertiary,
  title,
  message,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {icon && (
        <FontAwesome name={icon} size={iconSize} color={iconColor} />
      )}
      <Text style={styles.title}>{title}</Text>
      {message && (
        <Text style={styles.message}>{message}</Text>
      )}
      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <PillButton
            label={actionLabel}
            variant="primary"
            onPress={onAction}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionContainer: {
    marginTop: 8,
  },
});
