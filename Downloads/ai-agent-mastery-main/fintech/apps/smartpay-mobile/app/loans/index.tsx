import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/constants/designSystem';

export default function LoansScreen() {
  const loanOffers = [
    { id: '1', amount: 500, term: 1, rate: 5 },
    { id: '2', amount: 1000, term: 3, rate: 4.5 },
    { id: '3', amount: 2000, term: 6, rate: 4 },
  ];

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={designSystem.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Loans</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Loan Offers</Text>
            {loanOffers.map(offer => (
              <TouchableOpacity key={offer.id} style={styles.loanCard}>
                <View style={styles.loanHeader}>
                  <Text style={styles.loanAmount}>N${offer.amount}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{offer.rate}% APR</Text>
                  </View>
                </View>
                <View style={styles.loanDetails}>
                  <View style={styles.loanDetail}>
                    <Ionicons name="calendar-outline" size={16} color={designSystem.colors.textSecondary} />
                    <Text style={styles.loanDetailText}>{offer.term} month{offer.term > 1 ? 's' : ''}</Text>
                  </View>
                  <View style={styles.loanDetail}>
                    <Ionicons name="cash-outline" size={16} color={designSystem.colors.textSecondary} />
                    <Text style={styles.loanDetailText}>
                      ~N${(offer.amount / offer.term).toFixed(0)}/month
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.applyButton}>
                  <Text style={styles.applyButtonText}>Apply Now</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: designSystem.colors.background },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: designSystem.spacing.smartpay.horizontalPadding,
    paddingVertical: designSystem.spacing.md,
    backgroundColor: designSystem.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: designSystem.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...designSystem.typography.textStyles.titleSm,
    color: designSystem.colors.text,
  },
  scrollView: { flex: 1 },
  section: {
    paddingHorizontal: designSystem.spacing.smartpay.horizontalPadding,
    paddingVertical: designSystem.spacing.lg,
  },
  sectionTitle: {
    ...designSystem.typography.textStyles.titleSm,
    color: designSystem.colors.text,
    marginBottom: designSystem.spacing.md,
  },
  loanCard: {
    backgroundColor: designSystem.colors.surface,
    padding: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.md,
    marginBottom: designSystem.spacing.md,
    ...designSystem.shadows.sm,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designSystem.spacing.md,
  },
  loanAmount: {
    ...designSystem.typography.textStyles.titleLg,
    color: designSystem.colors.text,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
  },
  badgeText: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.success,
    fontWeight: '700',
  },
  loanDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: designSystem.spacing.md,
  },
  loanDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loanDetailText: {
    ...designSystem.typography.textStyles.bodySm,
    color: designSystem.colors.textSecondary,
  },
  applyButton: {
    height: 44,
    backgroundColor: designSystem.colors.primary,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    ...designSystem.typography.textStyles.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
