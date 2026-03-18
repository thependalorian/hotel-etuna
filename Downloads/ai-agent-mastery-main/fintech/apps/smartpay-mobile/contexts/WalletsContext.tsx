/**
 * WalletsContext – Smartpay Mobile Wallets Provider.
 * Manages user wallets, balances, and linked bank accounts.
 * Location: fintech/smartpay/mobile/contexts/WalletsContext.tsx
 */
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useUser } from './UserContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

/**
 * Wallet type enum defining different wallet categories.
 */
export type WalletType = 'grant' | 'savings' | 'group' | 'business' | 'general';

/**
 * Wallet tier enum for premium features and limits.
 */
export type WalletTier = 'basic' | 'standard' | 'premium';

/**
 * Wallet interface with complete type definitions.
 */
export interface Wallet {
  /** Unique wallet identifier */
  id: string;
  /** User-friendly wallet name */
  name: string;
  /** Wallet category type */
  type: WalletType;
  /** Current balance in smallest currency unit */
  balance: number;
  /** Currency code (NAD for Namibian Dollar) */
  currency: 'NAD';
  /** Whether this is the primary/default wallet */
  isPrimary: boolean;
  /** Wallet tier level */
  tier: WalletTier;
  /** Whether KYC verification is required for this wallet */
  kycRequired: boolean;
  /** UI color for wallet display */
  color?: string;
  /** UI icon identifier */
  icon?: string;
  /** Wallet creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Linked bank account interface for PISP integrations.
 */
export interface LinkedBankAccount {
  /** Unique account identifier */
  id: string;
  /** Bank name */
  bankName: string;
  /** Masked account number (e.g., "****1234") */
  accountNumber: string;
  /** Account holder name */
  accountHolder: string;
  /** Whether this is the default linked account */
  isDefault: boolean;
  /** Linked date */
  linkedAt: string;
}

/**
 * Wallets context state interface.
 */
interface WalletsState {
  /** Array of user wallets */
  wallets: Wallet[];
  /** Total balance across all wallets */
  totalBalance: number;
  /** Primary wallet (if any) */
  primaryWallet: Wallet | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message (if any) */
  error: string | null;
  /** Array of linked bank accounts */
  linkedAccounts: LinkedBankAccount[];
  /** Whether user has any linked accounts */
  hasLinkedAccounts: boolean;
}

/**
 * Wallets context value interface with state and actions.
 */
interface WalletsContextValue extends WalletsState {
  /** Refresh wallets from API */
  refresh: () => Promise<void>;
  /** Get wallet by ID */
  getWalletById: (id: string) => Wallet | undefined;
}

const WalletsContext = createContext<WalletsContextValue | undefined>(undefined);

/**
 * WalletsProvider component that fetches and manages wallet state.
 * @param children - Child components
 */
export function WalletsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useUser();
  
  const [state, setState] = useState<WalletsState>({
    wallets: [],
    totalBalance: 0,
    primaryWallet: null,
    isLoading: true,
    error: null,
    linkedAccounts: [],
    hasLinkedAccounts: false,
  });

  /**
   * Fetches wallets from the API endpoint.
   */
  const loadWallets = useCallback(async () => {
    if (!isAuthenticated) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Mock data for development when API is not configured
      if (!API_BASE_URL) {
        const mockWallets: Wallet[] = [
          {
            id: '1',
            name: 'Main Wallet',
            type: 'general',
            balance: 125050,
            currency: 'NAD',
            isPrimary: true,
            tier: 'standard',
            kycRequired: false,
            color: '#0029D6',
            icon: 'wallet',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Savings',
            type: 'savings',
            balance: 350000,
            currency: 'NAD',
            isPrimary: false,
            tier: 'standard',
            kycRequired: false,
            color: '#22C55E',
            icon: 'cash',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];

        const mockLinkedAccounts: LinkedBankAccount[] = [
          {
            id: 'acc-1',
            bankName: 'Bank Windhoek',
            accountNumber: '****1234',
            accountHolder: 'John Doe',
            isDefault: true,
            linkedAt: new Date().toISOString(),
          },
        ];

        const totalBalance = mockWallets.reduce((sum, w) => sum + w.balance, 0);
        const primaryWallet = mockWallets.find(w => w.isPrimary) || null;

        setState({
          wallets: mockWallets,
          totalBalance,
          primaryWallet,
          isLoading: false,
          error: null,
          linkedAccounts: mockLinkedAccounts,
          hasLinkedAccounts: mockLinkedAccounts.length > 0,
        });
        return;
      }

      // Fetch from real API
      const res = await fetch(`${API_BASE_URL}/api/v1/mobile/wallets`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch wallets');
      }

      const data = await res.json();
      const wallets: Wallet[] = data.wallets ?? [];
      const linkedAccounts: LinkedBankAccount[] = data.linkedAccounts ?? [];
      const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
      const primaryWallet = wallets.find(w => w.isPrimary) || null;

      setState({
        wallets,
        totalBalance,
        primaryWallet,
        isLoading: false,
        error: null,
        linkedAccounts,
        hasLinkedAccounts: linkedAccounts.length > 0,
      });
    } catch (error) {
      console.error('Error loading wallets:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load wallets',
      }));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  /**
   * Refreshes wallet data from API.
   */
  const refresh = useCallback(async () => {
    await loadWallets();
  }, [loadWallets]);

  /**
   * Gets a wallet by its ID.
   * @param id - Wallet ID
   * @returns Wallet object or undefined
   */
  const getWalletById = useCallback((id: string) => {
    return state.wallets.find(w => w.id === id);
  }, [state.wallets]);

  const value: WalletsContextValue = {
    ...state,
    refresh,
    getWalletById,
  };

  return <WalletsContext.Provider value={value}>{children}</WalletsContext.Provider>;
}

/**
 * Hook to access wallets context.
 * @throws Error if used outside WalletsProvider
 */
export function useWallets(): WalletsContextValue {
  const context = useContext(WalletsContext);
  if (context === undefined) {
    throw new Error('useWallets must be used within a WalletsProvider');
  }
  return context;
}
