/**
 * CardFrame Component
 * 
 * Location: components/cards/CardFrame.tsx
 * Purpose: Display card with customizable frame design
 * 
 * Based on Buffr Card Design frames (Frame 2-32)
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Colors from '@/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = (CARD_WIDTH * 9) / 16; // Standard card aspect ratio

interface CardFrameProps {
  frameNumber?: number; // Frame design number (2-32)
  cardNumber?: string;
  cardholderName?: string;
  expiryDate?: string;
  cvv?: string;
  network?: 'visa' | 'mastercard' | 'buffr';
}

export default function CardFrame({
  frameNumber = 2,
  cardNumber = '1234 5678 9012 3456',
  cardholderName = 'CARDHOLDER NAME',
  expiryDate = '12/25',
  cvv,
  network = 'buffr',
}: CardFrameProps) {
  // For now, we'll use a styled View. In production, you'd load the actual SVG frames
  const getFrameStyle = () => {
    // Different frame designs can have different gradient/color schemes
    const frameStyles: { [key: number]: any } = {
      2: { backgroundColor: Colors.primary, opacity: 0.9 },
      3: { backgroundColor: Colors.primaryDark, opacity: 0.9 },
      6: { backgroundColor: Colors.primaryLight, opacity: 0.8 },
      // Add more frame styles as needed
    };
    return frameStyles[frameNumber] || frameStyles[2];
  };

  const maskCardNumber = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.length <= 4) return number;
    const last4 = cleaned.slice(-4);
    return `•••• •••• •••• ${last4}`;
  };

  return (
    <View style={[styles.cardContainer, getFrameStyle()]}>
      <View style={styles.cardContent}>
        {/* Network Logo */}
        <View style={styles.networkLogo}>
          {network === 'visa' && (
            <Text style={styles.networkText}>VISA</Text>
          )}
          {network === 'mastercard' && (
            <Text style={styles.networkText}>MC</Text>
          )}
          {network === 'buffr' && (
            <Text style={styles.buffrLogo}>BUFFR</Text>
          )}
        </View>

        {/* Card Number */}
        <View style={styles.cardNumberContainer}>
          <Text style={styles.cardNumber}>{maskCardNumber(cardNumber)}</Text>
        </View>

        {/* Cardholder and Expiry */}
        <View style={styles.cardFooter}>
          <View style={styles.cardholderContainer}>
            <Text style={styles.cardholderLabel}>CARDHOLDER</Text>
            <Text style={styles.cardholderName}>{cardholderName}</Text>
          </View>
          <View style={styles.expiryContainer}>
            <Text style={styles.expiryLabel}>EXPIRES</Text>
            <Text style={styles.expiryDate}>{expiryDate}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: Colors.dark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  networkLogo: {
    alignSelf: 'flex-end',
  },
  networkText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 2,
  },
  buffrLogo: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 3,
  },
  cardNumberContainer: {
    marginVertical: 20,
  },
  cardNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.white,
    letterSpacing: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardholderContainer: {
    flex: 1,
  },
  cardholderLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.white,
    opacity: 0.8,
    marginBottom: 4,
  },
  cardholderName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    textTransform: 'uppercase',
  },
  expiryContainer: {
    alignItems: 'flex-end',
  },
  expiryLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.white,
    opacity: 0.8,
    marginBottom: 4,
  },
  expiryDate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
});
