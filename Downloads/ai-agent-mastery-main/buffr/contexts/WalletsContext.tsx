/**
 * Wallets Context
 * 
 * Location: contexts/WalletsContext.tsx
 * Purpose: Global state management for wallets
 * 
 * Provides wallets data and methods to fetch, update, and manage wallets
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Auto Pay settings interface
export interface AutoPaySettings {
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  deductDate: string; // Format: DD-MMM-YYYY
  deductTime: string; // Format: HH:MMam/pm
  amount: number;
  numberOfRepayments: number | null;
  paymentMethod: string;
}

// Wallet interface
export interface Wallet {
  id: string;
  name: string;
  icon?: string; // FontAwesome icon name for the wallet
  balance: number;
  currency?: string;
  type?: 'personal' | 'business' | 'savings' | 'investment' | 'bills' | 'travel' | 'budget';
  purpose?: string;
  cardDesign?: number; // Frame number from Buffr Card Design (2-32)
  cardNumber?: string; // Last 4 digits for display
  cardholderName?: string;
  expiryDate?: string; // Format: MM/YY
  autoPayEnabled?: boolean;
  autoPaySettings?: AutoPaySettings;
  autoPayFrequency?: 'weekly' | 'bi-weekly' | 'monthly';
  autoPayDeductDate?: string;
  autoPayDeductTime?: string;
  autoPayAmount?: number;
  autoPayRepayments?: number;
  autoPayPaymentMethod?: string;
  autoPayMaxAmount?: number;
  pinProtected?: boolean;
  biometricEnabled?: boolean;
  createdAt: Date;
}

// Wallet transaction interface
export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'added' | 'spent' | 'transfer_in' | 'transfer_out';
  amount: number;
  description: string;
  date: Date;
  currency?: string;
  source?: string;
  destination?: string;
}

interface WalletsContextType {
  wallets: Wallet[];
  loading: boolean;
  error: string | null;
  fetchWallets: () => Promise<void>;
  getWalletById: (id: string) => Wallet | null;
  getWalletTransactions: (walletId: string) => WalletTransaction[];
  getWalletStats: (walletId: string) => { totalIn: number; totalOut: number; net: number };
  refreshWallets: () => Promise<void>;
  addWallet: (wallet: Omit<Wallet, 'id' | 'createdAt'>) => Promise<Wallet>;
  updateWallet: (id: string, updates: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  addMoneyToWallet: (walletId: string, amount: number, paymentMethod: string) => Promise<void>;
  transferFromWallet: (walletId: string, amount: number, recipient: string, note?: string) => Promise<void>;
}

const WalletsContext = createContext<WalletsContextType | undefined>(undefined);

// Mock API function - Replace with actual API call
const fetchWalletsFromAPI = async (): Promise<Wallet[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // Mock data - Replace with actual API call
  return [
    {
      id: '1',
      name: 'My Wallet',
      balance: 2450.00,
      currency: 'N$',
      type: 'personal',
      purpose: 'Main wallet for daily expenses',
      cardDesign: 2,
      cardNumber: '1234',
      cardholderName: 'John Doe',
      expiryDate: '12/25',
      autoPayEnabled: false,
      pinProtected: true,
      biometricEnabled: true,
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      name: 'Aquarium',
      balance: 850.50,
      currency: 'N$',
      type: 'savings',
      purpose: 'Savings for aquarium project',
      cardDesign: 12,
      cardNumber: '5678',
      cardholderName: 'John Doe',
      expiryDate: '06/26',
      autoPayEnabled: false,
      pinProtected: false,
      biometricEnabled: false,
      createdAt: new Date('2024-02-01'),
    },
    {
      id: '3',
      name: 'Emergency Fund',
      balance: 5000.00,
      currency: 'N$',
      type: 'savings',
      purpose: 'Emergency savings',
      cardDesign: 15,
      cardNumber: '9012',
      cardholderName: 'John Doe',
      expiryDate: '09/27',
      autoPayEnabled: true,
      autoPayMaxAmount: 500.00,
      pinProtected: true,
      biometricEnabled: true,
      createdAt: new Date('2024-01-01'),
    },
  ];
};

// Mock wallet transactions
const mockWalletTransactions: WalletTransaction[] = [
  {
    id: 'wt1',
    walletId: '1',
    type: 'added',
    amount: 500.00,
    description: 'Received from Alice',
    date: new Date(),
    currency: 'N$',
  },
  {
    id: 'wt2',
    walletId: '1',
    type: 'spent',
    amount: 200.00,
    description: 'Sent to Bob',
    date: new Date(Date.now() - 86400000),
    currency: 'N$',
  },
  {
    id: 'wt3',
    walletId: '1',
    type: 'added',
    amount: 1000.00,
    description: 'Added via Bank Transfer',
    date: new Date(Date.now() - 172800000),
    currency: 'N$',
  },
  {
    id: 'wt4',
    walletId: '2',
    type: 'added',
    amount: 500.00,
    description: 'Transfer from Main Wallet',
    date: new Date(Date.now() - 259200000),
    currency: 'N$',
  },
  {
    id: 'wt5',
    walletId: '3',
    type: 'added',
    amount: 2000.00,
    description: 'Loan Credited',
    date: new Date(Date.now() - 345600000),
    currency: 'N$',
  },
];

interface WalletsProviderProps {
  children: ReactNode;
}

export function WalletsProvider({ children }: WalletsProviderProps) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWalletsFromAPI();
      setWallets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch wallets');
      console.error('Error fetching wallets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshWallets = useCallback(async () => {
    await fetchWallets();
  }, [fetchWallets]);

  const getWalletById = useCallback(
    (id: string): Wallet | null => {
      return wallets.find((w) => w.id === id) || null;
    },
    [wallets]
  );

  const getWalletTransactions = useCallback(
    (walletId: string): WalletTransaction[] => {
      return mockWalletTransactions.filter((tx) => tx.walletId === walletId);
    },
    []
  );

  const getWalletStats = useCallback(
    (walletId: string): { totalIn: number; totalOut: number; net: number } => {
      const transactions = getWalletTransactions(walletId);
      const totalIn = transactions
        .filter((tx) => tx.type === 'added' || tx.type === 'transfer_in')
        .reduce((sum, tx) => sum + tx.amount, 0);
      const totalOut = transactions
        .filter((tx) => tx.type === 'spent' || tx.type === 'transfer_out')
        .reduce((sum, tx) => sum + tx.amount, 0);
      return {
        totalIn,
        totalOut,
        net: totalIn - totalOut,
      };
    },
    [getWalletTransactions]
  );

  const addWallet = useCallback(
    async (walletData: Omit<Wallet, 'id' | 'createdAt'>): Promise<Wallet> => {
      // Generate card number (last 4 digits)
      const cardNumber = Math.floor(1000 + Math.random() * 9000).toString();
      // Generate expiry date (2 years from now)
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 2);
      const expiryMonth = String(expiryDate.getMonth() + 1).padStart(2, '0');
      const expiryYear = String(expiryDate.getFullYear()).slice(-2);
      
      const newWallet: Wallet = {
        ...walletData,
        id: `wallet-${Date.now()}`,
        createdAt: new Date(),
        balance: walletData.balance || 0,
        currency: walletData.currency || 'N$',
        icon: walletData.icon || 'credit-card',
        cardDesign: walletData.cardDesign || 2, // Default to Frame 2
        cardNumber: walletData.cardNumber || cardNumber,
        cardholderName: walletData.cardholderName || walletData.name || 'Cardholder',
        expiryDate: walletData.expiryDate || `${expiryMonth}/${expiryYear}`,
        autoPayEnabled: walletData.autoPayEnabled || false,
        autoPaySettings: walletData.autoPaySettings,
        autoPayFrequency: walletData.autoPayFrequency,
        autoPayDeductDate: walletData.autoPayDeductDate,
        autoPayDeductTime: walletData.autoPayDeductTime,
        autoPayAmount: walletData.autoPayAmount,
        autoPayRepayments: walletData.autoPayRepayments,
        autoPayPaymentMethod: walletData.autoPayPaymentMethod,
        autoPayMaxAmount: walletData.autoPayAmount || walletData.autoPaySettings?.amount || walletData.autoPayMaxAmount,
      };
      setWallets((prev) => [...prev, newWallet]);
      return newWallet;
    },
    []
  );

  const updateWallet = useCallback(async (id: string, updates: Partial<Wallet>) => {
    setWallets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
  }, []);

  const deleteWallet = useCallback(async (id: string) => {
    setWallets((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const addMoneyToWallet = useCallback(
    async (walletId: string, amount: number, paymentMethod: string) => {
      // In production, this would call an API
      setWallets((prev) =>
        prev.map((w) =>
          w.id === walletId ? { ...w, balance: w.balance + amount } : w
        )
      );
      // Add transaction to mock data
      mockWalletTransactions.unshift({
        id: `wt-${Date.now()}`,
        walletId,
        type: 'added',
        amount,
        description: `Added via ${paymentMethod}`,
        date: new Date(),
        currency: 'N$',
      });
    },
    []
  );

  const transferFromWallet = useCallback(
    async (walletId: string, amount: number, recipient: string, note?: string) => {
      // In production, this would call an API
      setWallets((prev) =>
        prev.map((w) =>
          w.id === walletId ? { ...w, balance: w.balance - amount } : w
        )
      );
      // Add transaction to mock data
      mockWalletTransactions.unshift({
        id: `wt-${Date.now()}`,
        walletId,
        type: 'spent',
        amount,
        description: note || `Sent to ${recipient}`,
        date: new Date(),
        currency: 'N$',
        destination: recipient,
      });
    },
    []
  );

  const value: WalletsContextType = {
    wallets,
    loading,
    error,
    fetchWallets,
    getWalletById,
    getWalletTransactions,
    getWalletStats,
    refreshWallets,
    addWallet,
    updateWallet,
    deleteWallet,
    addMoneyToWallet,
    transferFromWallet,
  };

  return (
    <WalletsContext.Provider value={value}>
      {children}
    </WalletsContext.Provider>
  );
}

export function useWallets() {
  const context = useContext(WalletsContext);
  if (context === undefined) {
    throw new Error('useWallets must be used within a WalletsProvider');
  }
  return context;
}
