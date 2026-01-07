/**
 * BudgetProgressBar Component
 * 
 * Location: components/transactions/BudgetProgressBar.tsx
 * Purpose: Display budget progress with percentage and amount
 * 
 * Shows budget progress with visual progress bar
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

interface BudgetProgressBarProps {
  percentage?: number;
  amount?: number;
  label?: string;
  tabType?: 'balance' | 'earnings' | 'spendings';
}

export default function BudgetProgressBar({
  percentage = 25,
  amount = 75,
  label,
  tabType = 'balance',
}: BudgetProgressBarProps) {
  const displayLabel =
    label ||
    (tabType === 'earnings'
      ? 'Earnings target'
      : tabType === 'spendings'
      ? 'Budget reached'
      : 'Budget reached');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.percentageText}>{percentage}% {displayLabel}</Text>
        <Text style={styles.amountText}>N$ {amount}</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${percentage}%` },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.text,
    borderRadius: 4,
  },
});
