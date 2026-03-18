/**
 * GroupTransactionCard – Group Wallet Transaction Card
 * Handles group contributions and withdrawals.
 * Location: fintech/smartpay/components/copilot/cards/GroupTransactionCard.tsx
 * 
 * Supports:
 * - Contributing to group wallet
 * - Withdrawing from group wallet (if authorized)
 * - Viewing group balance and members
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BaseCard, type BaseCardAction } from './BaseCard';
import { designSystem } from '@/constants/designSystem';

const ds = designSystem;

export type GroupTransactionType = 'contribute' | 'withdraw';

export interface GroupDetails {
  id: string;
  name: string;
  balance: number;
  memberCount: number;
  userRole: 'admin' | 'member';
  contributionRules?: {
    minAmount?: number;
    maxAmount?: number;
    frequency?: string;
  };
}

export interface GroupTransactionCardProps {
  group: GroupDetails;
  transactionType: GroupTransactionType;
  amount: number;
  sourceWallet?: { id: string; name: string; balance: number };
  destinationWallet?: { id: string; name: string };
  note?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
  testID?: string;
}

function formatNAD(amount: number): string {
  return `N$${amount.toLocaleString('en-NA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function GroupTransactionCard({
  group,
  transactionType,
  amount,
  sourceWallet,
  destinationWallet,
  note,
  onConfirm,
  onCancel,
  isProcessing = false,
  testID = 'group-transaction-card',
}: GroupTransactionCardProps) {
  const isContribution = transactionType === 'contribute';
  const rules = group.contributionRules;

  // Validation warnings
  const warnings: string[] = [];
  
  if (isContribution) {
    if (!sourceWallet) {
      warnings.push('Source wallet not specified');
    } else if (amount > sourceWallet.balance) {
      warnings.push('Insufficient balance in source wallet');
    }
    if (rules?.minAmount && amount < rules.minAmount) {
      warnings.push(`Minimum contribution: ${formatNAD(rules.minAmount)}`);
    }
    if (rules?.maxAmount && amount > rules.maxAmount) {
      warnings.push(`Maximum contribution: ${formatNAD(rules.maxAmount)}`);
    }
  } else {
    // Withdrawal
    if (amount > group.balance) {
      warnings.push('Insufficient group balance');
    }
    if (group.userRole !== 'admin') {
      warnings.push('Only group admins can withdraw funds');
    }
    if (!destinationWallet) {
      warnings.push('Destination wallet not specified');
    }
  }

  if (amount <= 0) {
    warnings.push('Amount must be greater than zero');
  }

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
      label: isProcessing ? 'Processing...' : isContribution ? 'Contribute' : 'Withdraw',
      onPress: onConfirm,
      variant: 'primary',
      disabled: isProcessing || warnings.length > 0,
    },
  ];

  return (
    <BaseCard
      title={isContribution ? 'Group Contribution' : 'Group Withdrawal'}
      subtitle={group.name}
      variant={warnings.length > 0 ? 'error' : 'info'}
      icon="people"
      actions={actions}
      testID={testID}
    >
      {/* Group Info */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Group Details</Text>
        <View style={styles.groupCard}>
          <View style={styles.groupHeader}>
            <View style={styles.groupIcon}>
              <Ionicons name="people" size={24} color={ds.colors.brand.primary} />
            </View>
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupMeta}>{group.memberCount} members</Text>
              <Text style={styles.groupRole}>
                Your role: {group.userRole === 'admin' ? 'Administrator' : 'Member'}
              </Text>
            </View>
          </View>
          
          <View style={styles.groupBalanceRow}>
            <Text style={styles.groupBalanceLabel}>Group Balance</Text>
            <Text style={styles.groupBalanceValue}>{formatNAD(group.balance)}</Text>
          </View>
        </View>
      </View>

      {/* Transaction Details */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Transaction Details</Text>
        
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>{formatNAD(amount)}</Text>
          </View>
          
          {isContribution && sourceWallet && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>From</Text>
                <Text style={styles.detailValue}>{sourceWallet.name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Available Balance</Text>
                <Text style={styles.detailValue}>{formatNAD(sourceWallet.balance)}</Text>
              </View>
            </>
          )}
          
          {!isContribution && destinationWallet && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>To</Text>
              <Text style={styles.detailValue}>{destinationWallet.name}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Balance Changes */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Balance Changes</Text>
        <View style={styles.balanceChangesCard}>
          {isContribution ? (
            <>
              <View style={styles.balanceChangeRow}>
                <Text style={styles.balanceChangeLabel}>Your Wallet After</Text>
                <Text style={[styles.balanceChangeValue, styles.balanceDecrease]}>
                  {sourceWallet ? formatNAD(sourceWallet.balance - amount) : 'N/A'}
                </Text>
              </View>
              <View style={styles.balanceChangeRow}>
                <Text style={styles.balanceChangeLabel}>Group Wallet After</Text>
                <Text style={[styles.balanceChangeValue, styles.balanceIncrease]}>
                  {formatNAD(group.balance + amount)}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.balanceChangeRow}>
                <Text style={styles.balanceChangeLabel}>Group Wallet After</Text>
                <Text style={[styles.balanceChangeValue, styles.balanceDecrease]}>
                  {formatNAD(group.balance - amount)}
                </Text>
              </View>
              <View style={styles.balanceChangeRow}>
                <Text style={styles.balanceChangeLabel}>Your Wallet After</Text>
                <Text style={[styles.balanceChangeValue, styles.balanceIncrease]}>
                  {destinationWallet ? formatNAD(amount) : 'N/A'}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Note */}
      {note && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Note</Text>
          <Text style={styles.noteText}>{note}</Text>
        </View>
      )}

      {/* Contribution Rules */}
      {isContribution && rules && (rules.minAmount || rules.maxAmount || rules.frequency) && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={ds.colors.semantic.info} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Contribution Rules:</Text>
            {rules.minAmount && (
              <Text style={styles.infoText}>• Minimum: {formatNAD(rules.minAmount)}</Text>
            )}
            {rules.maxAmount && (
              <Text style={styles.infoText}>• Maximum: {formatNAD(rules.maxAmount)}</Text>
            )}
            {rules.frequency && (
              <Text style={styles.infoText}>• Frequency: {rules.frequency}</Text>
            )}
          </View>
        </View>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <View style={styles.warningBox}>
          <Ionicons name="warning" size={20} color={ds.colors.feedback.amber} />
          <View style={styles.warningTextContainer}>
            {warnings.map((warning, index) => (
              <Text key={index} style={styles.warningText}>
                • {warning}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Ionicons name="lock-closed" size={16} color={ds.colors.neutral.textSecondary} />
        <Text style={styles.securityNoticeText}>
          Group transactions are visible to all members for transparency
        </Text>
      </View>
    </BaseCard>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: ds.spacing.md,
  },
  sectionLabel: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
    textTransform: 'uppercase',
    marginBottom: ds.spacing.xs,
    fontWeight: '600',
  },
  groupCard: {
    backgroundColor: ds.colors.neutral.backgroundAlt,
    padding: ds.spacing.md,
    borderRadius: ds.radius.md,
    borderWidth: 1,
    borderColor: ds.colors.neutral.border,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: ds.spacing.md,
    gap: ds.spacing.sm,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.brand.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  groupMeta: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
  },
  groupRole: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.brand.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  groupBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: ds.spacing.md,
    borderTopWidth: 1,
    borderTopColor: ds.colors.neutral.border,
  },
  groupBalanceLabel: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.textSecondary,
  },
  groupBalanceValue: {
    ...ds.typography.textStyles.h3,
    color: ds.colors.brand.primary,
    fontWeight: '700',
  },
  detailsCard: {
    backgroundColor: ds.colors.neutral.backgroundAlt,
    padding: ds.spacing.md,
    borderRadius: ds.radius.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: ds.spacing.xs,
  },
  detailLabel: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.textSecondary,
  },
  detailValue: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    fontWeight: '600',
  },
  balanceChangesCard: {
    backgroundColor: ds.colors.neutral.backgroundAlt,
    padding: ds.spacing.md,
    borderRadius: ds.radius.sm,
  },
  balanceChangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ds.spacing.xs,
  },
  balanceChangeLabel: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.textSecondary,
  },
  balanceChangeValue: {
    ...ds.typography.textStyles.body,
    fontWeight: '700',
  },
  balanceIncrease: {
    color: ds.colors.feedback.green,
  },
  balanceDecrease: {
    color: ds.colors.feedback.red,
  },
  noteText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    fontStyle: 'italic',
    backgroundColor: ds.colors.neutral.backgroundAlt,
    padding: ds.spacing.sm,
    borderRadius: ds.radius.sm,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: ds.colors.feedback.blue100,
    padding: ds.spacing.sm,
    borderRadius: ds.radius.sm,
    marginBottom: ds.spacing.md,
    gap: ds.spacing.xs,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.text,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: ds.colors.feedback.amber100,
    padding: ds.spacing.sm,
    borderRadius: ds.radius.sm,
    marginBottom: ds.spacing.md,
    gap: ds.spacing.xs,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningText: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.feedback.amber,
    marginBottom: 2,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: ds.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: ds.colors.neutral.border,
    gap: ds.spacing.xs,
  },
  securityNoticeText: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
    textAlign: 'center',
  },
});
