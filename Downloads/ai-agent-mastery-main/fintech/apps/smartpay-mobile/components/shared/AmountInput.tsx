/**
 * AmountInput – Numeric keypad for money entry
 * Figma spec: Large amount display (32-40px), 3×4 keypad grid
 * Keypad: 72×72px keys, 24px font, layout: 1-9, blank/0/backspace
 * Location: mobile/components/shared/AmountInput.tsx
 * 
 * USAGE:
 * ```tsx
 * <AmountInput
 *   amount="100.00"
 *   onAmountChange={(value) => setAmount(value)}
 *   maxAmount={1000}
 * />
 * ```
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { designSystem as DS } from '@/constants/designSystem';

export interface AmountInputProps {
  amount: string;
  onAmountChange: (amount: string) => void;
  maxAmount?: number;
  currency?: string;
}

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'backspace'],
];

export function AmountInput({
  amount,
  onAmountChange,
  maxAmount,
  currency = 'N$',
}: AmountInputProps) {
  const handleKeyPress = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (key === 'backspace') {
      if (amount.length > 0) {
        onAmountChange(amount.slice(0, -1));
      }
      return;
    }

    if (key === '') return;

    const newAmount = amount + key;
    const numericValue = parseFloat(newAmount) / 100;

    if (maxAmount && numericValue > maxAmount) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    onAmountChange(newAmount);
  };

  const formatDisplayAmount = () => {
    if (amount === '') return '0.00';
    const numericValue = parseFloat(amount) / 100;
    return numericValue.toFixed(2);
  };

  const isMaxReached = maxAmount && parseFloat(amount) / 100 >= maxAmount;

  return (
    <View style={styles.container}>
      <View style={styles.displayContainer}>
        <Text style={styles.currency}>{currency}</Text>
        <Text style={styles.amount}>{formatDisplayAmount()}</Text>
      </View>

      {maxAmount && (
        <Text style={[styles.maxAmount, isMaxReached && styles.maxAmountWarning]}>
          Max: {currency} {maxAmount.toFixed(2)}
        </Text>
      )}

      <View style={styles.keypad}>
        {KEYS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key, keyIndex) => (
              <TouchableOpacity
                key={keyIndex}
                style={[
                  styles.key,
                  key === '' && styles.keyEmpty,
                ]}
                onPress={() => handleKeyPress(key)}
                activeOpacity={0.7}
                disabled={key === ''}
                accessibilityLabel={key === 'backspace' ? 'Delete' : key}
                accessibilityRole="button"
              >
                {key === 'backspace' ? (
                  <Ionicons name="backspace-outline" size={28} color={DS.colors.text} />
                ) : key !== '' ? (
                  <Text style={styles.keyText}>{key}</Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: DS.spacing.lg,
  },
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: DS.spacing.sm,
    minHeight: 60,
  },
  currency: {
    fontSize: 24,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.textSecondary,
    marginRight: DS.spacing.sm,
  },
  amount: {
    fontSize: 40,
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.text,
    letterSpacing: -1,
  },
  maxAmount: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
    marginBottom: DS.spacing.md,
  },
  maxAmountWarning: {
    color: DS.colors.warning,
  },
  keypad: {
    gap: 12,
    marginTop: DS.spacing.md,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 12,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  keyEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  keyText: {
    fontSize: 24,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
  },
});
