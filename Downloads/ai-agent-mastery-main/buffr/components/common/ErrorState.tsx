/**
 * ErrorState Component
 * 
 * Location: components/common/ErrorState.tsx
 * Purpose: Reusable error state display for errors and failures
 * 
 * Features:
 * - Error icon display
 * - Title and message text
 * - Optional retry action button
 * - Consistent error styling across the app
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import PillButton from './PillButton';

interface ErrorStateProps {
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  iconSize?: number;
  title: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  style?: object;
}

export default function ErrorState({
  icon = 'exclamation-circle',
  iconSize = 48,
  title,
  message,
  retryLabel = 'Retry',
  onRetry,
  style,
}: ErrorStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <FontAwesome name={icon} size={iconSize} color={Colors.error} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message && (
        <Text style={styles.message}>{message}</Text>
      )}
      {onRetry && (
        <View style={styles.actionContainer}>
          <PillButton
            label={retryLabel}
            variant="primary"
            onPress={onRetry}
            icon="refresh"
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
  iconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.error + '20', // 20% opacity
    borderRadius: 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  actionContainer: {
    marginTop: 8,
  },
});
