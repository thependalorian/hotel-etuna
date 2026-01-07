/**
 * Transactions Context
 * 
 * Location: contexts/TransactionsContext.tsx
 * Purpose: Global state management for transactions
 * 
 * Provides transactions data and methods to fetch, update, and manage transactions
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Transaction interface
export interface Transaction {
  id: string;
  type: 'sent' | 'received' | 'payment' | 'transfer' | 'request';
  amount: number;
  description: string;
  date: Date;
  recipient?: string;
  sender?: string;
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
  category?: string; // Category ID: '1'-'10' for expenses/income categories
}

interface TransactionsContextType {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  getTransactionById: (id: string) => Transaction | null;
  refreshTransactions: () => Promise<void>;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

// Mock API function - Replace with actual API call
const fetchTransactionsFromAPI = async (): Promise<Transaction[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  // Mock data - Replace with actual API call
  // Categories: 1-5 (expenses), 6-10 (income)
  return [
    {
      id: '1',
      type: 'received',
      amount: 5000.00,
      description: 'Salary payment',
      date: new Date(),
      recipient: 'You',
      sender: 'Company Inc.',
      status: 'completed',
      reference: 'BFR-00000001-123456',
      category: '6', // Salary
    },
    {
      id: '2',
      type: 'sent',
      amount: 125.50,
      description: 'Restaurant payment - The Grill House',
      date: new Date(Date.now() - 86400000),
      status: 'completed',
      reference: 'BFR-00000002-234567',
      category: '1', // Food & Beverages
    },
    {
      id: '3',
      type: 'payment',
      amount: 1500.00,
      description: 'Freelance project payment',
      date: new Date(Date.now() - 86400000),
      recipient: 'You',
      sender: 'Client ABC',
      status: 'completed',
      reference: 'BFR-00000003-345678',
      category: '7', // Freelance
    },
    {
      id: '4',
      type: 'sent',
      amount: 350.00,
      description: 'Electricity bill payment',
      date: new Date(Date.now() - 172800000),
      status: 'completed',
      reference: 'BFR-00000004-456789',
      category: '4', // Bills & Utilities
    },
    {
      id: '5',
      type: 'sent',
      amount: 45.75,
      description: 'Coffee shop - Starbucks',
      date: new Date(Date.now() - 172800000),
      status: 'completed',
      reference: 'BFR-00000005-567890',
      category: '1', // Food & Beverages
    },
    {
      id: '6',
      type: 'received',
      amount: 300.00,
      description: 'Gift from friend',
      date: new Date(Date.now() - 259200000),
      recipient: 'You',
      sender: 'Mike Johnson',
      status: 'completed',
      reference: 'BFR-00000006-678901',
      category: '9', // Gifts
    },
    {
      id: '7',
      type: 'sent',
      amount: 89.99,
      description: 'Netflix subscription',
      date: new Date(Date.now() - 345600000),
      status: 'completed',
      reference: 'BFR-00000007-789012',
      category: '2', // Entertainment
    },
    {
      id: '8',
      type: 'sent',
      amount: 250.00,
      description: 'Gym membership - Fitness Plus',
      date: new Date(Date.now() - 432000000),
      status: 'completed',
      reference: 'BFR-00000008-890123',
      category: '5', // Health & Fitness
    },
    {
      id: '9',
      type: 'sent',
      amount: 450.00,
      description: 'Flight booking - Air Namibia',
      date: new Date(Date.now() - 518400000),
      status: 'completed',
      reference: 'BFR-00000009-901234',
      category: '3', // Travel
    },
    {
      id: '10',
      type: 'received',
      amount: 1200.00,
      description: 'Investment returns',
      date: new Date(Date.now() - 604800000),
      recipient: 'You',
      sender: 'Investment Fund',
      status: 'completed',
      reference: 'BFR-00000010-012345',
      category: '8', // Investments
    },
    {
      id: '11',
      type: 'sent',
      amount: 65.00,
      description: 'Lunch at Pizza Palace',
      date: new Date(Date.now() - 691200000),
      status: 'completed',
      reference: 'BFR-00000011-123456',
      category: '1', // Food & Beverages
    },
    {
      id: '12',
      type: 'sent',
      amount: 180.00,
      description: 'Water bill payment',
      date: new Date(Date.now() - 777600000),
      status: 'completed',
      reference: 'BFR-00000012-234567',
      category: '4', // Bills & Utilities
    },
    {
      id: '13',
      type: 'sent',
      amount: 55.00,
      description: 'Movie tickets - Cinema Complex',
      date: new Date(Date.now() - 864000000),
      status: 'completed',
      reference: 'BFR-00000013-345678',
      category: '2', // Entertainment
    },
    {
      id: '14',
      type: 'received',
      amount: 800.00,
      description: 'Other income - Bonus',
      date: new Date(Date.now() - 950400000),
      recipient: 'You',
      sender: 'Company Inc.',
      status: 'completed',
      reference: 'BFR-00000014-456789',
      category: '10', // Other Income
    },
    {
      id: '15',
      type: 'sent',
      amount: 95.00,
      description: 'Dinner at Sushi Bar',
      date: new Date(Date.now() - 1036800000),
      status: 'completed',
      reference: 'BFR-00000015-567890',
      category: '1', // Food & Beverages
    },
    {
      id: '16',
      type: 'transfer',
      amount: 500.00,
      description: 'Transfer to Aquarium Wallet',
      date: new Date(Date.now() - 1123200000),
      status: 'completed',
      reference: 'BFR-00000016-678901',
      // Transfers don't have categories - they're internal movements
    },
    {
      id: '17',
      type: 'sent',
      amount: 120.00,
      description: 'Hotel booking - Travel Inn',
      date: new Date(Date.now() - 1209600000),
      status: 'completed',
      reference: 'BFR-00000017-789012',
      category: '3', // Travel
    },
    {
      id: '18',
      type: 'sent',
      amount: 75.00,
      description: 'Yoga class payment',
      date: new Date(Date.now() - 1296000000),
      status: 'completed',
      reference: 'BFR-00000018-890123',
      category: '5', // Health & Fitness
    },
  ];
};

interface TransactionsProviderProps {
  children: ReactNode;
}

export function TransactionsProvider({ children }: TransactionsProviderProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTransactionsFromAPI();
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTransactions = useCallback(async () => {
    await fetchTransactions();
  }, [fetchTransactions]);

  const getTransactionById = useCallback(
    (id: string): Transaction | null => {
      return transactions.find((tx) => tx.id === id) || null;
    },
    [transactions]
  );

  const addTransaction = useCallback((transaction: Transaction) => {
    setTransactions((prev) => [transaction, ...prev]);
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx))
    );
  }, []);

  const value: TransactionsContextType = {
    transactions,
    loading,
    error,
    fetchTransactions,
    getTransactionById,
    refreshTransactions,
    addTransaction,
    updateTransaction,
  };

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
}
