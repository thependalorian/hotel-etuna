/**
 * CashOutCard – Cash-Out Transaction Card
 * Displays cash-out method selection and transaction details.
 * Location: fintech/smartpay/components/copilot/cards/CashOutCard.tsx
 * 
 * Supports 5 cash-out methods:
 * - Bank transfer
 * - Till code (merchant payment)
 * - Agent code (cash at agent)
 * - Merchant scan (QR at merchant)
 * - ATM withdrawal
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BaseCard, type BaseCardAction } from './BaseCard';
import { designSystem } from '@/constants/designSystem';

const ds = designSystem;

export type CashOutMethod = 'bank' | 'till' | 'agent' | 'merchant' | 'atm';

interface CashOutMethodOption {
  id: CashOutMethod;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  fee: number;
  estimatedTime: string;
}

const CASHOUT_METHODS: CashOutMethodOption[] = [
  {
    id: 'bank',
    label: 'Bank Transfer',
    icon: 'business',
    description: 'Direct transfer to your bank account',
    fee: 0,
    estimatedTime: '1-2 business days',
  },
  {
    id: 'till',
    label: 'Till Number',
    icon: 'calculator',
    description: 'Generate a till code for merchant payment',
    fee: 0,
    estimatedTime: 'Instant',
  },
  {
    id: 'agent',
    label: 'Agent Code',
    icon: 'person-circle',
    description: 'Collect cash at any SmartPay agent',
    fee: 15,
    estimatedTime: 'Instant',
  },
  {
    id: 'merchant',
    label: 'Merchant Scan',
    icon: 'qr-code',
    description: 'Merchant scans your QR code',
    fee: 0,
    estimatedTime: 'Instant',
  },
  {
    id: 'atm',
    label: 'ATM Withdrawal',
    icon: 'card',
    description: 'Withdraw cash from any ATM',
    fee: 10,
    estimatedTime: 'Instant',
  },
];

export interface CashOutCardProps {
  wallet: { id: string; name: string; balance: number };
  amount: number;
  selectedMethod?: CashOutMethod;
  destinationDetails?: Record<string, unknown>;
  onMethodSelect: (method: CashOutMethod) => void;
  onConfirm: (method: CashOutMethod) => void;
  onCancel: () => void;
  isProcessing?: boolean;
  testID?: string;
}

function formatNAD(amount: number): string {
  return `N$${amount.toLocaleString('en-NA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CashOutCard({
  wallet,
  amount,
  selectedMethod,
  destinationDetails,
  onMethodSelect,
  onConfirm,
  onCancel,
  isProcessing = false,
  testID = 'cash-out-card',
}: CashOutCardProps) {
  const selectedMethodData = CASHOUT_METHODS.find(m => m.id === selectedMethod);
  const fee = selectedMethodData?.fee || 0;
  const total = amount + fee;

  // Validation warnings
  const warnings: string[] = [];
  if (total > wallet.balance) {
    warnings.push('Insufficient balance in wallet');
  }
  if (amount <= 0) {
    warnings.push('Amount must be greater than zero');
  }
  if (amount < 10) {
    warnings.push('Minimum cash-out amount: N$10.00');
  }
  if (amount > 10000) {
    warnings.push('Maximum cash-out amount: N$10,000 per transaction');
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
      label: isProcessing ? 'Processing...' : 'Confirm Cash-Out',
      onPress: () => selectedMethod && onConfirm(selectedMethod),
      variant: 'primary',
      disabled: isProcessing || !selectedMethod || warnings.length > 0,
    },
  ];

  return (
    <BaseCard
      title="Cash Out"
      subtitle="Withdraw Funds"
      variant={warnings.length > 0 ? 'error' : 'info'}
      icon="cash"
      actions={actions}
      testID={testID}
    >
      {/* Method Selection */}
      {!selectedMethod ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Cash-Out Method</Text>
          <View style={styles.methodsGrid}>
            {CASHOUT_METHODS.map(method => (
              <TouchableOpacity
                key={method.id}
                style={styles.methodCard}
                onPress={() => onMethodSelect(method.id)}
                activeOpacity={0.7}
              >
                <Ionicons name={method.icon} size={32} color={ds.colors.brand.primary} />
                <Text style={styles.methodLabel}>{method.label}</Text>
                <Text style={styles.methodFee}>
                  {method.fee > 0 ? formatNAD(method.fee) : 'Free'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <>
          {/* Selected Method */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Cash-Out Method</Text>
            <View style={styles.selectedMethodRow}>
              <Ionicons name={selectedMethodData!.icon} size={24} color={ds.colors.brand.primary} />
              <View style={styles.selectedMethodInfo}>
                <Text style={styles.selectedMethodLabel}>{selectedMethodData!.label}</Text>
                <Text style={styles.selectedMethodDescription}>
                  {selectedMethodData!.description}
                </Text>
                <Text style={styles.selectedMethodTime}>
                  {selectedMethodData!.estimatedTime}
                </Text>
              </View>
              <TouchableOpacity onPress={() => onMethodSelect(selectedMethod)} style={styles.changeButton}>
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
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
              <Text style={styles.totalLabel}>Total Deducted</Text>
              <Text style={styles.totalValue}>{formatNAD(total)}</Text>
            </View>
          </View>

          {/* Source Wallet */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>From Wallet</Text>
            <View style={styles.walletRow}>
              <View style={styles.walletInfo}>
                <Text style={styles.walletName}>{wallet.name}</Text>
                <Text style={styles.walletBalance}>
                  Available: {formatNAD(wallet.balance)}
                </Text>
              </View>
              <View style={[styles.balanceIndicator, total > wallet.balance && styles.insufficientBalance]}>
                <Text style={styles.balanceAfter}>
                  After: {formatNAD(wallet.balance - total)}
                </Text>
              </View>
            </View>
          </View>

          {/* Destination Details (if applicable) */}
          {destinationDetails && selectedMethod === 'bank' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Bank Details</Text>
              <View style={styles.destinationBox}>
                <Text style={styles.destinationText}>
                  {destinationDetails.bankName || 'Bank'}
                </Text>
                <Text style={styles.destinationText}>
                  Account: {destinationDetails.accountNumber || 'N/A'}
                </Text>
              </View>
            </View>
          )}
        </>
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
          You'll be asked to authenticate before completing cash-out
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
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing.sm,
  },
  methodCard: {
    width: '48%',
    backgroundColor: ds.colors.neutral.backgroundAlt,
    padding: ds.spacing.md,
    borderRadius: ds.radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ds.colors.neutral.border,
  },
  methodLabel: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.text,
    fontWeight: '600',
    marginTop: ds.spacing.xs,
    textAlign: 'center',
  },
  methodFee: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
    marginTop: 2,
  },
  selectedMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ds.colors.neutral.backgroundAlt,
    padding: ds.spacing.sm,
    borderRadius: ds.radius.sm,
    gap: ds.spacing.sm,
  },
  selectedMethodInfo: {
    flex: 1,
  },
  selectedMethodLabel: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    fontWeight: '600',
  },
  selectedMethodDescription: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
    marginTop: 2,
  },
  selectedMethodTime: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.brand.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  changeButton: {
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xs,
  },
  changeButtonText: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.brand.primary,
    fontWeight: '600',
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
  destinationBox: {
    backgroundColor: ds.colors.neutral.backgroundAlt,
    padding: ds.spacing.sm,
    borderRadius: ds.radius.sm,
  },
  destinationText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    marginBottom: 4,
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
