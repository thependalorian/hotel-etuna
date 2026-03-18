/**
 * BalanceCard - Smartpay Home Screen
 * 
 * Figma Specs:
 * - Height: 120px
 * - Border Radius: 12px
 * - Padding: 24px
 * - Shadow: md
 * - Background: White
 * 
 * Features:
 * - Total balance display
 * - Eye toggle for visibility
 * - Wallet name
 * - Shadow elevation
 * 
 * @see Figma Node: BalanceCard Organism
 * @location components/home/BalanceCard.tsx
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { designSystem as DS } from '@/constants/designSystem';

export interface BalanceCardProps {
  /** Total balance in NAD */
  balance: number;
  /** Whether balance is currently visible */
  balanceVisible: boolean;
  /** Callback when eye icon is pressed */
  onToggleVisibility: () => void;
  /** Name of the primary wallet */
  walletName: string;
}

/**
 * BalanceCard component - displays total balance with privacy toggle
 * 
 * Figma: 120px height, 12px radius, 24px padding
 */
export function BalanceCard({
  balance,
  balanceVisible,
  onToggleVisibility,
  walletName,
}: BalanceCardProps) {
  return (
    <View style={styles.card} accessibilityLabel={`Total balance ${balanceVisible ? `N$${balance.toFixed(2)}` : 'hidden'}`}>
      {/* Header row with label and eye toggle */}
      <View style={styles.header}>
        <Text style={styles.label}>Total Balance</Text>
        <TouchableOpacity
          onPress={onToggleVisibility}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={balanceVisible ? 'Hide balance' : 'Show balance'}
          accessibilityRole="button"
        >
          <Ionicons
            name={balanceVisible ? 'eye-outline' : 'eye-off-outline'}
            size={24}
            color={DS.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Balance amount or hidden state */}
      <View style={styles.amountContainer}>
        {balanceVisible ? (
          <Text style={styles.amount}>
            N${balance.toLocaleString('en-NA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        ) : (
          <Text style={styles.amountHidden}>••••••</Text>
        )}
      </View>

      {/* Wallet name */}
      <Text style={styles.walletName}>{walletName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 120,
    backgroundColor: DS.colors.background,
    borderRadius: 12,
    padding: 24,
    marginHorizontal: DS.spacing.horizontalPadding,
    marginBottom: DS.spacing.lg,
    ...DS.shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '400',
    color: DS.colors.textSecondary,
  },
  amountContainer: {
    marginBottom: 4,
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    color: DS.colors.text,
    lineHeight: 40,
  },
  amountHidden: {
    fontSize: 32,
    fontWeight: '700',
    color: DS.colors.text,
    lineHeight: 40,
    letterSpacing: 8,
  },
  walletName: {
    fontSize: 14,
    fontWeight: '400',
    color: DS.colors.textSecondary,
  },
});
