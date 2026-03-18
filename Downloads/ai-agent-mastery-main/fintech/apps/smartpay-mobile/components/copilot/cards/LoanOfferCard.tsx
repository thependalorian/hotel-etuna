/**
 * LoanOfferCard – Loan Eligibility and Application Card
 * Displays loan offers and handles loan application flow.
 * Location: fintech/smartpay/components/copilot/cards/LoanOfferCard.tsx
 * 
 * Shows:
 * - Loan eligibility status
 * - Maximum loan amount (voucher-backed)
 * - Interest rate and terms
 * - Repayment schedule preview
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BaseCard, type BaseCardAction } from './BaseCard';
import { designSystem } from '@/constants/designSystem';

const ds = designSystem;

export interface LoanOffer {
  maxAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment?: number;
  isEligible: boolean;
  requirementsMet: string[];
  requirementsNotMet: string[];
  voucherBacked?: boolean;
  creditScore?: number;
}

export interface LoanOfferCardProps {
  offer: LoanOffer;
  requestedAmount?: number;
  onApply: (amount: number) => void;
  onDecline: () => void;
  isProcessing?: boolean;
  testID?: string;
}

function formatNAD(amount: number): string {
  return `N$${amount.toLocaleString('en-NA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function LoanOfferCard({
  offer,
  requestedAmount,
  onApply,
  onDecline,
  isProcessing = false,
  testID = 'loan-offer-card',
}: LoanOfferCardProps) {
  const loanAmount = requestedAmount || offer.maxAmount;
  const monthlyPayment = offer.monthlyPayment || calculateMonthlyPayment(loanAmount, offer.interestRate, offer.termMonths);
  const totalRepayment = monthlyPayment * offer.termMonths;
  const totalInterest = totalRepayment - loanAmount;

  // Validation warnings
  const warnings: string[] = [];
  if (!offer.isEligible) {
    warnings.push('You do not meet the eligibility requirements');
  }
  if (requestedAmount && requestedAmount > offer.maxAmount) {
    warnings.push(`Maximum loan amount is ${formatNAD(offer.maxAmount)}`);
  }
  if (requestedAmount && requestedAmount < 100) {
    warnings.push('Minimum loan amount is N$100.00');
  }

  const actions: BaseCardAction[] = [
    {
      id: 'decline',
      label: 'Not Now',
      onPress: onDecline,
      variant: 'secondary',
      disabled: isProcessing,
    },
    {
      id: 'apply',
      label: isProcessing ? 'Processing...' : 'Apply for Loan',
      onPress: () => onApply(loanAmount),
      variant: 'primary',
      disabled: isProcessing || !offer.isEligible || warnings.length > 0,
    },
  ];

  return (
    <BaseCard
      title={offer.isEligible ? 'Loan Offer Available' : 'Loan Eligibility Check'}
      subtitle="Voucher-Backed Loan"
      variant={offer.isEligible ? 'success' : 'warning'}
      icon="cash"
      actions={actions}
      testID={testID}
    >
      {/* Eligibility Status */}
      <View style={[styles.statusBanner, !offer.isEligible && styles.statusBannerIneligible]}>
        <Ionicons
          name={offer.isEligible ? 'checkmark-circle' : 'close-circle'}
          size={24}
          color={offer.isEligible ? ds.colors.feedback.green : ds.colors.feedback.red}
        />
        <Text style={styles.statusText}>
          {offer.isEligible ? 'You are eligible for a loan' : 'Not eligible at this time'}
        </Text>
      </View>

      {offer.isEligible ? (
        <>
          {/* Loan Details */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Loan Details</Text>
            
            <View style={styles.loanCard}>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Loan Amount</Text>
                <Text style={styles.amountValue}>{formatNAD(loanAmount)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Interest Rate</Text>
                <Text style={styles.detailValue}>{offer.interestRate}% p.a.</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Loan Term</Text>
                <Text style={styles.detailValue}>{offer.termMonths} months</Text>
              </View>
              
              <View style={[styles.detailRow, styles.highlightRow]}>
                <Text style={styles.detailLabel}>Monthly Payment</Text>
                <Text style={styles.highlightValue}>{formatNAD(monthlyPayment)}</Text>
              </View>
            </View>
          </View>

          {/* Repayment Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Repayment Summary</Text>
            
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Repayment</Text>
                <Text style={styles.summaryValue}>{formatNAD(totalRepayment)}</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Interest</Text>
                <Text style={styles.summaryValue}>{formatNAD(totalInterest)}</Text>
              </View>
            </View>
          </View>

          {/* Voucher Backing Info */}
          {offer.voucherBacked && (
            <View style={styles.infoBox}>
              <Ionicons name="shield-checkmark" size={20} color={ds.colors.semantic.info} />
              <Text style={styles.infoText}>
                This loan is backed by your government voucher allocation, ensuring affordable terms.
              </Text>
            </View>
          )}

          {/* Requirements Met */}
          {offer.requirementsMet.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Requirements Met</Text>
              <View style={styles.requirementsList}>
                {offer.requirementsMet.map((req, index) => (
                  <View key={index} style={styles.requirementRow}>
                    <Ionicons name="checkmark-circle" size={16} color={ds.colors.feedback.green} />
                    <Text style={styles.requirementText}>{req}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      ) : (
        <>
          {/* Requirements Not Met */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Requirements Not Met</Text>
            <View style={styles.requirementsList}>
              {offer.requirementsNotMet.map((req, index) => (
                <View key={index} style={styles.requirementRow}>
                  <Ionicons name="close-circle" size={16} color={ds.colors.feedback.red} />
                  <Text style={styles.requirementText}>{req}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Improvement Tips */}
          <View style={styles.tipsBox}>
            <Text style={styles.tipsTitle}>How to Become Eligible:</Text>
            <Text style={styles.tipsText}>
              • Ensure your voucher is active and not expired{'\n'}
              • Complete proof-of-life verification{'\n'}
              • Maintain a good repayment history{'\n'}
              • Keep your account in good standing
            </Text>
          </View>
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

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          By applying, you agree to the loan terms and conditions. 
          Loan approval is subject to final verification.
        </Text>
      </View>
    </BaseCard>
  );
}

/**
 * Calculate monthly payment using loan amortization formula.
 */
function calculateMonthlyPayment(principal: number, annualRate: number, months: number): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                  (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(payment * 100) / 100;
}

const styles = StyleSheet.create({
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ds.colors.feedback.green100,
    padding: ds.spacing.md,
    borderRadius: ds.radius.md,
    marginBottom: ds.spacing.md,
    gap: ds.spacing.sm,
  },
  statusBannerIneligible: {
    backgroundColor: ds.colors.feedback.red100,
  },
  statusText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    fontWeight: '600',
    flex: 1,
  },
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
  loanCard: {
    backgroundColor: ds.colors.neutral.backgroundAlt,
    padding: ds.spacing.md,
    borderRadius: ds.radius.md,
    borderWidth: 1,
    borderColor: ds.colors.neutral.border,
  },
  amountRow: {
    alignItems: 'center',
    marginBottom: ds.spacing.md,
    paddingBottom: ds.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: ds.colors.neutral.border,
  },
  amountLabel: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.textSecondary,
    marginBottom: ds.spacing.xs,
  },
  amountValue: {
    ...ds.typography.textStyles.h1,
    color: ds.colors.brand.primary,
    fontWeight: '700',
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
  highlightRow: {
    marginTop: ds.spacing.sm,
    paddingTop: ds.spacing.sm,
    borderTopWidth: 2,
    borderTopColor: ds.colors.neutral.border,
  },
  highlightValue: {
    ...ds.typography.textStyles.h3,
    color: ds.colors.brand.primary,
    fontWeight: '700',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: ds.spacing.sm,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: ds.colors.neutral.backgroundAlt,
    padding: ds.spacing.md,
    borderRadius: ds.radius.sm,
    alignItems: 'center',
  },
  summaryLabel: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
    marginBottom: ds.spacing.xs,
  },
  summaryValue: {
    ...ds.typography.textStyles.h3,
    color: ds.colors.neutral.text,
    fontWeight: '700',
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
  requirementsList: {
    gap: ds.spacing.xs,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.spacing.xs,
  },
  requirementText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    flex: 1,
  },
  tipsBox: {
    backgroundColor: ds.colors.feedback.blue100,
    padding: ds.spacing.md,
    borderRadius: ds.radius.md,
    marginBottom: ds.spacing.md,
  },
  tipsTitle: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    fontWeight: '700',
    marginBottom: ds.spacing.xs,
  },
  tipsText: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.text,
    lineHeight: 20,
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
  disclaimer: {
    paddingTop: ds.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: ds.colors.neutral.border,
  },
  disclaimerText: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
