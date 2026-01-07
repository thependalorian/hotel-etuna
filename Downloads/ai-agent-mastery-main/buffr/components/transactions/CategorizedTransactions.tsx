/**
 * CategorizedTransactions Component
 * 
 * Location: components/transactions/CategorizedTransactions.tsx
 * Purpose: Display categorized transaction list with progress bars
 * 
 * Shows spending by category with icons, progress bars, and amounts
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

interface Category {
  id: string;
  name: string;
  icon: string;
  amount: number;
  progress: number; // 0-100
  color?: string;
}

interface CategorizedTransactionsProps {
  categories?: Category[];
  onCategoryPress?: (category: Category) => void;
  tabType?: 'balance' | 'earnings' | 'spendings';
}

const defaultCategories: Category[] = [
  {
    id: '1',
    name: 'Food & Beverages',
    icon: 'cutlery',
    amount: 120,
    progress: 60,
    color: '#FF6B6B',
  },
  {
    id: '2',
    name: 'Entertainment',
    icon: 'tv',
    amount: 120,
    progress: 40,
    color: '#9B59B6',
  },
  {
    id: '3',
    name: 'Travel',
    icon: 'plane',
    amount: 120,
    progress: 80,
    color: '#3498DB',
  },
  {
    id: '4',
    name: 'Bills & Utilities',
    icon: 'file-text-o',
    amount: 120,
    progress: 30,
    color: '#95A5A6',
  },
  {
    id: '5',
    name: 'Health & Fitness',
    icon: 'heart',
    amount: 120,
    progress: 50,
    color: '#E74C3C',
  },
];

export default function CategorizedTransactions({
  categories = defaultCategories,
  onCategoryPress,
  tabType = 'balance',
}: CategorizedTransactionsProps) {
  return (
    <View style={styles.container}>
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={styles.categoryItem}
          onPress={() => onCategoryPress?.(category)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: (category.color || Colors.primary) + '20' }]}>
            <FontAwesome
              name={category.icon as any}
              size={24}
              color={category.color || Colors.primary}
            />
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${category.progress}%`,
                      backgroundColor: category.color || Colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
          <Text style={styles.categoryAmount}>N$ {category.amount}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    gap: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
});
