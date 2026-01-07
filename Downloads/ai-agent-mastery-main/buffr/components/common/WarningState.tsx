/**
 * WarningState Component
 * 
 * Location: components/common/WarningState.tsx
 * Purpose: Reusable warning state display for warnings and cautions
 * 
 * Features:
 * - Warning icon display
 * - Title and message text
 * - Optional action button
 * - Consistent warning styling across the app
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import PillButton from './PillButton';

interface WarningStateProps {
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  iconSize?: number;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: object;
}

export default function WarningState({
  icon = 'exclamation-triangle',
  iconSize = 48,
  title,
  message,
  actionLabel,
  onAction,
  style,
}: WarningStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <FontAwesome name={icon} size={iconSize} color={Colors.warning} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message && (
        <Text style={styles.message}>{message}</Text>
      )}
      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <PillButton
            label={actionLabel}
            variant="outline"
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
  iconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.warning + '20', // 20% opacity
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
