/**
 * PaymentInitiationCard – Smartpay Agentic Copilot OBS Integration.
 * Displays payment initiation confirmation and handles SCA redirect for PISP payments.
 * Location: fintech/smartpay/components/copilot/cards/PaymentInitiationCard.tsx
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { BaseCard, type BaseCardAction } from './BaseCard';
import { designSystem } from '@/constants/designSystem';

const ds = designSystem;

export interface PaymentInitiationDetails {
  /** Payment ID from Data Provider */
  paymentId: string;
  /** Payment amount */
  amount: number;
  /** Currency code (NAD) */
  currency: string;
  /** Beneficiary name */
  beneficiaryName: string;
  /** Beneficiary account identifier */
  beneficiaryAccountIdentifier: string;
  /** Debtor account ID */
  debtorAccountId: string;
  /** Debtor account name (if available) */
  debtorAccountName?: string;
  /** Payment status (AwaitingAuthorisation, AcceptedSettlementCompleted, etc.) */
  status: string;
  /** Remittance information/note */
  remittanceInformation?: string;
  /** Authorization flow details */
  authorizationFlow?: {
    /** SCA redirect URL */
    redirectUri: string;
    /** Authorization type */
    type: string;
  };
  /** Institution name */
  institutionName?: string;
  /** Payment initiation timestamp */
  createdAt?: string;
}

export interface PaymentInitiationCardProps {
  /** Payment details */
  payment: PaymentInitiationDetails;
  /** Callback to redirect to bank for SCA */
  onAuthorize?: (redirectUri: string) => void;
  /** Callback to check payment status */
  onCheckStatus?: (paymentId: string) => void;
  /** Callback to cancel payment */
  onCancel?: () => void;
  /** Test ID for automated testing */
  testID?: string;
}

/**
 * Format currency amount to Namibian Dollar format.
 */
