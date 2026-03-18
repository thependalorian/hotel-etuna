/**
 * BankBalanceCard – Smartpay Agentic Copilot OBS Integration.
 * Displays account balances retrieved from OBS AIS.
 * Location: fintech/smartpay/components/copilot/cards/BankBalanceCard.tsx
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseCard, type BaseCardAction } from './BaseCard';
import { designSystem } from '@/constants/designSystem';

const ds = designSystem;

export interface AccountBalance {
  /** Account ID */
  accountId: string;
  /** Account name/nickname */
  accountName: string;
  /** Account type (Current, Savings) */
  accountType: string;
  /** Current balance */
  balance: number;
  /** Available balance (may differ due to pending transactions) */
  availableBalance: number;
  /** Currency code (NAD) */
  currency: string;
  /** Last updated timestamp */
  asOfDateTime?: string;
}

export interface BankBalanceCardProps {
  /** Array of account balances to display */
  balances: AccountBalance[];
  /** Data Provider name */
  institutionName?: string;
  /** Callback to refresh balances */
  onRefresh?: () => void;
  /** Callback to view transactions for an account */
  onViewTransactions?: (accountId: string) => void;
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
 * Format ISO date to readable format.
 */
function formatDateTime(isoString?: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('en-NA', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * BankBalanceCard component - Displays bank account balances from OBS AIS.
 * Shows current and available balances with refresh capability.
 * 
 * @example
 * ```tsx
 * <BankBalanceCard 
 *   balances={accountBalances}
 *   institutionName="FNB Namibia"
 *   onRefresh={() => refreshBalances()}
 *   onViewTransactions={(accId) => showTransactions(accId)}
 * />
 * ```
 */
export function BankBalanceCard({
  balances,
  institutionName = 'Bank',
  onRefresh,
  onViewTransactions,
  testID = 'bank-balance-card',
}: BankBalanceCardProps) {
  const actions: BaseCardAction[] = [];

  if (onRefresh) {
    actions.push({
      id: 'refresh',
      label: 'Refresh',
      onPress: onRefresh,
      variant: 'secondary',
    });
  }

  // Calculate total balance across all accounts
  const totalBalance = balances.reduce((sum, acc) => sum + acc.balance, 0);
  const totalAvailable = balances.reduce((sum, acc) => sum + acc.availableBalance, 0);

  return (
    <BaseCard
      title="Bank Account Balances"
      subtitle={`${institutionName} - ${balances.length} account${balances.length === 1 ? '' : 's'}`}
      actions={actions}
      variant="success"
      testID={testID}
    >
      {/* Total Summary */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total Balance</Text>
        <Text style={styles.totalAmount}>{formatNAD(totalBalance)}</Text>
        {totalBalance !== totalAvailable && (
          <Text style={styles.availableAmount}>
            Available: {formatNAD(totalAvailable)}
          </Text>
        )}
      </View>

      {/* Individual Account Balances */}
      <View style={styles.accountsContainer}>
        {balances.map((account, index) => (
          <View 
            key={account.accountId} 
            style={[
              styles.accountRow,
              index < balances.length - 1 && styles.accountRowBorder
            ]}
          >
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{account.accountName}</Text>
              <Text style={styles.accountType}>{account.accountType}</Text>
              {account.asOfDateTime && (
                <Text style={styles.timestamp}>
                  Updated: {formatDateTime(account.asOfDateTime)}
                </Text>
              )}
            </View>
            
            <View style={styles.balanceInfo}>
              <Text style={styles.balance}>{formatNAD(account.balance)}</Text>
              {account.balance !== account.availableBalance && (
                <Text style={styles.availableLabel}>
                  Avail: {formatNAD(account.availableBalance)}
                </Text>
              )}
              {onViewTransactions && (
                <Text 
                  style={styles.actionLink}
                  onPress={() => onViewTransactions(account.accountId)}
                >
                  View Transactions
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.obsNotice}>
        <Text style={styles.obsNoticeText}>
          💡 Balances are fetched in real-time from {institutionName} via OBS AIS.
        </Text>
      </View>
    </BaseCard>
  );
}

const styles = StyleSheet.create({
  totalContainer: {
    paddingVertical: ds.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: ds.colors.neutral.border,
    marginBottom: ds.spacing.sm,
  },
  totalLabel: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.textSecondary,
    marginBottom: 4,
  },
  totalAmount: {
    ...ds.typography.textStyles.largeTitle,
    color: ds.colors.brand.primary,
    fontWeight: '700',
  },
  availableAmount: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.textSecondary,
    marginTop: 4,
  },
  accountsContainer: {
    marginVertical: ds.spacing.sm,
  },
  accountRow: {
    paddingVertical: ds.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  accountRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral.border,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  accountType: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.textSecondary,
    marginBottom: 2,
  },
  timestamp: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textTertiary,
    fontSize: 12,
  },
  balanceInfo: {
    alignItems: 'flex-end',
  },
  balance: {
    ...ds.typography.textStyles.h3,
    color: ds.colors.semantic.success,
    fontWeight: '700',
    marginBottom: 2,
  },
  availableLabel: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
    marginBottom: 4,
  },
  actionLink: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.brand.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  obsNotice: {
    marginTop: ds.spacing.sm,
    padding: ds.spacing.sm,
    backgroundColor: ds.colors.neutral.muted,
    borderRadius: ds.radius.sm,
  },
  obsNoticeText: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
  },
});
