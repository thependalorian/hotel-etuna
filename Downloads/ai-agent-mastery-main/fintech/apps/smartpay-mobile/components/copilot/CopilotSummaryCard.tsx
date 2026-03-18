/**
 * CopilotSummaryCard – Smartpay Agentic Copilot.
 * Reusable card for balance summary, recent activity, or loan offer.
 * Location: fintech/smartpay/components/copilot/CopilotSummaryCard.tsx
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { designSystem } from '@/constants/designSystem';

interface CopilotSummaryCardProps {
  title: string;
  items: Array<{ label: string; value: string }>;
}

export function CopilotSummaryCard({ title, items }: CopilotSummaryCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {items.map((item, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.value}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: designSystem.colors.neutral.surface,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: { ...designSystem.typography.textStyles.h3, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { ...designSystem.typography.textStyles.body, color: designSystem.colors.neutral.textSecondary },
  value: { ...designSystem.typography.textStyles.body, color: designSystem.colors.neutral.text },
});
