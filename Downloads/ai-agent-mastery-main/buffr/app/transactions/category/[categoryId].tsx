/**
 * Category Transactions Screen
 * 
 * Location: app/transactions/category/[categoryId].tsx
 * Purpose: Display all transactions for a specific category
 * 
 * Shows filtered transaction list for a category, then navigates to receipt on tap
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { TransactionList } from '@/components/transactions';
import { useTransactions, Transaction } from '@/contexts/TransactionsContext';
import Colors from '@/constants/Colors';

// Category mapping
const CATEGORY_MAP: { [key: string]: { name: string; icon: string; color: string } } = {
  '1': { name: 'Food & Beverages', icon: 'cutlery', color: '#FF6B6B' },
  '2': { name: 'Entertainment', icon: 'tv', color: '#9B59B6' },
  '3': { name: 'Travel', icon: 'plane', color: '#3498DB' },
  '4': { name: 'Bills & Utilities', icon: 'file-text-o', color: '#95A3B8' },
  '5': { name: 'Health & Fitness', icon: 'heart', color: '#E74C3C' },
  '6': { name: 'Salary', icon: 'briefcase', color: '#10B981' },
  '7': { name: 'Freelance', icon: 'laptop', color: '#3B82F6' },
  '8': { name: 'Investments', icon: 'line-chart', color: '#8B5CF6' },
  '9': { name: 'Gifts', icon: 'gift', color: '#F59E0B' },
  '10': { name: 'Other Income', icon: 'money', color: '#6366F1' },
};

export default function CategoryTransactionsScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const router = useRouter();
  const { transactions, getTransactionById } = useTransactions();

  // Get category info
  const category = useMemo(() => {
    return categoryId ? CATEGORY_MAP[categoryId] : null;
  }, [categoryId]);

  // Filter transactions by category
  // Use actual category field from transactions
  const categoryTransactions = useMemo(() => {
    if (!category || !categoryId) return [];

    // Filter transactions that match this category ID
    // Only include transactions that have a category field matching the selected category
    return transactions.filter((tx) => {
      // Skip transfers (internal movements don't have categories)
      if (tx.type === 'transfer') return false;
      
      // Match by category ID
      return tx.category === categoryId;
    });
  }, [transactions, categoryId, category]);

  // Handle transaction press - navigate to receipt
  const handleTransactionPress = (transaction: Transaction) => {
    router.push({
      pathname: '/transactions/[id]',
      params: { id: transaction.id },
    });
  };

  if (!category) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Category not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
            <FontAwesome
              name={category.icon as any}
              size={24}
              color={category.color}
            />
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryTitle}>{category.name}</Text>
            <Text style={styles.transactionCount}>
              {categoryTransactions.length} transactions
            </Text>
          </View>
        </View>
      </View>

      {/* Transaction List */}
      <TransactionList
        transactions={categoryTransactions}
        onTransactionPress={handleTransactionPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
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
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    gap: 4,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  transactionCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
});
