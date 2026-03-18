/**
 * WalletBalanceCard – Smartpay Agentic Copilot.
 * Displays wallet balance information using BaseCard.
 * Example implementation showing how to use BaseCard for wallet data display.
 * Location: fintech/smartpay/components/copilot/cards/WalletBalanceCard.tsx
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseCard, type BaseCardAction } from './BaseCard';
import { designSystem } from '@/constants/designSystem';
import type { Wallet } from '@/services/wallets';

const ds = designSystem;

export interface WalletBalanceCardProps {
  /** Wallet to display */
  wallet: Wallet;
  /** Optional callback when user wants to view full wallet details */
  onViewDetails?: (walletId: string) => void;
  /** Optional callback when user wants to send money from this wallet */
  onSendMoney?: (walletId: string) => void;
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * Format currency amount to Namibian Dollar format.
 */
function formatNAD(amount: number): string {
  return `N$${amount.toLocaleString('en-NA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * WalletBalanceCard component - Displays wallet balance with actions.
 * Uses BaseCard for consistent styling and behavior.
 * 
 * @example
 * ```tsx
 * <WalletBalanceCard 
 *   wallet={myWallet}
 *   onViewDetails={(id) => router.push(`/wallets/${id}`)}
 *   onSendMoney={(id) => router.push(`/send?from=${id}`)}
 * />
 * ```
 */
export function WalletBalanceCard({
  wallet,
  onViewDetails,
  onSendMoney,
  testID = 'wallet-balance-card',
}: WalletBalanceCardProps) {
  const actions: BaseCardAction[] = [];

  if (onSendMoney && wallet.status === 'active' && wallet.balance > 0) {
    actions.push({
      id: 'send',
      label: 'Send Money',
      onPress: () => onSendMoney(wallet.id),
      variant: 'primary',
    });
  }

  if (onViewDetails) {
    actions.push({
      id: 'details',
      label: 'View Details',
      onPress: () => onViewDetails(wallet.id),
      variant: 'secondary',
    });
  }

  const walletTypeLabel = {
    main: 'Main Wallet',
    grant: 'Grant Wallet',
    group: 'Group Wallet',
    other: 'Other Wallet',
  }[wallet.type];

  return (
    <BaseCard
      title={wallet.name}
      subtitle={walletTypeLabel}
      actions={actions}
      testID={testID}
    >
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>{formatNAD(wallet.balance)}</Text>
        {wallet.status === 'frozen' && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Frozen</Text>
          </View>
        )}
      </View>
    </BaseCard>
  );
}

const styles = StyleSheet.create({
  balanceContainer: {
    paddingVertical: ds.spacing.sm,
  },
  balanceLabel: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.textSecondary,
    marginBottom: 4,
  },
  balanceAmount: {
    ...ds.typography.textStyles.largeTitle,
    color: ds.colors.brand.primary,
    fontWeight: '700',
  },
  statusBadge: {
    marginTop: ds.spacing.sm,
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: 4,
    backgroundColor: ds.colors.semantic.warning,
    borderRadius: ds.radius.sm,
    alignSelf: 'flex-start',
  },
  statusText: {
    ...ds.typography.textStyles.caption,
    color: '#fff',
    fontWeight: '600',
  },
});
