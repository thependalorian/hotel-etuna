/**
 * CopilotConfirmationCard – Smartpay Agentic Copilot.
 * Pre-payment/cash-out confirmation with Confirm / Cancel.
 * Location: fintech/smartpay/components/copilot/CopilotConfirmationCard.tsx
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { designSystem } from '@/constants/designSystem';

interface CopilotConfirmationCardProps {
  title: string;
  rows: Array<{ label: string; value: string }>;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function CopilotConfirmationCard({
  title,
  rows,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
}: CopilotConfirmationCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {rows.map((row, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>{cancelLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
          <Text style={styles.confirmText}>{confirmLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: designSystem.colors.neutral.surface,
    margin: 16,
  },
  title: { ...designSystem.typography.textStyles.h3, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { ...designSystem.typography.textStyles.body, color: designSystem.colors.neutral.textSecondary },
  value: { ...designSystem.typography.textStyles.body, color: designSystem.colors.neutral.text },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  cancelButton: { paddingHorizontal: 16, paddingVertical: 10 },
  confirmButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: designSystem.colors.brand.primary,
    borderRadius: 8,
  },
  cancelText: { ...designSystem.typography.textStyles.button, color: designSystem.colors.neutral.text },
  confirmText: { ...designSystem.typography.textStyles.button, color: '#fff' },
});
