/**
 * Transactions Screen
 * 
 * Location: app/(tabs)/transactions.tsx
 * Purpose: Display user transaction history with tabs, chart, budget, and categorized transactions
 * 
 * Based on Buffr App Design - Transactions screen
 * Features:
 * - Header with search bar, notification bell, and profile photo
 * - Three tabs: Balance, Earnings, Spendings
 * - Transaction chart with weekly filters
 * - Budget progress bar
 * - Categorized transactions list
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SearchBar } from '@/components';
import TransactionTabs from '@/components/transactions/TransactionTabs';
import TransactionChart from '@/components/transactions/TransactionChart';
import BudgetProgressBar from '@/components/transactions/BudgetProgressBar';
import CategorizedTransactions from '@/components/transactions/CategorizedTransactions';
import { useTransactions } from '@/contexts/TransactionsContext';
import {
  calculateBalance,
  calculateEarnings,
  calculateSpendings,
  generateChartData,
  getCategorizedSpendings,
  calculateBudgetProgress,
  type TabType,
  type WeekFilter,
} from '@/utils/transactionHelpers';
import Colors from '@/constants/Colors';

export default function TransactionsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('balance');
  const [weekFilter, setWeekFilter] = useState<WeekFilter>('thisWeek');
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [refreshing, setRefreshing] = useState(false);
  const {
    transactions,
    loading,
    fetchTransactions,
    refreshTransactions,
  } = useTransactions();

  // Fetch transactions on mount
  useEffect(() => {
    if (transactions.length === 0) {
      fetchTransactions();
    }
  }, []);

  // Handle pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshTransactions();
    setRefreshing(false);
  }, [refreshTransactions]);

  const handleNotificationPress = () => {
    // Navigate to notifications
    console.log('Notifications pressed');
  };

  const handleProfilePress = () => {
    // Navigate to profile
    console.log('Profile pressed');
  };

  const handleSearchChange = (text: string) => {
    // Handle search
    console.log('Search:', text);
  };

  const handleCategoryPress = useCallback((category: any) => {
    // Navigate to category transactions screen
    // @ts-ignore - Dynamic route not yet in TypeScript types
    router.push({
      pathname: '/transactions/category/[categoryId]',
      params: { categoryId: category.id },
    });
  }, [router]);

  // Calculate totals based on active tab
  const totalAmount = useMemo(() => {
    if (activeTab === 'balance') {
      return calculateBalance(transactions);
    } else if (activeTab === 'earnings') {
      return calculateEarnings(transactions);
    } else {
      return calculateSpendings(transactions);
    }
  }, [transactions, activeTab]);


  // Get categorized data based on tab
  const categorizedData = useMemo(() => {
    return getCategorizedSpendings(transactions, activeTab);
  }, [transactions, activeTab]);

  // Calculate budget progress
  const budgetProgress = useMemo(() => {
    return calculateBudgetProgress(transactions, activeTab);
  }, [transactions, activeTab]);

  // Generate chart labels based on selected period
  const chartLabels = useMemo(() => {
    if (selectedPeriod === 'weekly') {
      const today = new Date();
      const labels: string[] = [];
      for (let i = 4; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.getDate().toString());
      }
      return labels;
    } else if (selectedPeriod === 'monthly') {
      return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    } else {
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    }
  }, [selectedPeriod]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <SearchBar
            placeholder="Search anything..."
            onSearchChange={handleSearchChange}
            onNotificationPress={handleNotificationPress}
            onProfilePress={handleProfilePress}
          />
        </View>

        {/* Tabs Section */}
        <View style={styles.tabsSection}>
          <TransactionTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          <TransactionChart
            thisWeekData={generateChartData(transactions, activeTab, 'thisWeek')}
            lastWeekData={generateChartData(transactions, activeTab, 'lastWeek')}
            labels={chartLabels}
            balance={totalAmount}
            tabType={activeTab}
            onPeriodChange={setSelectedPeriod}
            selectedWeekFilter={weekFilter}
            onWeekFilterChange={setWeekFilter}
          />
        </View>

        {/* Budget Progress Bar */}
        <View style={styles.budgetSection}>
          <BudgetProgressBar
            percentage={budgetProgress.percentage}
            amount={budgetProgress.amount}
            tabType={activeTab}
          />
        </View>

        {/* Categorized Transactions */}
        <View style={styles.categoriesSection}>
          <CategorizedTransactions
            categories={categorizedData}
            onCategoryPress={handleCategoryPress}
            tabType={activeTab}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  tabsSection: {
    marginBottom: 20,
  },
  chartSection: {
    marginBottom: 16,
  },
  budgetSection: {
    marginBottom: 16,
  },
  categoriesSection: {
    marginBottom: 20,
  },
});
