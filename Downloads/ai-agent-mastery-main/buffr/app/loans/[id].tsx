/**
 * Loan Details / Management Screen
 * 
 * Location: app/loans/[id].tsx
 * Purpose: Display loan details, payment schedule, autopay, and payment controls
 * 
 * Features:
 * - Loan icon, name, reference number
 * - Loan amount and status
 * - Due date and Total EMI progress
 * - Auto Pay toggle and configuration
 * - Recent history
 * - EMI payment controls (increment/decrement + Pay EMI button)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLoans, Loan } from '@/contexts/LoansContext';
import Colors from '@/constants/Colors';
import { ScreenHeader, ToggleSwitch, StatusBadge, PayFromSelector, PaymentSource } from '@/components/common';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function LoanDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getLoanById, getLoanPayments, payLoan, refreshLoans, loading } = useLoans();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [autoPayEnabled, setAutoPayEnabled] = useState(false);
  const [emiAmount, setEmiAmount] = useState(0);

  useEffect(() => {
    if (id) {
      const foundLoan = getLoanById(id);
      if (foundLoan) {
        setLoan(foundLoan);
        setAutoPayEnabled(foundLoan.autoPayEnabled || false);
        setEmiAmount(foundLoan.nextPaymentAmount || foundLoan.monthlyPayment);
      }
    }
  }, [id, getLoanById]);

  const payments = loan ? getLoanPayments(loan.id) : [];

  const handleBack = () => {
    router.back();
  };

  const handleIncrementEMI = () => {
    if (!loan) return;
    const current = emiAmount;
    const max = loan.remainingBalance;
    setEmiAmount(Math.min(current + 50, max));
  };

  const handleDecrementEMI = () => {
    const current = emiAmount;
    const min = loan?.monthlyPayment || 0;
    setEmiAmount(Math.max(current - 50, min));
  };

  const handlePayEMI = async () => {
    if (!loan) return;
    
    try {
      await payLoan(loan.id, emiAmount, 'wallet');
      // Refresh loan data
      const updatedLoan = getLoanById(loan.id);
      if (updatedLoan) {
        setLoan(updatedLoan);
        setEmiAmount(updatedLoan.nextPaymentAmount || updatedLoan.monthlyPayment);
      }
    } catch (error) {
      console.error('Error paying EMI:', error);
    }
  };


  if (!loan) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Loan Details" onBack={handleBack} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading loan details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader title="Loan Details" onBack={handleBack} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshLoans} tintColor={Colors.primary} />
        }
      >
        {/* Loan Icon, Name, and Reference */}
        <View style={styles.loanHeader}>
          <View style={styles.loanIconContainer}>
            <View style={[styles.loanIconCircle, { backgroundColor: '#E0F2FE' }]}>
              <FontAwesome name={(loan.icon || 'book') as any} size={48} color={Colors.primary} />
            </View>
          </View>
          <View style={styles.loanInfo}>
            <Text style={styles.loanName}>{loan.name || loan.purpose || 'Loan'}</Text>
            {loan.reference && (
              <Text style={styles.loanReference}>Ref: {loan.reference}</Text>
            )}
            <View style={styles.amountAndStatusRow}>
              <Text style={styles.loanAmount}>{formatCurrency(loan.amount)}</Text>
              <StatusBadge status={loan.status} />
            </View>
          </View>
        </View>

        {/* Payment Schedule Info */}
        <View style={styles.paymentInfoRow}>
          <View style={styles.paymentInfoItem}>
            <Text style={styles.paymentInfoValue}>
              {loan.nextPaymentDate ? formatDate(loan.nextPaymentDate) : 'N/A'}
            </Text>
            <Text style={styles.paymentInfoLabel}>Due date</Text>
          </View>
          <View style={styles.paymentInfoSeparator} />
          <View style={styles.paymentInfoItem}>
            <Text style={styles.paymentInfoValue}>
              {loan.paidEMI || 0}/{loan.totalEMI || loan.repaymentPeriod}
            </Text>
            <Text style={styles.paymentInfoLabel}>Total EMI</Text>
          </View>
        </View>

        {/* Auto Pay Section */}
        <View style={styles.autopayCard}>
          <View style={styles.autopayHeader}>
            <Text style={styles.autopayTitle}>Auto Pay</Text>
            <ToggleSwitch
              value={autoPayEnabled}
              onValueChange={setAutoPayEnabled}
            />
          </View>
          <Text style={styles.autopayDescription}>
            Automatically pay your EMI on the due date from your selected payment method.
          </Text>
        </View>

        {/* Recent History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent history</Text>
          <View style={styles.historyItem}>
            <View style={styles.historyIcon}>
              <FontAwesome name="star" size={20} color={Colors.primary} />
            </View>
            <View style={styles.historyContent}>
              <Text style={styles.historyTitle}>Loan Credited</Text>
              <Text style={styles.historyDate}>
                {loan.createdAt ? formatDate(loan.createdAt) : 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* EMI Payment Controls Footer */}
      <View style={styles.footer}>
        <View style={styles.emiControls}>
          <TouchableOpacity
            style={styles.emiButton}
            onPress={handleDecrementEMI}
            activeOpacity={0.7}
          >
            <FontAwesome name="minus" size={20} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.emiAmountDisplay}>
            <Text style={styles.emiAmountText}>{formatCurrency(emiAmount)}</Text>
          </View>
          <TouchableOpacity
            style={styles.emiButton}
            onPress={handleIncrementEMI}
            activeOpacity={0.7}
          >
            <FontAwesome name="plus" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.payEMIButton}
          onPress={handlePayEMI}
          activeOpacity={0.8}
        >
          <Text style={styles.payEMIButtonText}>Pay EMI</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120, // Space for footer (increased for better spacing)
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  loanHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 16,
  },
  loanIconContainer: {
    marginRight: 8,
  },
  loanIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loanInfo: {
    flex: 1,
  },
  loanName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  loanReference: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  amountAndStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  loanAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  paymentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  paymentInfoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  paymentInfoLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  paymentInfoSeparator: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  autopayCard: {
    backgroundColor: 'rgba(248, 248, 248, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  autopayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  autopayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  autopayDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  historySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emiControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  emiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emiAmountDisplay: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  emiAmountText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  payEMIButton: {
    backgroundColor: Colors.textSecondary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payEMIButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
