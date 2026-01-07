/**
 * Loans Offers Screen
 * 
 * Location: app/(tabs)/loans.tsx
 * Purpose: Display loan offers in a carousel with glass effect header
 * 
 * Based on: BuffrPay/WIREFRAMES/06_LOAN_FLOWS.md
 * Design: Shows carousel of loan offers that users can swipe through
 * User can tap "View Details" to see offer details
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useLoans, LoanOffer, Loan } from '@/contexts/LoansContext';
import Colors from '@/constants/Colors';
import GlassHeader from '@/components/GlassHeader';
import LoanOfferCarousel from '@/components/loans/LoanOfferCarousel';
import ActiveLoansCarousel from '@/components/loans/ActiveLoansCarousel';

export default function LoansScreen() {
  const router = useRouter();
  const {
    loans,
    offers,
    loading,
    fetchLoans,
    fetchOffers,
    refreshLoans,
  } = useLoans();

  // Fetch data on mount
  useEffect(() => {
    fetchLoans();
    fetchOffers();
  }, [fetchLoans, fetchOffers]);

  // Refresh offers when screen comes into focus (e.g., when navigating back)
  useFocusEffect(
    useCallback(() => {
      // Refresh offers to show updated carousel when returning from loan details
      fetchOffers();
      fetchLoans(); // Also refresh loans to update active loans section
    }, [fetchOffers, fetchLoans])
  );

  const handleViewDetails = (offer: LoanOffer) => {
    // @ts-ignore - Dynamic route not yet in TypeScript types
    router.push({
      pathname: '/loans/offers/[id]',
      params: { id: offer.id },
    });
  };

  const handleLoanPress = (loan: Loan) => {
    // @ts-ignore - Dynamic route not yet in TypeScript types
    router.push({
      pathname: '/loans/[id]',
      params: { id: loan.id },
    });
  };

  const handlePayEMI = (loan: Loan) => {
    // Navigate to loan details screen where user can pay EMI
    // @ts-ignore - Dynamic route not yet in TypeScript types
    router.push({
      pathname: '/loans/[id]',
      params: { id: loan.id },
    });
  };

  const handleNotificationPress = () => {
    // Navigate to notifications
    console.log('Notifications pressed');
  };

  const handleProfilePress = () => {
    // Navigate to profile
    console.log('Profile pressed');
  };

  const handleSearchChange = (text: string) => {
    // Handle search
    console.log('Search:', text);
  };

  return (
    <View style={styles.container}>
      {/* Glass Effect Header */}
      <GlassHeader
        placeholder="Search anything..."
        onSearchChange={handleSearchChange}
        onNotificationPress={handleNotificationPress}
        onProfilePress={handleProfilePress}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshLoans} tintColor={Colors.primary} />
        }
      >
        {/* Active Loans Section */}
        <ActiveLoansCarousel
          loans={loans}
          onLoanPress={handleLoanPress}
          onPayEMI={handlePayEMI}
        />

        {/* Title */}
        <Text style={styles.title}>Loans offers</Text>

        {/* Loan Offers Carousel */}
        <View style={styles.carouselContainer}>
          <LoanOfferCarousel offers={offers} onViewDetails={handleViewDetails} />
        </View>
      </ScrollView>
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 32,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  carouselContainer: {
    width: '100%',
    minHeight: 350,
  },
});
