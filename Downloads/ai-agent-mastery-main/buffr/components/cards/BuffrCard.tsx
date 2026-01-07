/**
 * BuffrCard Component
 * 
 * Location: components/cards/BuffrCard.tsx
 * Purpose: Display the main Buffr Card (digital wallet card)
 * 
 * Shows Buffr Card with card number, expiry, and view option
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

interface BuffrCardProps {
  cardNumber?: string; // Last 4 digits or masked number
  onViewPress?: () => void;
  frameDesign?: string; // Frame design identifier
}

export default function BuffrCard({
  cardNumber = '...018',
  onViewPress,
  frameDesign,
}: BuffrCardProps) {
  return (
    <View style={styles.cardSectionWrapper}>
      <View style={styles.gradientBlob} />
      <View style={styles.cardSection}>
        <View style={styles.cardContainer}>
          {/* Card Preview */}
          <View style={styles.cardPreview}>
            <View style={styles.cardVisual}>
              <View style={styles.cardGradient} />
            </View>
          </View>
          
          {/* Card Info */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Buffr Card</Text>
            <Text style={styles.cardNumber}>{cardNumber}</Text>
          </View>
          
          <TouchableOpacity onPress={onViewPress}>
            <Text style={styles.viewLink}>View {'>'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardSectionWrapper: {
    position: 'relative',
    marginBottom: 40,
    marginTop: 8,
    overflow: 'visible',
  },
  gradientBlob: {
    position: 'absolute',
    bottom: -40,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primaryLight,
    opacity: 0.15,
    zIndex: 0,
  },
  cardSection: {
    paddingHorizontal: 20,
    position: 'relative',
    zIndex: 1,
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
  },
  cardPreview: {
    width: 56,
    height: 36,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardVisual: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  cardGradient: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    opacity: 0.8,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  cardNumber: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  viewLink: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
});
