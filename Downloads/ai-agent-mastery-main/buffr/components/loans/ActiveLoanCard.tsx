/**
 * Active Loan Card Component
 * 
 * Location: components/loans/ActiveLoanCard.tsx
 * Purpose: Display card for an active loan in the "Loans activity" section
 * 
 * Features:
 * - Loan icon and name
 * - EMI progress (paid/total)
 * - Outstanding amount
 * - Due date
 * - Pay EMI button
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Loan } from '@/contexts/LoansContext';
import Colors from '@/constants/Colors';
import { formatCurrency, formatDate } from '@/utils/formatters';

interface ActiveLoanCardProps {
  loan: Loan;
  onPress?: () => void;
  onPayEMI?: () => void;
}

export default function ActiveLoanCard({ loan, onPress, onPayEMI }: ActiveLoanCardProps) {
  const handleCardPress = () => {
    if (onPress) {
      onPress();
    }
  };

  const handlePayEMI = (e: any) => {
    e.stopPropagation(); // Prevent card press when button is clicked
    if (onPayEMI) {
      onPayEMI();
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleCardPress}
      activeOpacity={0.8}
    >
      {/* Gradient Background Effect */}
      <View style={styles.gradientOverlay} />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Icon and Loan Name Row */}
        <View style={styles.headerRow}>
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: '#E0F7E0' }]}>
              <FontAwesome 
                name={(loan.icon || 'book') as any} 
                size={24} 
                color={loan.status === 'active' || loan.status === 'starting' ? '#10B981' : Colors.primary} 
              />
            </View>
          </View>
          <View style={styles.loanInfo}>
            <Text style={styles.loanName} numberOfLines={1}>
              {loan.name || loan.purpose || 'Loan'}
            </Text>
            <Text style={styles.emiProgress}>
              EMI {loan.paidEMI || 0}/{loan.totalEMI || loan.repaymentPeriod}
            </Text>
          </View>
        </View>

        {/* Amount */}
        <Text style={styles.amount}>{formatCurrency(loan.remainingBalance || loan.amount)}</Text>

        {/* Due Date */}
        {loan.nextPaymentDate && (
          <Text style={styles.dueDate}>
            Due on {formatDate(loan.nextPaymentDate)}
          </Text>
        )}

        {/* Pay EMI Button */}
        <TouchableOpacity
          style={styles.payEMIButton}
          onPress={handlePayEMI}
          activeOpacity={0.8}
        >
          <Text style={styles.payEMIButtonText}>Pay EMI</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 320,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(135, 206, 250, 0.08)', // Light blue tint
    borderRadius: 20,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loanInfo: {
    flex: 1,
  },
  loanName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  emiProgress: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  amount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  dueDate: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  payEMIButton: {
    backgroundColor: Colors.textSecondary,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  payEMIButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
