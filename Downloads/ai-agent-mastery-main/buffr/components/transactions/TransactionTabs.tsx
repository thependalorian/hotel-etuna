/**
 * TransactionTabs Component
 * 
 * Location: components/transactions/TransactionTabs.tsx
 * Purpose: Tab switcher for Balance, Earnings, Spendings
 * 
 * Displays three tabs with active state indicator
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

interface TransactionTabsProps {
  activeTab: 'balance' | 'earnings' | 'spendings';
  onTabChange: (tab: 'balance' | 'earnings' | 'spendings') => void;
}

export default function TransactionTabs({
  activeTab,
  onTabChange,
}: TransactionTabsProps) {
  const tabs = [
    { id: 'balance' as const, label: 'Balance' },
    { id: 'earnings' as const, label: 'Earnings' },
    { id: 'spendings' as const, label: 'Spendings' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.tab}
          onPress={() => onTabChange(tab.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab.id && styles.tabTextActive,
            ]}
          >
            {tab.label}
          </Text>
          {activeTab === tab.id && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
});
