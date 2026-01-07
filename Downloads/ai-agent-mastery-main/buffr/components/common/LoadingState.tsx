/**
 * LoadingState Component
 * 
 * Location: components/common/LoadingState.tsx
 * Purpose: Reusable loading state display
 * 
 * Features:
 * - Activity indicator
 * - Optional loading message
 * - Consistent styling
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: object;
}

export default function LoadingState({
  message = 'Loading...',
  size = 'large',
  color = Colors.primary,
  style,
}: LoadingStateProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  message: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
