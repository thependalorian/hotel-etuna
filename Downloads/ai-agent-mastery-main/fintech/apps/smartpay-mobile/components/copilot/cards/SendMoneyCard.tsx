/**
 * SendMoneyCard – P2P Transfer Confirmation Card
 * Displays send money transaction details for user confirmation before 2FA.
 * Location: fintech/smartpay/components/copilot/cards/SendMoneyCard.tsx
 * 
 * USAGE:
 * ```tsx
 * <SendMoneyCard
 *   fromWallet={{ id: '1', name: 'Main Wallet', balance: 1000 }}
 *   toBeneficiary={{ id: '2', name: 'Anna Smith', phone: '+264811234567' }}
 *   amount={500}
 *   note="Lunch money"
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 * />
 * ```
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BaseCard, type BaseCardAction } from './BaseCard';
import { designSystem } from '@/constants/designSystem';

const ds = designSystem;

export interface Wallet {
  id: string;
  name: string;
  balance: number;
}

export interface Beneficiary {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
}

export interface SendMoneyCardProps {
  fromWallet: Wallet;
  toBeneficiary?: Beneficiary;
  toGroup?: { id: string; name: string };
  amount: number;
  note?: string;
  fee?: number;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
  testID?: string;
}

function formatNAD(amount: number): string {
  return `N$${amount.toLocaleString('en-NA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function SendMoneyCard({
  fromWallet,
  toBeneficiary,
  toGroup,
  amount,
  note,
  fee = 0,
  onConfirm,
  onCancel,
  isProcessing = false,
  testID = 'send-money-card',
}: SendMoneyCardProps) {
  const total = amount + fee;
  const recipient = toBeneficiary ? toBeneficiary.name : toGroup?.name || 'Unknown';
  const recipientType = toBeneficiary ? 'Person' : 'Group';

  // Validation warnings
  const warnings: string[] = [];
  if (total > fromWallet.balance) {
    warnings.push('Insufficient balance in wallet');
  }
  if (amount <= 0) {
    warnings.push('Amount must be greater than zero');
  }
  if (amount > 5000) {
    warnings.push('Daily limit: N$5,000 per transaction');
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
      label: isProcessing ? 'Processing...' : 'Confirm & Pay',
      onPress: onConfirm,
      variant: 'primary',
      disabled: isProcessing || warnings.length > 0,
    },
  ];

  return (
    <BaseCard
      title="Send Money"
      subtitle="P2P Transfer"
      variant={warnings.length > 0 ? 'error' : 'info'}
      icon="paper-plane"
      actions={actions}
      testID={testID}
    >
      {/* Recipient */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Recipient ({recipientType})</Text>
        <View style={styles.recipientRow}>
          <View style={styles.recipientAvatar}>
            <Ionicons
              name={toBeneficiary ? 'person' : 'people'}
              size={24}
              color={ds.colors.brand.primary}
            />
          </View>
          <View style={styles.recipientInfo}>
            <Text style={styles.recipientName}>{recipient}</Text>
            {toBeneficiary && (
              <Text style={styles.recipientPhone}>{toBeneficiary.phone}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Amount Details */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Transaction Details</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount</Text>
          <Text style={styles.detailValue}>{formatNAD(amount)}</Text>
        </View>

        {fee > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fee</Text>
            <Text style={styles.detailValue}>{formatNAD(fee)}</Text>
          </View>
        )}

        <View style={[styles.detailRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatNAD(total)}</Text>
        </View>
      </View>

      {/* Source Wallet */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>From Wallet</Text>
        <View style={styles.walletRow}>
          <View style={styles.walletInfo}>
            <Text style={styles.walletName}>{fromWallet.name}</Text>
            <Text style={styles.walletBalance}>
              Available: {formatNAD(fromWallet.balance)}
            </Text>
          </View>
          <View style={[styles.balanceIndicator, total > fromWallet.balance && styles.insufficientBalance]}>
            <Text style={styles.balanceAfter}>
              After: {formatNAD(fromWallet.balance - total)}
            </Text>
          </View>
        </View>
      </View>

      {/* Note */}
      {note && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Note</Text>
          <Text style={styles.noteText}>{note}</Text>
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
          You'll be asked to authenticate with PIN or biometric
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
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ds.colors.neutral.backgroundAlt,
    padding: ds.spacing.sm,
    borderRadius: ds.radius.sm,
  },
  recipientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ds.colors.brand.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ds.spacing.sm,
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    fontWeight: '600',
  },
  recipientPhone: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: ds.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral.border,
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
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ds.colors.neutral.backgroundAlt,
    padding: ds.spacing.sm,
    borderRadius: ds.radius.sm,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    fontWeight: '600',
  },
  walletBalance: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
    marginTop: 2,
  },
  balanceIndicator: {
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xs,
    backgroundColor: ds.colors.feedback.green100,
    borderRadius: ds.radius.sm,
  },
  insufficientBalance: {
    backgroundColor: ds.colors.feedback.red100,
  },
  balanceAfter: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.text,
    fontWeight: '600',
  },
  noteText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    fontStyle: 'italic',
    backgroundColor: ds.colors.neutral.backgroundAlt,
    padding: ds.spacing.sm,
    borderRadius: ds.radius.sm,
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
  },
});
