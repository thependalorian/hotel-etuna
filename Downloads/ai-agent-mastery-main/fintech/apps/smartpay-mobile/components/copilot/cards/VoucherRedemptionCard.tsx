/**
 * VoucherRedemptionCard – Voucher Redemption Flow Card
 * Displays voucher redemption options and details.
 * Location: fintech/smartpay/components/copilot/cards/VoucherRedemptionCard.tsx
 * 
 * Supports 3 redemption methods:
 * - Wallet (direct deposit to SmartPay wallet)
 * - NamPost (collect at NamPost branch)
 * - SmartPay Agent (collect at agent location)
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BaseCard, type BaseCardAction } from './BaseCard';
import { designSystem } from '@/constants/designSystem';

const ds = designSystem;

export type RedemptionMethod = 'wallet' | 'nampost' | 'smartpay';

interface RedemptionMethodOption {
  id: RedemptionMethod;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  processingTime: string;
}

const REDEMPTION_METHODS: RedemptionMethodOption[] = [
  {
    id: 'wallet',
    label: 'SmartPay Wallet',
    icon: 'wallet',
    description: 'Instant deposit to your wallet',
    processingTime: 'Instant',
  },
  {
    id: 'nampost',
    label: 'NamPost Branch',
    icon: 'business',
    description: 'Collect cash at any NamPost office',
    processingTime: '24 hours',
  },
  {
    id: 'smartpay',
    label: 'SmartPay Agent',
    icon: 'person-circle',
    description: 'Collect cash at nearest agent',
    processingTime: '1-2 hours',
  },
];

export interface VoucherDetails {
  voucherId: string;
  issuer: string;
  amount: number;
  expiryDate: string;
  description?: string;
  restrictions?: string[];
}

export interface VoucherRedemptionCardProps {
  voucher: VoucherDetails;
  selectedMethod?: RedemptionMethod;
  selectedWallet?: { id: string; name: string };
  onMethodSelect: (method: RedemptionMethod) => void;
  onWalletSelect?: () => void;
  onConfirm: (method: RedemptionMethod) => void;
  onCancel: () => void;
  isProcessing?: boolean;
  testID?: string;
}

function formatNAD(amount: number): string {
  return `N$${amount.toLocaleString('en-NA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-NA', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function VoucherRedemptionCard({
  voucher,
  selectedMethod,
  selectedWallet,
  onMethodSelect,
  onWalletSelect,
  onConfirm,
  onCancel,
  isProcessing = false,
  testID = 'voucher-redemption-card',
}: VoucherRedemptionCardProps) {
  const selectedMethodData = REDEMPTION_METHODS.find(m => m.id === selectedMethod);
  
  // Check if voucher is expired
  const isExpired = new Date(voucher.expiryDate) < new Date();
  
  // Validation warnings
  const warnings: string[] = [];
  if (isExpired) {
    warnings.push('This voucher has expired');
  }
  if (selectedMethod === 'wallet' && !selectedWallet) {
    warnings.push('Please select a wallet for redemption');
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
      label: isProcessing ? 'Processing...' : 'Redeem Voucher',
      onPress: () => selectedMethod && onConfirm(selectedMethod),
      variant: 'primary',
      disabled: isProcessing || !selectedMethod || warnings.length > 0,
    },
  ];

  return (
    <BaseCard
      title="Redeem Voucher"
      subtitle="Government/Partner Voucher"
      variant={warnings.length > 0 ? 'error' : 'success'}
      icon="ticket"
      actions={actions}
      testID={testID}
    >
      {/* Voucher Details */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Voucher Details</Text>
        <View style={styles.voucherCard}>
          <View style={styles.voucherHeader}>
            <Ionicons name="ticket" size={32} color={ds.colors.brand.primary} />
            <View style={styles.voucherHeaderInfo}>
              <Text style={styles.voucherIssuer}>{voucher.issuer}</Text>
              <Text style={styles.voucherAmount}>{formatNAD(voucher.amount)}</Text>
            </View>
          </View>
          
          {voucher.description && (
            <Text style={styles.voucherDescription}>{voucher.description}</Text>
          )}
          
          <View style={styles.voucherMeta}>
            <View style={styles.voucherMetaRow}>
              <Ionicons name="calendar" size={16} color={ds.colors.neutral.textSecondary} />
              <Text style={styles.voucherMetaText}>
                Expires: {formatDate(voucher.expiryDate)}
              </Text>
            </View>
            {isExpired && (
              <View style={[styles.voucherMetaRow, styles.expiredBadge]}>
                <Ionicons name="alert-circle" size={16} color={ds.colors.feedback.red} />
                <Text style={styles.expiredText}>EXPIRED</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Restrictions */}
      {voucher.restrictions && voucher.restrictions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Restrictions</Text>
          <View style={styles.restrictionsBox}>
            {voucher.restrictions.map((restriction, index) => (
              <View key={index} style={styles.restrictionRow}>
                <Ionicons name="remove-circle" size={16} color={ds.colors.feedback.amber} />
                <Text style={styles.restrictionText}>{restriction}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Method Selection */}
      {!selectedMethod || !isExpired ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Redemption Method</Text>
          <View style={styles.methodsList}>
            {REDEMPTION_METHODS.map(method => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodRow,
                  selectedMethod === method.id && styles.methodRowSelected,
                ]}
                onPress={() => onMethodSelect(method.id)}
                activeOpacity={0.7}
                disabled={isExpired}
              >
                <Ionicons
                  name={method.icon}
                  size={24}
                  color={selectedMethod === method.id ? ds.colors.brand.primary : ds.colors.neutral.textSecondary}
                />
                <View style={styles.methodInfo}>
                  <Text style={styles.methodLabel}>{method.label}</Text>
                  <Text style={styles.methodDescription}>{method.description}</Text>
                  <Text style={styles.methodTime}>{method.processingTime}</Text>
                </View>
                {selectedMethod === method.id && (
                  <Ionicons name="checkmark-circle" size={24} color={ds.colors.brand.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      {/* Wallet Selection (if method is wallet) */}
      {selectedMethod === 'wallet' && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Destination Wallet</Text>
          {selectedWallet ? (
            <View style={styles.walletRow}>
              <View style={styles.walletInfo}>
                <Text style={styles.walletName}>{selectedWallet.name}</Text>
                <Text style={styles.walletNote}>Funds will be deposited here</Text>
              </View>
              <TouchableOpacity onPress={onWalletSelect} style={styles.changeButton}>
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.selectWalletButton} onPress={onWalletSelect}>
              <Ionicons name="add-circle" size={24} color={ds.colors.brand.primary} />
              <Text style={styles.selectWalletText}>Select Wallet</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Processing Info */}
      {selectedMethod && selectedMethodData && !isExpired && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={ds.colors.semantic.info} />
          <Text style={styles.infoText}>
            {selectedMethodData.id === 'wallet'
              ? `Funds will be instantly available in your ${selectedWallet?.name || 'wallet'}.`
              : selectedMethodData.id === 'nampost'
              ? 'You will receive a collection code to present at any NamPost branch.'
              : 'You will receive a collection code to present at your nearest SmartPay agent.'}
          </Text>
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
          Voucher redemption is tracked for compliance and audit purposes
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
  voucherCard: {
    backgroundColor: ds.colors.neutral.backgroundAlt,
    padding: ds.spacing.md,
    borderRadius: ds.radius.md,
    borderWidth: 1,
    borderColor: ds.colors.neutral.border,
  },
  voucherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ds.spacing.sm,
    gap: ds.spacing.sm,
  },
  voucherHeaderInfo: {
    flex: 1,
  },
  voucherIssuer: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.textSecondary,
    marginBottom: 2,
  },
  voucherAmount: {
    ...ds.typography.textStyles.h2,
    color: ds.colors.brand.primary,
    fontWeight: '700',
  },
  voucherDescription: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    marginBottom: ds.spacing.sm,
  },
  voucherMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: ds.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: ds.colors.neutral.border,
  },
  voucherMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.xs,
  },
  voucherMetaText: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
  },
  expiredBadge: {
    backgroundColor: ds.colors.feedback.red100,
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: ds.spacing.xs,
    borderRadius: ds.radius.sm,
  },
  expiredText: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.feedback.red,
    fontWeight: '700',
  },
  restrictionsBox: {
    backgroundColor: ds.colors.feedback.amber100,
    padding: ds.spacing.sm,
    borderRadius: ds.radius.sm,
  },
  restrictionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: ds.spacing.xs,
    gap: ds.spacing.xs,
  },
  restrictionText: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.text,
    flex: 1,
  },
  methodsList: {
    gap: ds.spacing.sm,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ds.colors.neutral.backgroundAlt,
    padding: ds.spacing.md,
    borderRadius: ds.radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: ds.spacing.sm,
  },
  methodRowSelected: {
    borderColor: ds.colors.brand.primary,
    backgroundColor: ds.colors.brand.primaryLight,
  },
  methodInfo: {
    flex: 1,
  },
  methodLabel: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    fontWeight: '600',
  },
  methodDescription: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
    marginTop: 2,
  },
  methodTime: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.brand.primary,
    marginTop: 2,
    fontWeight: '600',
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
  walletNote: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
    marginTop: 2,
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
  selectWalletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ds.colors.neutral.backgroundAlt,
    padding: ds.spacing.md,
    borderRadius: ds.radius.sm,
    borderWidth: 2,
    borderColor: ds.colors.brand.primary,
    borderStyle: 'dashed',
    gap: ds.spacing.xs,
  },
  selectWalletText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.brand.primary,
    fontWeight: '600',
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
  infoText: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.text,
    flex: 1,
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
