/**
 * Loan Offer Carousel Component
 * 
 * Location: components/loans/LoanOfferCarousel.tsx
 * Purpose: Horizontal carousel of loan offer cards with swipe functionality
 * 
 * Features:
 * - Swipeable carousel with blurred edge cards visible on sides
 * - View Details button on each card
 * - Card design with logo, amount, validity, repayment period
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { LoanOffer } from '@/contexts/LoansContext';
import Colors from '@/constants/Colors';
import { formatCurrency } from '@/utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_SPACING = 16;

interface LoanOfferCarouselProps {
  offers: LoanOffer[];
  onViewDetails: (offer: LoanOffer) => void;
}

export default function LoanOfferCarousel({ offers, onViewDetails }: LoanOfferCarouselProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_SPACING));
    setCurrentIndex(index);
  };


  if (offers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No loan offers available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {offers.map((offer, index) => {
          const isActive = index === currentIndex;
          const distance = Math.abs(index - currentIndex);

          return (
            <View
              key={offer.id}
              style={[
                styles.cardWrapper,
                {
                  width: CARD_WIDTH,
                  marginRight: index === offers.length - 1 ? CARD_SPACING : 0,
                },
              ]}
            >
              {/* Main card */}
              <View
                style={[
                  styles.card,
                  isActive && styles.activeCard,
                  distance === 1 && styles.adjacentCard,
                  distance > 1 && styles.distantCard,
                ]}
              >
                {/* Logo - Blue and white zigzag */}
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

                {/* Details Row */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>1 Week validity</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{offer.maxRepaymentPeriod} Months</Text>
                  </View>
                </View>

                {/* View Details Button */}
                <TouchableOpacity
                  style={styles.viewDetailsButton}
                  onPress={() => onViewDetails(offer)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <View style={styles.sliderHandle} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Pagination Indicators */}
      {offers.length > 1 && (
        <View style={styles.pagination}>
          {offers.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2,
  },
  cardWrapper: {
    marginHorizontal: CARD_SPACING / 2,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    minHeight: 280,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  activeCard: {
    opacity: 1,
    transform: [{ scale: 1 }],
  },
  adjacentCard: {
    opacity: 0.4,
    transform: [{ scale: 0.9 }],
  },
  distantCard: {
    opacity: 0.2,
    transform: [{ scale: 0.85 }],
  },
  logoContainer: {
    marginBottom: 20,
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
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 24,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  viewDetailsButton: {
    backgroundColor: Colors.text,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  viewDetailsText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  sliderHandle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginLeft: 12,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
