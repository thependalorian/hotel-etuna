/**
 * Loan Offer Details Screen
 * 
 * Location: app/loans/offers/[id].tsx
 * Purpose: Display detailed loan offer information with autopay configuration
 * 
 * Features:
 * - Glass effect card with loan details
 * - Loan amount, validity, and EMI period
 * - Auto Pay toggle
 * - Amount entry with increment/decrement buttons
 * - Get Loan button to redeem offer
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
// @ts-ignore - expo-blur types may not be available
import { BlurView } from 'expo-blur';
import { useLoans } from '@/contexts/LoansContext';
import Colors from '@/constants/Colors';
import { ScreenHeader, ToggleSwitch } from '@/components/common';
import { formatCurrency } from '@/utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LoanOfferDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { offers, getLoanById, calculateRepayment } = useLoans();
  const [offer, setOffer] = useState<any>(null);
  const [autoPayEnabled, setAutoPayEnabled] = useState(false);
  const [autopayAmount, setAutopayAmount] = useState('');

  useEffect(() => {
    if (id) {
      const foundOffer = offers.find((o) => o.id === id);
      if (foundOffer) {
        setOffer(foundOffer);
        // Set default autopay amount to a portion of the max amount
        const defaultAmount = Math.floor(foundOffer.maxAmount * 0.1);
        setAutopayAmount(defaultAmount.toString());
      }
    }
  }, [id, offers]);

  const handleBack = () => {
    router.back();
  };

  const handleIncrement = () => {
    if (!offer) return;
    const current = parseInt(autopayAmount) || 0;
    const max = offer.maxAmount;
    const newAmount = Math.min(current + 100, max);
    setAutopayAmount(newAmount.toString());
  };

  const handleDecrement = () => {
    const current = parseInt(autopayAmount) || 0;
    const newAmount = Math.max(current - 100, 0);
    setAutopayAmount(newAmount.toString());
  };

  const handleGetLoan = () => {
    // Navigate to loan creation screen (icon + name)
    // @ts-ignore - Dynamic route
    router.push({
      pathname: '/loans/create',
      params: { offerId: id, amount: autopayAmount || offer?.maxAmount.toString() },
    });
  };


  if (!offer) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Loan Offer" onBack={handleBack} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading offer...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader title="Loan Offer" onBack={handleBack} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Glass Effect Card */}
        <View style={styles.cardContainer}>
          <BlurView intensity={80} tint="light" style={styles.glassCard}>
            {/* Gradient overlay for blue to green effect */}
            <View style={styles.gradientOverlay} />
            <View style={styles.gradientOverlayGreen} />
            
            {/* Content Container */}
            <View style={styles.cardContent}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <View style={styles.logoZigzag}>
                  <View style={[styles.zigzagLine, styles.zigzagLine1]} />
                  <View style={[styles.zigzagLine, styles.zigzagLine2]} />
                </View>
              </View>
            </View>

            {/* Loan Amount */}
            <Text style={styles.amount}>{formatCurrency(offer.maxAmount)}</Text>

            {/* Details Row: Validity and Total EMI */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailValue}>1 Week</Text>
                <Text style={styles.detailLabel}>Validity</Text>
              </View>
              <View style={styles.detailSeparator} />
              <View style={styles.detailItem}>
                <Text style={styles.detailValue}>{offer.maxRepaymentPeriod} months</Text>
                <Text style={styles.detailLabel}>Total EMI</Text>
              </View>
            </View>

            {/* Auto Pay Toggle */}
            <View style={styles.autopaySection}>
              <Text style={styles.autopayLabel}>Auto Pay</Text>
              <ToggleSwitch
                value={autoPayEnabled}
                onValueChange={setAutoPayEnabled}
              />
            </View>

            {/* Amount Entry for Autopay */}
            {autoPayEnabled && (
              <View style={styles.amountEntrySection}>
                <View style={styles.amountEntryContainer}>
                  <TouchableOpacity
                    style={styles.amountButton}
                    onPress={handleDecrement}
                    activeOpacity={0.7}
                  >
                    <FontAwesome name="minus" size={16} color={Colors.text} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="Less the amount"
                    placeholderTextColor={Colors.textSecondary}
                    value={autopayAmount}
                    onChangeText={setAutopayAmount}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={styles.amountButton}
                    onPress={handleIncrement}
                    activeOpacity={0.7}
                  >
                    <FontAwesome name="plus" size={16} color={Colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Get Loan Button */}
            <TouchableOpacity
              style={styles.getLoanButton}
              onPress={handleGetLoan}
              activeOpacity={0.8}
            >
              <Text style={styles.getLoanButtonText}>Get Loan</Text>
            </TouchableOpacity>
            </View>
          </BlurView>
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
    padding: 20,
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  cardContainer: {
    width: '100%',
    maxWidth: SCREEN_WIDTH - 40,
    position: 'relative',
  },
  cardContent: {
    width: '100%',
    alignItems: 'center',
    zIndex: 1,
    position: 'relative',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: '50%',
    bottom: 0,
    borderRadius: 24,
    // Light blue gradient from left
    backgroundColor: 'rgba(135, 206, 250, 0.25)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  gradientOverlayGreen: {
    position: 'absolute',
    top: 0,
    left: '50%',
    right: 0,
    bottom: 0,
    borderRadius: 24,
    // Light green/teal gradient from right
    backgroundColor: 'rgba(144, 238, 144, 0.2)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  glassCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    // Gradient background effect - light blue to light green/teal
    overflow: 'hidden',
    position: 'relative',
    minHeight: 520,
    // Add subtle gradient overlay
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 60,
    height: 60,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoZigzag: {
    width: 40,
    height: 40,
    position: 'relative',
  },
  zigzagLine: {
    position: 'absolute',
    backgroundColor: Colors.white,
    width: 3,
  },
  zigzagLine1: {
    height: 30,
    left: 12,
    top: 5,
    transform: [{ rotate: '45deg' }],
  },
  zigzagLine2: {
    height: 30,
    right: 12,
    top: 5,
    transform: [{ rotate: '-45deg' }],
  },
  amount: {
    fontSize: 42,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 40,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
    paddingHorizontal: 12,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  detailSeparator: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  autopaySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  autopayLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  amountEntrySection: {
    width: '100%',
    marginBottom: 32,
  },
  amountEntryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 248, 248, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    height: 56,
    gap: 8,
  },
  amountButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  amountInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
    paddingVertical: 0,
    paddingHorizontal: 12,
  },
  getLoanButton: {
    backgroundColor: Colors.text,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  getLoanButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
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
});
