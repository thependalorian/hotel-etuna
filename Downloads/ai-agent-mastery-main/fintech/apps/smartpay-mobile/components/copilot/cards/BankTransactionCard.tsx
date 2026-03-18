/**
 * BankTransactionCard – Smartpay Agentic Copilot OBS Integration.
 * Displays transaction history from linked bank accounts via OBS AIS.
 * Location: fintech/smartpay/components/copilot/cards/BankTransactionCard.tsx
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BaseCard, type BaseCardAction } from './BaseCard';
import { designSystem } from '@/constants/designSystem';

const ds = designSystem;

export interface BankTransaction {
  /** Transaction ID */
  transactionId: string;
  /** Transaction date/time */
  bookingDateTime: string;
  /** Transaction amount */
  amount: number;
  /** Currency code (NAD) */
  currency: string;
  /** Credit or Debit */
  creditDebitIndicator: 'Credit' | 'Debit';
  /** Transaction status (Booked, Pending) */
  status: string;
  /** Merchant/counterparty name */
  merchantName?: string;
  /** Transaction description */
  transactionInformation?: string;
  /** Balance after transaction */
  balanceAfterTransaction?: number;
}

export interface BankTransactionCardProps {
  /** Array of transactions to display */
  transactions: BankTransaction[];
  /** Account name */
  accountName: string;
  /** Account ID */
  accountId: string;
  /** Date range for transactions */
  dateRange?: { from?: string; to?: string };
  /** Callback to load more transactions */
  onLoadMore?: () => void;
  /** Callback to export transactions */
  onExport?: () => void;
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * Format currency amount to Namibian Dollar format.
 */
function formatNAD(amount: number): string {
  return `N$${Math.abs(amount).toLocaleString('en-NA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format ISO date to readable format.
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-NA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format time from ISO string.
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-NA', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * BankTransactionCard component - Displays bank transaction history from OBS AIS.
 * Shows credit/debit transactions with merchant details and balances.
 * 
 * @example
 * ```tsx
 * <BankTransactionCard 
 *   transactions={bankTransactions}
 *   accountName="FNB Current Account"
 *   accountId="ACC-FNB-001"
 *   dateRange={{ from: '2024-01-01', to: '2024-03-16' }}
 *   onLoadMore={() => loadMoreTransactions()}
 * />
 * ```
 */
export function BankTransactionCard({
  transactions,
  accountName,
  accountId,
  dateRange,
  onLoadMore,
  onExport,
  testID = 'bank-transaction-card',
}: BankTransactionCardProps) {
  const actions: BaseCardAction[] = [];

  if (onExport) {
    actions.push({
      id: 'export',
      label: 'Export',
      onPress: onExport,
      variant: 'secondary',
    });
  }

  if (onLoadMore) {
    actions.push({
      id: 'load-more',
      label: 'Load More',
      onPress: onLoadMore,
      variant: 'secondary',
    });
  }

  const subtitle = dateRange?.from && dateRange?.to
    ? `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`
    : `${transactions.length} transaction${transactions.length === 1 ? '' : 's'}`;

  return (
    <BaseCard
      title={accountName}
      subtitle={subtitle}
      actions={actions}
      testID={testID}
    >
      <ScrollView style={styles.transactionsContainer} nestedScrollEnabled>
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions found for this period</Text>
          </View>
        ) : (
          transactions.map((txn, index) => (
            <View 
              key={txn.transactionId} 
              style={[
                styles.transactionRow,
                index < transactions.length - 1 && styles.transactionRowBorder
              ]}
            >
              <View style={styles.transactionLeft}>
                <View style={styles.dateTimeContainer}>
                  <Text style={styles.transactionDate}>
                    {formatDate(txn.bookingDateTime)}
                  </Text>
                  <Text style={styles.transactionTime}>
                    {formatTime(txn.bookingDateTime)}
                  </Text>
                </View>
                
                <View style={styles.transactionDetails}>
                  <Text style={styles.merchantName}>
                    {txn.merchantName || 'Transaction'}
                  </Text>
                  {txn.transactionInformation && (
                    <Text style={styles.transactionInfo}>
                      {txn.transactionInformation}
                    </Text>
                  )}
                  <Text style={styles.transactionStatus}>
                    {txn.status}
                  </Text>
                </View>
              </View>
              
              <View style={styles.transactionRight}>
                <Text 
                  style={[
                    styles.transactionAmount,
                    txn.creditDebitIndicator === 'Credit' 
                      ? styles.creditAmount 
                      : styles.debitAmount
                  ]}
                >
                  {txn.creditDebitIndicator === 'Credit' ? '+' : '-'}
                  {formatNAD(txn.amount)}
                </Text>
                {txn.balanceAfterTransaction != null && (
                  <Text style={styles.balanceAfter}>
                    Bal: {formatNAD(txn.balanceAfterTransaction)}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.obsNotice}>
        <Text style={styles.obsNoticeText}>
          📊 Transaction history fetched via OBS AIS from your bank.
        </Text>
      </View>
    </BaseCard>
  );
}

const styles = StyleSheet.create({
  transactionsContainer: {
    maxHeight: 400,
    marginVertical: ds.spacing.sm,
  },
  emptyState: {
    paddingVertical: ds.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.textSecondary,
  },
  transactionRow: {
    paddingVertical: ds.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral.border,
  },
  transactionLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: ds.spacing.sm,
  },
  dateTimeContainer: {
    minWidth: 60,
  },
  transactionDate: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.text,
    fontWeight: '600',
  },
  transactionTime: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textTertiary,
    fontSize: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  merchantName: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionInfo: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.textSecondary,
    marginBottom: 2,
  },
  transactionStatus: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textTertiary,
    fontSize: 12,
  },
  transactionRight: {
    alignItems: 'flex-end',
    marginLeft: ds.spacing.sm,
  },
  transactionAmount: {
    ...ds.typography.textStyles.body,
    fontWeight: '700',
    marginBottom: 2,
  },
  creditAmount: {
    color: ds.colors.semantic.success,
  },
  debitAmount: {
    color: ds.colors.semantic.error,
  },
  balanceAfter: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
    fontSize: 12,
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
