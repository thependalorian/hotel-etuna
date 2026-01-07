/**
 * Wallet Selector Component
 * 
 * Location: components/wallets/WalletSelector.tsx
 * Purpose: Select a wallet for transactions
 * 
 * Allows users to choose which wallet to use for payments, transfers, etc.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useWallets, Wallet } from '@/contexts/WalletsContext';
import WalletCard from '@/components/WalletCard';
import Colors from '@/constants/Colors';

interface WalletSelectorProps {
  selectedWalletId?: string;
  onWalletSelect: (wallet: Wallet) => void;
  showBalance?: boolean;
}

export default function WalletSelector({
  selectedWalletId,
  onWalletSelect,
  showBalance = true,
}: WalletSelectorProps) {
  const { wallets } = useWallets();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Wallet</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.walletsList}
      >
        {wallets.map((wallet) => (
          <TouchableOpacity
            key={wallet.id}
            style={[
              styles.walletOption,
              selectedWalletId === wallet.id && styles.walletOptionSelected,
            ]}
            onPress={() => onWalletSelect(wallet)}
          >
            <WalletCard
              name={wallet.name}
              balance={showBalance ? wallet.balance : 'XXX'}
              currency={wallet.currency || 'N$'}
              icon="credit-card"
              width={200}
            />
            {selectedWalletId === wallet.id && (
              <View style={styles.selectedBadge}>
                <FontAwesome name="check-circle" size={24} color={Colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  walletsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  walletOption: {
    position: 'relative',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  walletOptionSelected: {
    borderColor: Colors.primary,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.white,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
