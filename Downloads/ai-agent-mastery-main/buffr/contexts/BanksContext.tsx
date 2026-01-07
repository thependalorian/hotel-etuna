/**
 * Banks Context
 * 
 * Location: contexts/BanksContext.tsx
 * Purpose: Global state management for linked bank accounts
 * 
 * Provides bank account data and methods to add, update, and manage linked banks
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Bank account interface
export interface Bank {
  id: string;
  accountNumber: string; // Full account number (stored securely, displayed as last 4)
  last4: string; // Last 4 digits for display
  accountHolderName: string;
  bankName: string;
  accountType: 'checking' | 'savings';
  routingNumber?: string; // For US banks
  swiftCode?: string; // For international banks
  branchCode?: string; // For some countries
  isDefault?: boolean; // Default payment method
  isVerified: boolean; // Bank verification status
  isActive: boolean; // Bank active status
  createdAt: Date;
  lastUsedAt?: Date;
}

interface BanksContextType {
  banks: Bank[];
  loading: boolean;
  error: string | null;
  fetchBanks: () => Promise<void>;
  getBankById: (id: string) => Bank | null;
  addBank: (bankData: Omit<Bank, 'id' | 'last4' | 'isVerified' | 'isActive' | 'createdAt'>) => Promise<Bank>;
  updateBank: (id: string, updates: Partial<Bank>) => Promise<void>;
  deleteBank: (id: string) => Promise<void>;
  setDefaultBank: (id: string) => Promise<void>;
  refreshBanks: () => Promise<void>;
  getDefaultBank: () => Bank | null;
}

const BanksContext = createContext<BanksContextType | undefined>(undefined);

// Mock API function - Replace with actual API call
const fetchBanksFromAPI = async (): Promise<Bank[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // Mock data - Replace with actual API call
  return [
    {
      id: 'bank-1',
      accountNumber: '1234567890123',
      last4: '0123',
      accountHolderName: 'John Doe',
      bankName: 'Bank Windhoek',
      accountType: 'checking',
      branchCode: '001',
      isDefault: true,
      isVerified: true,
      isActive: true,
      createdAt: new Date('2024-01-10'),
      lastUsedAt: new Date(),
    },
    {
      id: 'bank-2',
      accountNumber: '9876543210987',
      last4: '0987',
      accountHolderName: 'John Doe',
      bankName: 'Nedbank',
      accountType: 'savings',
      branchCode: '002',
      isDefault: false,
      isVerified: true,
      isActive: true,
      createdAt: new Date('2024-02-05'),
      lastUsedAt: new Date(Date.now() - 172800000),
    },
  ];
};

interface BanksProviderProps {
  children: ReactNode;
}

export function BanksProvider({ children }: BanksProviderProps) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBanks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBanksFromAPI();
      setBanks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch banks');
      console.error('Error fetching banks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshBanks = useCallback(async () => {
    await fetchBanks();
  }, [fetchBanks]);

  const getBankById = useCallback(
    (id: string): Bank | null => {
      return banks.find((bank) => bank.id === id) || null;
    },
    [banks]
  );

  const getDefaultBank = useCallback((): Bank | null => {
    return banks.find((bank) => bank.isDefault) || banks[0] || null;
  }, [banks]);

  const addBank = useCallback(
    async (
      bankData: Omit<Bank, 'id' | 'last4' | 'isVerified' | 'isActive' | 'createdAt'>
    ): Promise<Bank> => {
      setLoading(true);
      setError(null);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const accountNumber = bankData.accountNumber.replace(/\s/g, '');
        const last4 = accountNumber.slice(-4);

        // If this is the first bank, make it default
        const isFirstBank = banks.length === 0;

        const newBank: Bank = {
          ...bankData,
          id: `bank-${Date.now()}`,
          last4,
          isDefault: isFirstBank,
          isVerified: true, // In production, this would be set after verification
          isActive: true,
          createdAt: new Date(),
        };

        // If this bank is set as default, unset other defaults
        if (newBank.isDefault) {
          setBanks((prev) =>
            prev.map((bank) => ({ ...bank, isDefault: false }))
          );
        }

        setBanks((prev) => [...prev, newBank]);
        return newBank;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add bank';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [banks]
  );

  const updateBank = useCallback(async (id: string, updates: Partial<Bank>) => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));

      // If setting as default, unset other defaults
      if (updates.isDefault) {
        setBanks((prev) =>
          prev.map((bank) => (bank.id === id ? { ...bank, ...updates, isDefault: true } : { ...bank, isDefault: false }))
        );
      } else {
        setBanks((prev) =>
          prev.map((bank) => (bank.id === id ? { ...bank, ...updates } : bank))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bank');
      console.error('Error updating bank:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBank = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));

      const bankToDelete = banks.find((bank) => bank.id === id);
      const wasDefault = bankToDelete?.isDefault;

      setBanks((prev) => prev.filter((bank) => bank.id !== id));

      // If deleted bank was default, set first remaining bank as default
      if (wasDefault) {
        setBanks((prev) => {
          if (prev.length > 0) {
            return prev.map((bank, index) => ({
              ...bank,
              isDefault: index === 0,
            }));
          }
          return prev;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bank');
      console.error('Error deleting bank:', err);
    } finally {
      setLoading(false);
    }
  }, [banks]);

  const setDefaultBank = useCallback(async (id: string) => {
    await updateBank(id, { isDefault: true });
  }, [updateBank]);

  const value: BanksContextType = {
    banks,
    loading,
    error,
    fetchBanks,
    getBankById,
    addBank,
    updateBank,
    deleteBank,
    setDefaultBank,
    refreshBanks,
    getDefaultBank,
  };

  return (
    <BanksContext.Provider value={value}>
      {children}
    </BanksContext.Provider>
  );
}

export function useBanks() {
  const context = useContext(BanksContext);
  if (context === undefined) {
    throw new Error('useBanks must be used within a BanksProvider');
  }
  return context;
}
