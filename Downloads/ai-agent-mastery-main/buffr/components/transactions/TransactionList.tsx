/**
 * TransactionList Component
 * 
 * Location: components/transactions/TransactionList.tsx
 * Purpose: Display list of transactions with filtering
 * 
 * Based on Transaction History.svg design
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

interface Transaction {
  id: string;
  type: 'sent' | 'received' | 'payment' | 'transfer' | 'request';
  amount: number;
  description: string;
  date: Date;
  recipient?: string;
  status: 'completed' | 'pending' | 'failed';
}

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionPress?: (transaction: Transaction) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export default function TransactionList({
  transactions,
  onTransactionPress,
  refreshing = false,
  onRefresh,
}: TransactionListProps) {
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true;
    if (filter === 'sent') return tx.type === 'sent' || tx.type === 'transfer';
    if (filter === 'received') return tx.type === 'received' || tx.type === 'payment';
    return true;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sent':
      case 'transfer':
        return 'arrow-up';
      case 'received':
      case 'payment':
        return 'arrow-down';
      case 'request':
        return 'hand-paper-o';
      default:
        return 'exchange';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'sent':
      case 'transfer':
        return Colors.error;
      case 'received':
      case 'payment':
        return Colors.success;
      default:
        return Colors.textSecondary;
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  const groupByDate = (transactions: Transaction[]) => {
    const groups: { [key: string]: Transaction[] } = {};
    transactions.forEach((tx) => {
      const dateKey = formatDate(tx.date);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(tx);
    });
    return groups;
  };

  const groupedTransactions = groupByDate(filteredTransactions);

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[styles.filterText, filter === 'all' && styles.filterTextActive]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'sent' && styles.filterButtonActive]}
          onPress={() => setFilter('sent')}
        >
          <Text
            style={[styles.filterText, filter === 'sent' && styles.filterTextActive]}
          >
            Sent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'received' && styles.filterButtonActive]}
          onPress={() => setFilter('received')}
        >
          <Text
            style={[styles.filterText, filter === 'received' && styles.filterTextActive]}
          >
            Received
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          ) : undefined
        }
      >
        {Object.keys(groupedTransactions).length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="history" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        ) : (
          Object.keys(groupedTransactions).map((dateKey) => (
            <View key={dateKey} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{dateKey}</Text>
              {groupedTransactions[dateKey].map((transaction) => (
                <TouchableOpacity
                  key={transaction.id}
                  style={styles.transactionItem}
                  onPress={() => onTransactionPress?.(transaction)}
                >
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
                    {transaction.recipient && (
                      <Text style={styles.transactionRecipient}>
                        {transaction.recipient}
                      </Text>
                    )}
                  </View>
                  <View style={styles.transactionAmountContainer}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        { color: getTransactionColor(transaction.type) },
                      ]}
                    >
                      {transaction.type === 'sent' || transaction.type === 'transfer'
                        ? '-'
                        : '+'}
                      N$ {Math.abs(transaction.amount).toLocaleString()}
                    </Text>
                    {transaction.status === 'pending' && (
                      <Text style={styles.pendingBadge}>Pending</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
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
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
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
  transactionRecipient: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  pendingBadge: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.warning,
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
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
