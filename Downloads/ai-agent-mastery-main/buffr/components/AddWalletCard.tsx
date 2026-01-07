/**
 * AddWalletCard Component
 * 
 * Location: components/AddWalletCard.tsx
 * Purpose: Reusable "Add Wallet" button card
 * 
 * Displays add wallet button with plus icon
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

interface AddWalletCardProps {
  width?: number;
  onPress?: () => void;
}

export default function AddWalletCard({ width, onPress }: AddWalletCardProps) {
  return (
    <TouchableOpacity 
      style={[styles.addWalletCard, { width }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.addWalletContent}>
        <View style={styles.addWalletIcon}>
          <Text style={styles.addWalletIconText}>+</Text>
        </View>
        <Text style={styles.addWalletText}>Add Wallet</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  addWalletCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  addWalletContent: {
    alignItems: 'center',
    gap: 10,
  },
  addWalletIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addWalletIconText: {
    fontSize: 30,
    fontWeight: '300',
    color: Colors.primary,
    lineHeight: 34,
  },
  addWalletText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
});
