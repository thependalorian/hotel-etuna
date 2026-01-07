/**
 * LoanDetails Component
 * 
 * Location: components/loans/LoanDetails.tsx
 * Purpose: Display detailed loan information and terms
 * 
 * Based on Loan Details.svg design
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';

interface LoanDetailsProps {
  loanId: string;
  amount: number;
  interestRate: number;
  duration: number;
  monthlyPayment: number;
  totalAmount: number;
  provider: string;
  onApply?: () => void;
}

export default function LoanDetails({
  amount,
  interestRate,
  duration,
  monthlyPayment,
  totalAmount,
  provider,
  onApply,
}: LoanDetailsProps) {
  return (
    <ScrollView style={defaultStyles.containerFull} contentContainerStyle={styles.content}>
      <Text style={defaultStyles.headerMedium}>Loan Details</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Loan Amount</Text>
        <Text style={styles.summaryAmount}>N$ {amount.toLocaleString()}</Text>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Provider</Text>
          <Text style={styles.detailValue}>{provider}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Interest Rate</Text>
          <Text style={styles.detailValue}>{interestRate}% APR</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailValue}>{duration} months</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Monthly Payment</Text>
          <Text style={styles.detailValue}>N$ {monthlyPayment.toLocaleString()}</Text>
        </View>
        <View style={[styles.detailRow, styles.detailRowTotal]}>
          <Text style={styles.detailLabelTotal}>Total Amount</Text>
          <Text style={styles.detailValueTotal}>N$ {totalAmount.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.termsSection}>
        <Text style={styles.termsTitle}>Terms & Conditions</Text>
        <Text style={styles.termsText}>
          • Loan approval subject to credit check{'\n'}
          • Early repayment may incur fees{'\n'}
          • Late payments will incur additional charges{'\n'}
          • Please read full terms before applying
        </Text>
      </View>

      <TouchableOpacity style={defaultStyles.pillButton} onPress={onApply}>
        <Text style={defaultStyles.buttonText}>Apply for Loan</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: Colors.white,
  },
  detailsSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailRowTotal: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
  },
  detailLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  detailLabelTotal: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  detailValueTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  termsSection: {
    backgroundColor: Colors.backgroundGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  termsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  termsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
});
