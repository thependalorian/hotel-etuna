/**
 * CopilotErrorState – Smartpay Agentic Copilot.
 * Error and offline state for copilot flows.
 * Location: fintech/smartpay/components/copilot/CopilotErrorState.tsx
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { designSystem } from '@/constants/designSystem';

interface CopilotErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function CopilotErrorState({ title = 'Something went wrong', message, onRetry }: CopilotErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: 'center' },
  title: { ...designSystem.typography.textStyles.h3, marginBottom: 8 },
  message: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: designSystem.colors.brand.primary,
    borderRadius: 8,
  },
  buttonText: { ...designSystem.typography.textStyles.button, color: '#fff' },
});
