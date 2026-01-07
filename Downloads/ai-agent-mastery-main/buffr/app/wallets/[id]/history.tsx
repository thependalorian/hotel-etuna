/**
 * Wallet History Screen
 * 
 * Location: app/wallets/[id]/history.tsx
 * Purpose: Display wallet transaction history with filters
 * 
 * Based on Wallet History (Added).svg and Wallet History (Spendings).svg
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useWallets } from '@/contexts/WalletsContext';
import { WalletHistory } from '@/components/wallets';
import Colors from '@/constants/Colors';

export default function WalletHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getWalletById, getWalletTransactions, refreshWallets, loading } = useWallets();

  const wallet = useMemo(() => {
    return id ? getWalletById(id) : null;
  }, [id, getWalletById]);

  const transactions = useMemo(() => {
    if (!id) return [];
    const walletTransactions = getWalletTransactions(id);
    // Convert to WalletHistory component format
    return walletTransactions.map((tx) => ({
      id: tx.id,
      type: tx.type as 'added' | 'spent' | 'transfer_in' | 'transfer_out',
      amount: tx.amount,
      description: tx.description,
      date: tx.date,
      currency: tx.currency || 'N$',
    }));
  }, [id, getWalletTransactions]);

  useEffect(() => {
    if (id && !wallet) {
      refreshWallets();
    }
  }, [id, wallet, refreshWallets]);

  const handleRefresh = async () => {
    await refreshWallets();
  };

  if (!wallet) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <ErrorState
          title="Wallet not found"
          message="The wallet you're looking for doesn't exist or has been deleted."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Wallet History Component */}
      <WalletHistory transactions={transactions} walletName={wallet.name} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  placeholder: {
    width: 44,
  },
});