function formatNAD(amount: number, currency: string): string {
  const symbol = currency === 'NAD' ? 'N$' : currency;
  return `${symbol}${amount.toLocaleString('en-NA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Get status color and display text.
 */
function getStatusDisplay(status: string): { color: string; label: string; icon: string } {
  const statusMap: Record<string, { color: string; label: string; icon: string }> = {
    'AwaitingAuthorisation': {
      color: '#F59E0B',
      label: 'Awaiting Authorization',
      icon: '🔐',
    },
    'AcceptedSettlementInProcess': {
      color: '#3B82F6',
      label: 'Processing',
      icon: '⏳',
    },
    'AcceptedSettlementCompleted': {
      color: '#22C55E',
      label: 'Completed',
      icon: '✅',
    },
    'Rejected': {
      color: '#EF4444',
      label: 'Rejected',
      icon: '❌',
    },
  };

  return statusMap[status] ?? {
    color: ds.colors.neutral.textSecondary,
    label: status,
    icon: '📋',
  };
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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * PaymentInitiationCard component - Displays PISP payment confirmation and SCA redirect.
 * Shows payment details with authorization actions for bank confirmation.
 * 
 * @example
 * ```tsx
 * <PaymentInitiationCard 
 *   payment={paymentDetails}
 *   onAuthorize={(url) => openBankSCA(url)}
 *   onCheckStatus={(id) => refreshPaymentStatus(id)}
 * />
 * ```
 */
export function PaymentInitiationCard({
  payment,
  onAuthorize,
  onCheckStatus,
  onCancel,
  testID = 'payment-initiation-card',
}: PaymentInitiationCardProps) {
  const [isChecking, setIsChecking] = useState(false);
  const statusDisplay = getStatusDisplay(payment.status);
  const needsAuthorization = payment.status === 'AwaitingAuthorisation' && payment.authorizationFlow?.redirectUri;

  const actions: BaseCardAction[] = [];

  if (needsAuthorization && onAuthorize && payment.authorizationFlow?.redirectUri) {
    actions.push({
      id: 'authorize',
      label: 'Authorize at Bank',
      onPress: () => onAuthorize(payment.authorizationFlow!.redirectUri),
      variant: 'primary',
    });
  }

  if (onCheckStatus && payment.status !== 'AcceptedSettlementCompleted' && payment.status !== 'Rejected') {
    actions.push({
      id: 'check-status',
      label: 'Check Status',
      onPress: async () => {
        setIsChecking(true);
        try {
          await onCheckStatus(payment.paymentId);
        } finally {
          setIsChecking(false);
        }
      },
      variant: 'secondary',
    });
  }

  if (onCancel && payment.status === 'AwaitingAuthorisation') {
    actions.push({
      id: 'cancel',
      label: 'Cancel',
      onPress: onCancel,
      variant: 'secondary',
    });
  }

  return (
    <BaseCard
      title="Bank Payment Initiated"
      subtitle={payment.institutionName ?? 'Open Banking Payment'}
      actions={actions}
      variant={needsAuthorization ? 'warning' : 'default'}
      testID={testID}
    >
      {/* Payment Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusIcon}>{statusDisplay.icon}</Text>
        <Text style={[styles.statusLabel, { color: statusDisplay.color }]}>
          {statusDisplay.label}
        </Text>
      </View>

      {/* Payment Amount */}
      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Payment Amount</Text>
        <Text style={styles.amountValue}>
          {formatNAD(payment.amount, payment.currency)}
        </Text>
      </View>

      {/* Payment Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>To:</Text>
          <Text style={styles.detailValue}>{payment.beneficiaryName}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Account:</Text>
          <Text style={styles.detailValue}>
            {maskAccountNumber(payment.beneficiaryAccountIdentifier)}
          </Text>
        </View>

        {payment.debtorAccountName && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>From:</Text>
            <Text style={styles.detailValue}>{payment.debtorAccountName}</Text>
          </View>
        )}

        {payment.remittanceInformation && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Note:</Text>
            <Text style={styles.detailValue}>{payment.remittanceInformation}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment ID:</Text>
          <Text style={[styles.detailValue, styles.paymentId]}>
            {payment.paymentId.substring(0, 16)}...
          </Text>
        </View>

        {payment.createdAt && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Initiated:</Text>
            <Text style={styles.detailValue}>{formatDateTime(payment.createdAt)}</Text>
          </View>
        )}
      </View>

      {/* SCA Notice */}
      {needsAuthorization && (
        <View style={styles.scaNotice}>
          <Text style={styles.scaNoticeTitle}>🔒 Authorization Required</Text>
          <Text style={styles.scaNoticeText}>
            Your bank requires you to confirm this payment. You will be redirected to your bank's secure 
            portal to complete Strong Customer Authentication (SCA). This is required for your security.
          </Text>
        </View>
      )}

      {/* Status Check Loading */}
      {isChecking && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={ds.colors.brand.primary} />
          <Text style={styles.loadingText}>Checking payment status...</Text>
        </View>
      )}

      {/* OBS Notice */}
      <View style={styles.obsNotice}>
        <Text style={styles.obsNoticeText}>
          🏦 Payment initiated via Open Banking Services (PISP). Your bank credentials are never shared.
        </Text>
      </View>
    </BaseCard>
  );
}

/**
 * Mask account number for security (show last 4 digits only).
 */
function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  const lastFour = accountNumber.slice(-4);
  return `•••• ${lastFour}`;
}

const styles = StyleSheet.create({
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ds.spacing.sm,
    paddingHorizontal: ds.spacing.md,
    backgroundColor: ds.colors.neutral.muted,
    borderRadius: ds.radius.md,
    marginBottom: ds.spacing.md,
  },
  statusIcon: {
    fontSize: 24,
    marginRight: ds.spacing.sm,
  },
  statusLabel: {
    ...ds.typography.textStyles.h3,
    fontWeight: '700',
  },
  amountContainer: {
    paddingVertical: ds.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: ds.colors.neutral.border,
    marginBottom: ds.spacing.md,
  },
  amountLabel: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.textSecondary,
    marginBottom: 4,
  },
  amountValue: {
    ...ds.typography.textStyles.largeTitle,
    color: ds.colors.brand.primary,
    fontWeight: '700',
  },
  detailsContainer: {
    marginBottom: ds.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: ds.spacing.xs,
  },
  detailLabel: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.textSecondary,
    flex: 1,
  },
  detailValue: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  paymentId: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  scaNotice: {
    backgroundColor: '#FEF3C7',
    padding: ds.spacing.md,
    borderRadius: ds.radius.md,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    marginBottom: ds.spacing.md,
  },
  scaNoticeTitle: {
    ...ds.typography.textStyles.body,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: ds.spacing.xs,
  },
  scaNoticeText: {
    ...ds.typography.textStyles.bodySmall,
    color: '#92400E',
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ds.spacing.md,
    gap: ds.spacing.sm,
  },
  loadingText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.textSecondary,
  },
  obsNotice: {
    padding: ds.spacing.sm,
    backgroundColor: ds.colors.neutral.muted,
    borderRadius: ds.radius.sm,
  },
  obsNoticeText: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
  },
});
