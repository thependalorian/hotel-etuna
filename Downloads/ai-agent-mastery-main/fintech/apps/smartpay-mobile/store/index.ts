/**
 * Smartpay Store Exports
 * Central export point for all Zustand stores with MMKV persistence.
 * Location: fintech/smartpay/mobile/store/index.ts
 */

// MMKV Storage Adapter
export { zustandStorage } from './mmkv-storage';

// Balance & Transactions Store
export {
  useBalanceStore,
  type Transaction,
  type BalanceState,
} from './balanceStore';

// User Preferences Store
export {
  useUserStore,
  type UserPreferences,
  type UserState,
  type ThemePreference,
  type LanguageCode,
} from './userStore';

// Wallet Cache Store
export {
  useWalletStore,
  type CachedWallet,
  type RecentTransaction,
  type WalletState,
  type WalletType,
  type WalletTier,
} from './walletStore';

// Settings Store
export {
  useSettingsStore,
  type SecuritySettings,
  type DisplaySettings,
  type NotificationPreferences,
  type PrivacySettings,
  type SettingsState,
} from './settingsStore';
