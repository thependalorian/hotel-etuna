/**
 * BalanceDisplay Component
 * 
 * Location: components/BalanceDisplay.tsx
 * Purpose: Reusable balance display with show/hide toggle and add funds button
 * 
 * Displays account balance with visibility toggle and add funds action
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

interface BalanceDisplayProps {
  balance: number | string;
  currency?: string;
  showBalance?: boolean;
  onShowToggle?: () => void;
  onAddFunds?: () => void;
}

export default function BalanceDisplay({
  balance,
  currency = 'N$',
  showBalance: initialShowBalance = false,
  onShowToggle,
  onAddFunds,
}: BalanceDisplayProps) {
  const [balanceVisible, setBalanceVisible] = useState(initialShowBalance);

  // Sync with prop changes
  useEffect(() => {
    setBalanceVisible(initialShowBalance);
  }, [initialShowBalance]);

  const handleToggle = () => {
    const newVisibility = !balanceVisible;
    setBalanceVisible(newVisibility);
    onShowToggle?.();
  };

  const displayBalance = balanceVisible 
    ? (typeof balance === 'number' ? balance.toLocaleString() : balance)
    : 'XXX';

  return (
    <View style={styles.container}>
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceAmount}>
          {currency} {displayBalance}
        </Text>
        <Text style={styles.balanceLabel}>Total Balance</Text>
      </View>

      <View style={styles.balanceActions}>
        <TouchableOpacity
          style={styles.balanceActionButton}
          onPress={handleToggle}
          activeOpacity={0.7}
        >
          <Text style={styles.balanceActionText}>
            {balanceVisible ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.balanceActionButton, styles.addFundsButton]}
          onPress={onAddFunds}
          activeOpacity={0.7}
        >
          <Text style={[styles.balanceActionText, styles.addFundsText]}>
            + Add
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  balanceContainer: {
    marginBottom: 20,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  balanceActionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25, // Pill-shaped
    backgroundColor: Colors.backgroundGray,
    minWidth: 80,
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
  },
  balanceActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  addFundsButton: {
    backgroundColor: Colors.primary,
  },
  addFundsText: {
    color: Colors.white,
  },
});
