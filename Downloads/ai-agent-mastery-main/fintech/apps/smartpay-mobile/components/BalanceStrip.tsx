/**
 * BalanceStrip – Smartpay.
 * Compact one-line balance summary for Home and Copilot header.
 * Fetches wallets when mounted; shows total or placeholder.
 * Location: fintech/smartpay/components/BalanceStrip.tsx
 */
import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { getWallets, type Wallet } from '@/services/wallets';
import { designSystem } from '@/constants/designSystem';

function formatBalance(amount: number): string {
  return `N$${amount.toLocaleString('en-NA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function BalanceStrip() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getWallets()
      .then((list) => {
        if (!cancelled) setWallets(list);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const total = wallets.reduce((sum, w) => sum + (w.balance ?? 0), 0);
  const hasData = wallets.length > 0 && !loading;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Balance</Text>
      {loading ? (
        <Text style={styles.value}>—</Text>
      ) : hasData ? (
        <Text style={styles.value}>{formatBalance(total)}</Text>
      ) : (
        <Text style={styles.placeholder}>Connect your bank to see balance</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  label: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.neutral.textSecondary,
  },
  value: {
    ...designSystem.typography.textStyles.h3,
    color: designSystem.colors.neutral.text,
  },
  placeholder: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.neutral.textSecondary,
    fontStyle: 'italic',
  },
});
