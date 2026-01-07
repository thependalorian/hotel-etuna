/**
 * Transaction Helper Functions
 * 
 * Location: utils/transactionHelpers.ts
 * Purpose: Utility functions for calculating transaction data by type and period
 */

import { Transaction } from '@/contexts/TransactionsContext';

export type TabType = 'balance' | 'earnings' | 'spendings';
export type PeriodType = 'weekly' | 'monthly' | 'yearly';
export type WeekFilter = 'thisWeek' | 'lastWeek';

/**
 * Calculate total balance from transactions
 */
export function calculateBalance(transactions: Transaction[]): number {
  return transactions.reduce((total, tx) => {
    if (tx.type === 'received' || tx.type === 'payment') {
      return total + tx.amount;
    } else if (tx.type === 'sent' || tx.type === 'transfer') {
      return total - tx.amount;
    }
    return total;
  }, 0);
}

/**
 * Calculate total earnings (received payments)
 */
export function calculateEarnings(transactions: Transaction[]): number {
  return transactions
    .filter((tx) => tx.type === 'received' || tx.type === 'payment')
    .reduce((total, tx) => total + tx.amount, 0);
}

/**
 * Calculate total spendings (sent payments and transfers)
 */
export function calculateSpendings(transactions: Transaction[]): number {
  return transactions
    .filter((tx) => tx.type === 'sent' || tx.type === 'transfer' || tx.type === 'request')
    .reduce((total, tx) => total + tx.amount, 0);
}

/**
 * Get transactions for a specific week
 */
export function getTransactionsForWeek(
  transactions: Transaction[],
  weekFilter: WeekFilter
): Transaction[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (weekFilter === 'thisWeek') {
    // This week: last 5 days including today
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 4); // 5 days total
    weekStart.setHours(0, 0, 0, 0);
    return transactions.filter((tx) => tx.date >= weekStart);
  } else {
    // Last week: 5 days from 5-9 days ago
    const lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 5);
    lastWeekEnd.setHours(23, 59, 59, 999);
    
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(lastWeekStart.getDate() - 9);
    lastWeekStart.setHours(0, 0, 0, 0);
    
    return transactions.filter(
      (tx) => tx.date >= lastWeekStart && tx.date <= lastWeekEnd
    );
  }
}

/**
 * Generate chart data points for a week
 */
export function generateChartData(
  transactions: Transaction[],
  tabType: TabType,
  weekFilter: WeekFilter
): number[] {
  const dataPoints: number[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Determine day offset based on week filter
  const dayOffset = weekFilter === 'thisWeek' ? 0 : 5;
  
  // Generate 5 data points
  for (let i = 4; i >= 0; i--) {
    const dayStart = new Date(today);
    dayStart.setDate(dayStart.getDate() - dayOffset - (4 - i));
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    // Get transactions for this specific day
    const dayTransactions = transactions.filter(
      (tx) => {
        const txDate = new Date(tx.date);
        return txDate >= dayStart && txDate <= dayEnd;
      }
    );

    let dayTotal = 0;
    if (tabType === 'balance') {
      // For balance, calculate cumulative balance up to that day
      const transactionsUpToDay = transactions.filter((tx) => {
        const txDate = new Date(tx.date);
        return txDate <= dayEnd;
      });
      dayTotal = calculateBalance(transactionsUpToDay);
    } else if (tabType === 'earnings') {
      dayTotal = calculateEarnings(dayTransactions);
    } else if (tabType === 'spendings') {
      dayTotal = calculateSpendings(dayTransactions);
    }

    dataPoints.push(Math.max(0, dayTotal));
  }

  return dataPoints;
}

/**
 * Get categorized spending/earnings data
 */
export function getCategorizedSpendings(
  transactions: Transaction[],
  tabType: TabType
): Array<{
  id: string;
  name: string;
  icon: string;
  amount: number;
  progress: number;
  color: string;
}> {
  // Filter transactions based on tab
  let filteredTransactions = transactions;
  if (tabType === 'earnings') {
    filteredTransactions = transactions.filter(
      (tx) => tx.type === 'received' || tx.type === 'payment'
    );
  } else if (tabType === 'spendings') {
    filteredTransactions = transactions.filter(
      (tx) => tx.type === 'sent' || tx.type === 'transfer' || tx.type === 'request'
    );
  }

  // Category mapping based on tab type
  // Category IDs: 1-5 for expenses, 6-10 for income
  let categories: Array<{ id: string; name: string; icon: string; color: string }>;
  
  if (tabType === 'earnings') {
    // Income categories (IDs 6-10)
    categories = [
      { id: '6', name: 'Salary', icon: 'briefcase', color: '#10B981' },
      { id: '7', name: 'Freelance', icon: 'laptop', color: '#3B82F6' },
      { id: '8', name: 'Investments', icon: 'line-chart', color: '#8B5CF6' },
      { id: '9', name: 'Gifts', icon: 'gift', color: '#F59E0B' },
      { id: '10', name: 'Other Income', icon: 'money', color: '#6366F1' },
    ];
  } else if (tabType === 'spendings') {
    // Expense categories (IDs 1-5)
    categories = [
      { id: '1', name: 'Food & Beverages', icon: 'cutlery', color: '#FF6B6B' },
      { id: '2', name: 'Entertainment', icon: 'tv', color: '#9B59B6' },
      { id: '3', name: 'Travel', icon: 'plane', color: '#3498DB' },
      { id: '4', name: 'Bills & Utilities', icon: 'file-text-o', color: '#95A3B8' },
      { id: '5', name: 'Health & Fitness', icon: 'heart', color: '#E74C3C' },
    ];
  } else {
    // Balance: show all categories (spending focused) (IDs 1-5)
    categories = [
      { id: '1', name: 'Food & Beverages', icon: 'cutlery', color: '#FF6B6B' },
      { id: '2', name: 'Entertainment', icon: 'tv', color: '#9B59B6' },
      { id: '3', name: 'Travel', icon: 'plane', color: '#3498DB' },
      { id: '4', name: 'Bills & Utilities', icon: 'file-text-o', color: '#95A3B8' },
      { id: '5', name: 'Health & Fitness', icon: 'heart', color: '#E74C3C' },
    ];
  }

  // Calculate totals per category using actual category field
  const categoryData = categories.map((cat) => {
    // Filter transactions for this specific category
    const categoryTransactions = filteredTransactions.filter(
      (tx) => tx.category === cat.id
    );
    
    // Calculate total amount for this category
    const categoryAmount = categoryTransactions.reduce(
      (sum, tx) => sum + tx.amount,
      0
    );
    
    // Calculate progress based on budget/earnings target
    const maxBudget = tabType === 'earnings' ? 5000 : 200; // Different limits for earnings vs spendings
    const progress = Math.min(100, (categoryAmount / maxBudget) * 100);

    return {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      amount: Math.round(categoryAmount),
      progress: Math.round(progress),
      color: cat.color,
    };
  });

  return categoryData;
}

/**
 * Calculate budget progress
 */
export function calculateBudgetProgress(
  transactions: Transaction[],
  tabType: TabType
): { percentage: number; amount: number } {
  const totalSpent = calculateSpendings(transactions);
  const budgetLimit = 300; // Mock budget limit
  const percentage = Math.min(100, Math.round((totalSpent / budgetLimit) * 100));
  const remaining = Math.max(0, budgetLimit - totalSpent);

  return {
    percentage,
    amount: Math.round(remaining),
  };
}
