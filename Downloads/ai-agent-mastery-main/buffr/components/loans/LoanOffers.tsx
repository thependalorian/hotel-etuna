/**
 * LoanOffers Component
 * 
 * Location: components/loans/LoanOffers.tsx
 * Purpose: Display available loan offers
 * 
 * Based on Loan Offers.svg design
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';

interface LoanOffer {
  id: string;
  amount: number;
  interestRate: number;
  duration: number; // in months
  monthlyPayment: number;
  provider: string;
}

interface LoanOffersProps {
  offers: LoanOffer[];
  onSelectOffer?: (offer: LoanOffer) => void;
}

export default function LoanOffers({ offers, onSelectOffer }: LoanOffersProps) {
  return (
    <View style={defaultStyles.containerFull}>
      <View style={styles.header}>
        <Text style={defaultStyles.headerMedium}>Available Loan Offers</Text>
        <Text style={defaultStyles.descriptionText}>
          Choose the loan that best fits your needs
        </Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {offers.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="money" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No loan offers available</Text>
          </View>
        ) : (
          offers.map((offer) => (
            <TouchableOpacity
              key={offer.id}
              style={styles.offerCard}
              onPress={() => onSelectOffer?.(offer)}
            >
              <View style={styles.offerHeader}>
                <View>
                  <Text style={styles.offerAmount}>N$ {offer.amount.toLocaleString()}</Text>
                  <Text style={styles.offerProvider}>{offer.provider}</Text>
                </View>
                <FontAwesome name="chevron-right" size={20} color={Colors.textSecondary} />
              </View>

              <View style={styles.offerDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Interest Rate</Text>
                  <Text style={styles.detailValue}>{offer.interestRate}%</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>{offer.duration} months</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Monthly Payment</Text>
                  <Text style={styles.detailValue}>
                    N$ {offer.monthlyPayment.toLocaleString()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  offerCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  offerAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  offerProvider: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  offerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
});
