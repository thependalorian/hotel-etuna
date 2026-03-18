/**
 * Local balance and transactions store (Zustand + MMKV persist).
 * Used for demo/recent activity; can sync with backend later.
 * Location: fintech/smartpay/store/balanceStore.ts
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '@/store/mmkv-storage';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string; // ISO string for JSON persist
}

export interface BalanceState {
  transactions: Transaction[];
  runTransaction: (tx: Omit<Transaction, 'date'> & { date?: Date }) => void;
  balance: () => number;
  clearTransactions: () => void;
}

export const useBalanceStore = create<BalanceState>()(
  persist(
    (set, get) => ({
      transactions: [],
      runTransaction: (tx) => {
        set((state) => ({
          transactions: [
            {
              ...tx,
              date: (tx.date ?? new Date()).toISOString(),
            },
            ...state.transactions,
          ].slice(0, 100),
        }));
      },
      balance: () =>
        get().transactions.reduce((acc, t) => acc + t.amount, 0),
      clearTransactions: () => set({ transactions: [] }),
    }),
    {
      name: 'smartpay-balance',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
