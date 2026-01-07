/**
 * WalletHistory Component
 * 
 * Location: components/wallets/WalletHistory.tsx
 * Purpose: Display wallet transaction history
 * 
 * Based on Wallet History (Added).svg and Wallet History (Spendings).svg
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';

interface Transaction {
  id: string;
  type: 'added' | 'spent' | 'transfer_in' | 'transfer_out';
  amount: number;
  description: string;
  date: Date;
  currency?: string;
}

interface WalletHistoryProps {
  transactions: Transaction[];
  walletName?: string;
}

export default function WalletHistory({
  transactions,
  walletName,
}: WalletHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'added' | 'spent'>('all');

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true;
    if (filter === 'added') return tx.type === 'added' || tx.type === 'transfer_in';
    if (filter === 'spent') return tx.type === 'spent' || tx.type === 'transfer_out';
    return true;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'added':
      case 'transfer_in':
        return 'arrow-down';
      case 'spent':
      case 'transfer_out':
        return 'arrow-up';
      default:
        return 'exchange';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'added':
      case 'transfer_in':
        return Colors.success;
      case 'spent':
      case 'transfer_out':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={defaultStyles.containerFull}>
      {walletName && (
        <View style={styles.header}>
          <Text style={defaultStyles.headerMedium}>{walletName} History</Text>
        </View>
      )}

      {/* Filter Buttons */}
      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'all' && styles.filterTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'added' && styles.filterButtonActive]}
          onPress={() => setFilter('added')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'added' && styles.filterTextActive,
            ]}
          >
            Added
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'spent' && styles.filterButtonActive]}
          onPress={() => setFilter('spent')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'spent' && styles.filterTextActive,
            ]}
          >
            Spent
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="history" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: getTransactionColor(transaction.type) + '20' },
                ]}
              >
                <FontAwesome
                  name={getTransactionIcon(transaction.type)}
                  size={20}
                  color={getTransactionColor(transaction.type)}
                />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionDescription}>
                  {transaction.description}
                </Text>
                <Text style={styles.transactionDate}>
                  {formatDate(transaction.date)}
                </Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: getTransactionColor(transaction.type) },
                ]}
              >
                {transaction.type === 'spent' || transaction.type === 'transfer_out'
                  ? '-'
                  : '+'}
                {transaction.currency || 'N$'}{' '}
                {Math.abs(transaction.amount).toLocaleString()}
              </Text>
            </View>
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
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundGray,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  filterTextActive: {
    color: Colors.white,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    gap: 4,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
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
