/**
 * Wallet cache store (Zustand + MMKV persist).
 * Caches wallet data for quick access and offline support.
 * Location: fintech/smartpay/mobile/store/walletStore.ts
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '@/store/mmkv-storage';

/**
 * Wallet type from WalletsContext
 */
export type WalletType = 'grant' | 'savings' | 'group' | 'business' | 'general';

/**
 * Wallet tier type
 */
export type WalletTier = 'basic' | 'standard' | 'premium';

/**
 * Cached wallet interface
 */
export interface CachedWallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  currency: 'NAD';
  isPrimary: boolean;
  tier: WalletTier;
  kycRequired: boolean;
  color?: string;
  icon?: string;
  lastUpdated: string;
}

/**
 * Recent transaction interface for quick access
 */
export interface RecentTransaction {
  id: string;
  walletId: string;
  type: 'send' | 'receive' | 'withdrawal' | 'deposit';
  amount: number;
  currency: 'NAD';
  description: string;
  recipient?: string;
  timestamp: string;
}

/**
 * Wallet store state interface
 */
export interface WalletState {
  /** Cached wallets */
  wallets: CachedWallet[];
  /** Recent transactions cache */
  recentTransactions: RecentTransaction[];
  /** Selected wallet ID */
  selectedWalletId: string | null;
  /** Last sync timestamp */
  lastSync: string | null;
  /** Update cached wallets */
  updateWallets: (wallets: CachedWallet[]) => void;
  /** Update single wallet */
  updateWallet: (id: string, updates: Partial<CachedWallet>) => void;
  /** Add recent transaction */
  addRecentTransaction: (transaction: RecentTransaction) => void;
  /** Set selected wallet */
  selectWallet: (id: string | null) => void;
  /** Get wallet by ID */
  getWalletById: (id: string) => CachedWallet | undefined;
  /** Get primary wallet */
  getPrimaryWallet: () => CachedWallet | undefined;
  /** Calculate total balance */
  getTotalBalance: () => number;
  /** Clear wallet cache */
  clearCache: () => void;
  /** Mark as synced */
  markSynced: () => void;
}

/**
 * Wallet cache store with MMKV persistence
 * 
 * @example
 * ```typescript
 * import { useWalletStore } from '@/store/walletStore';
 * 
 * function WalletSelector() {
 *   const { wallets, selectedWalletId, selectWallet } = useWalletStore();
 *   
 *   return (
 *     <FlatList
 *       data={wallets}
 *       renderItem={({ item }) => (
 *         <TouchableOpacity onPress={() => selectWallet(item.id)}>
 *           <Text>{item.name}: ${item.balance / 100}</Text>
 *         </TouchableOpacity>
 *       )}
 *     />
 *   );
 * }
 * ```
 */
export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallets: [],
      recentTransactions: [],
      selectedWalletId: null,
      lastSync: null,

      updateWallets: (wallets) => {
        set({
          wallets: wallets.map((w) => ({
            ...w,
            lastUpdated: new Date().toISOString(),
          })),
        });
      },

      updateWallet: (id, updates) => {
        set((state) => ({
          wallets: state.wallets.map((w) =>
            w.id === id
              ? { ...w, ...updates, lastUpdated: new Date().toISOString() }
              : w
          ),
        }));
      },

      addRecentTransaction: (transaction) => {
        set((state) => ({
          recentTransactions: [
            transaction,
            ...state.recentTransactions.slice(0, 49), // Keep last 50
          ],
        }));
      },

      selectWallet: (id) => {
        set({ selectedWalletId: id });
      },

      getWalletById: (id) => {
        return get().wallets.find((w) => w.id === id);
      },

      getPrimaryWallet: () => {
        return get().wallets.find((w) => w.isPrimary);
      },

      getTotalBalance: () => {
        return get().wallets.reduce((total, wallet) => total + wallet.balance, 0);
      },

      clearCache: () => {
        set({
          wallets: [],
          recentTransactions: [],
          selectedWalletId: null,
          lastSync: null,
        });
      },

      markSynced: () => {
        set({ lastSync: new Date().toISOString() });
      },
    }),
    {
      name: 'smartpay-wallets',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
