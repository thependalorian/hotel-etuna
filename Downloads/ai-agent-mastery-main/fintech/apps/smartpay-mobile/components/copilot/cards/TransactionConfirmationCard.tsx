/**
 * TransactionConfirmationCard – Smartpay Agentic Copilot.
 * Displays transaction details for user confirmation before execution.
 * Example implementation showing how to use BaseCard for transaction flows.
 * Location: fintech/smartpay/components/copilot/cards/TransactionConfirmationCard.tsx
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseCard, type BaseCardAction } from './BaseCard';
import { designSystem } from '@/constants/designSystem';

const ds = designSystem;

export interface TransactionDetails {
  /** Transaction type */
  type: 'send' | 'cashout' | 'voucher' | 'loan' | 'payment';
  /** Amount to be transacted */
  amount: number;
  /** Recipient name (for send/payment) */
  recipient?: string;
  /** Source wallet name */
  sourceWallet: string;
  /** Transaction fee */
  fee?: number;
  /** Total amount (amount + fee) */
  total: number;
  /** Additional reference or note */
  reference?: string;
}

export interface TransactionConfirmationCardProps {
  /** Transaction details to confirm */
  transaction: TransactionDetails;
  /** Callback when user confirms the transaction */
  onConfirm: () => void;
  /** Callback when user cancels the transaction */
  onCancel: () => void;
  /** Whether the transaction is currently processing */
  isProcessing?: boolean;
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
 * Get human-readable transaction type label.
 */
function getTransactionTypeLabel(type: TransactionDetails['type']): string {
  const labels = {
    send: 'Send Money',
    cashout: 'Cash Out',
    voucher: 'Redeem Voucher',
    loan: 'Loan Application',
    payment: 'Payment',
  };
  return labels[type];
}

/**
 * TransactionConfirmationCard component - Displays transaction details for confirmation.
 * Uses BaseCard with warning variant to emphasize the importance of review.
 * 
 * @example
 * ```tsx
 * <TransactionConfirmationCard 
 *   transaction={{
 *     type: 'send',
 *     amount: 500,
 *     recipient: 'Anna Smith',
 *     sourceWallet: 'Main Wallet',
 *     fee: 2.50,
 *     total: 502.50,
 *     reference: 'Lunch money'
 *   }}
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export function TransactionConfirmationCard({
  transaction,
  onConfirm,
  onCancel,
  isProcessing = false,
  testID = 'transaction-confirmation-card',
}: TransactionConfirmationCardProps) {
  const actions: BaseCardAction[] = [
    {
      id: 'cancel',
      label: 'Cancel',
      onPress: onCancel,
      variant: 'secondary',
      disabled: isProcessing,
    },
    {
      id: 'confirm',
      label: isProcessing ? 'Processing...' : 'Confirm',
      onPress: onConfirm,
      variant: 'primary',
      disabled: isProcessing,
    },
  ];

  return (
    <BaseCard
      title="Confirm Transaction"
      subtitle={getTransactionTypeLabel(transaction.type)}
      variant="warning"
      actions={actions}
      testID={testID}
    >
      <View style={styles.detailsContainer}>
        {transaction.recipient && (
          <View style={styles.row}>
            <Text style={styles.label}>To</Text>
            <Text style={styles.value}>{transaction.recipient}</Text>
          </View>
        )}

        <View style={styles.row}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.value}>{formatNAD(transaction.amount)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>From</Text>
          <Text style={styles.value}>{transaction.sourceWallet}</Text>
        </View>

        {transaction.fee !== undefined && transaction.fee > 0 && (
          <View style={styles.row}>
            <Text style={styles.label}>Fee</Text>
            <Text style={styles.value}>{formatNAD(transaction.fee)}</Text>
          </View>
        )}

        {transaction.reference && (
          <View style={styles.row}>
            <Text style={styles.label}>Reference</Text>
            <Text style={styles.value}>{transaction.reference}</Text>
          </View>
        )}

        <View style={[styles.row, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatNAD(transaction.total)}</Text>
        </View>
      </View>

      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          Please review the details carefully. This action cannot be undone.
        </Text>
      </View>
    </BaseCard>
  );
}

const styles = StyleSheet.create({
  detailsContainer: {
    paddingVertical: ds.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: ds.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral.border,
  },
  label: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.textSecondary,
  },
  value: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    fontWeight: '600',
  },
  totalRow: {
    marginTop: ds.spacing.sm,
    paddingTop: ds.spacing.sm,
    borderTopWidth: 2,
    borderTopColor: ds.colors.neutral.border,
    borderBottomWidth: 0,
  },
  totalLabel: {
    ...ds.typography.textStyles.h3,
    color: ds.colors.neutral.text,
  },
  totalValue: {
    ...ds.typography.textStyles.h3,
    color: ds.colors.brand.primary,
    fontWeight: '700',
  },
  warningBox: {
    marginTop: ds.spacing.md,
    padding: ds.spacing.sm,
    backgroundColor: ds.colors.feedback.blue100,
    borderRadius: ds.radius.sm,
  },
  warningText: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.text,
    textAlign: 'center',
  },
});
