/**
 * WalletView Component
 * 
 * Location: components/wallets/WalletView.tsx
 * Purpose: Display detailed wallet view with balance and history
 * 
 * Based on Wallet View.svg design
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import WalletCard from '../WalletCard';

interface Wallet {
  id: string;
  name: string;
  balance: number;
  currency?: string;
}

interface WalletViewProps {
  wallet: Wallet;
  onAddFunds?: () => void;
  onViewHistory?: () => void;
}

export default function WalletView({
  wallet,
  onAddFunds,
  onViewHistory,
}: WalletViewProps) {
  return (
    <ScrollView style={defaultStyles.containerFull} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={defaultStyles.headerLarge}>{wallet.name}</Text>
        <Text style={styles.walletBalance}>
          {wallet.currency || 'N$'} {wallet.balance.toLocaleString()}
        </Text>
      </View>

      <View style={styles.actions}>
        <View style={defaultStyles.pillButton}>
          <Text style={defaultStyles.buttonText} onPress={onAddFunds}>
            Add Funds
          </Text>
        </View>
        <View style={defaultStyles.buttonOutline}>
          <Text style={defaultStyles.buttonOutlineText} onPress={onViewHistory}>
            View History
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  walletBalance: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 12,
  },
  actions: {
    gap: 12,
  },
});
