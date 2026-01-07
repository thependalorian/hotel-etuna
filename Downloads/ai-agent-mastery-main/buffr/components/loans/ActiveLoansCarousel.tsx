/**
 * Active Loans Carousel Component
 * 
 * Location: components/loans/ActiveLoansCarousel.tsx
 * Purpose: Horizontal scrollable carousel of active loans
 * 
 * Features:
 * - Horizontal scrolling list of active loan cards
 * - Navigation to loan details on card press
 * - Pay EMI functionality
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Loan } from '@/contexts/LoansContext';
import Colors from '@/constants/Colors';
import ActiveLoanCard from './ActiveLoanCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ActiveLoansCarouselProps {
  loans: Loan[];
  onLoanPress?: (loan: Loan) => void;
  onPayEMI?: (loan: Loan) => void;
}

export default function ActiveLoansCarousel({
  loans,
  onLoanPress,
  onPayEMI,
}: ActiveLoansCarouselProps) {
  // Filter only active/starting loans
  const activeLoans = loans.filter(
    (loan) => loan.status === 'active' || loan.status === 'starting'
  );

  if (activeLoans.length === 0) {
    return null; // Don't show section if no active loans
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Loans activity</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {activeLoans.map((loan) => (
          <ActiveLoanCard
            key={loan.id}
            loan={loan}
            onPress={() => onLoanPress?.(loan)}
            onPayEMI={() => onPayEMI?.(loan)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  scrollView: {
    marginHorizontal: -20, // Offset container padding for edge-to-edge cards
  },
  scrollContent: {
    paddingHorizontal: 20, // Restore padding for first/last cards
    paddingRight: 4, // Extra padding on right for last card
  },
});
