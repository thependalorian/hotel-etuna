/**
 * App settings store (Zustand + MMKV persist).
 * Stores app-level configuration, feature flags, and user session data.
 * Location: fintech/smartpay/mobile/store/settingsStore.ts
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '@/store/mmkv-storage';

/**
 * Security settings interface
 */
export interface SecuritySettings {
  /** Auto-lock timeout in seconds (0 = disabled) */
  autoLockTimeout: number;
  /** Require authentication for transactions */
  requireAuthForTransactions: boolean;
  /** Show balance in app switcher/notifications */
  showBalanceInSwitcher: boolean;
  /** Enable screenshot protection */
  screenshotProtection: boolean;
  /** Last authenticated timestamp */
  lastAuthTimestamp?: string;
  /** Failed authentication attempts */
  failedAuthAttempts: number;
}

/**
 * Display settings interface
 */
export interface DisplaySettings {
  /** Show transaction categories */
  showCategories: boolean;
  /** Show merchant logos */
  showMerchantLogos: boolean;
  /** Compact transaction list */
  compactTransactionList: boolean;
  /** Show balance chart on home */
  showBalanceChart: boolean;
  /** Preferred chart period (days) */
  chartPeriod: 7 | 30 | 90 | 365;
}

/**
 * Notification preferences interface
 */
export interface NotificationPreferences {
  /** Transaction notifications */
  transactionNotifications: boolean;
  /** Payment reminders */
  paymentReminders: boolean;
  /** Security alerts */
  securityAlerts: boolean;
  /** Promotional notifications */
  promotionalNotifications: boolean;
  /** Sound enabled */
  soundEnabled: boolean;
  /** Vibration enabled */
  vibrationEnabled: boolean;
}

/**
 * Privacy settings interface
 */
export interface PrivacySettings {
  /** Share analytics data */
  analyticsEnabled: boolean;
  /** Share crash reports */
  crashReportsEnabled: boolean;
  /** Personalized recommendations */
  personalizedRecommendations: boolean;
  /** Location services enabled */
  locationEnabled: boolean;
}

/**
 * Default security settings
 */
const DEFAULT_SECURITY: SecuritySettings = {
  autoLockTimeout: 300, // 5 minutes
  requireAuthForTransactions: true,
  showBalanceInSwitcher: false,
  screenshotProtection: false,
  failedAuthAttempts: 0,
};

/**
 * Default display settings
 */
const DEFAULT_DISPLAY: DisplaySettings = {
  showCategories: true,
  showMerchantLogos: true,
  compactTransactionList: false,
  showBalanceChart: true,
  chartPeriod: 30,
};

/**
 * Default notification preferences
 */
const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  transactionNotifications: true,
  paymentReminders: true,
  securityAlerts: true,
  promotionalNotifications: false,
  soundEnabled: true,
  vibrationEnabled: true,
};

/**
 * Default privacy settings
 */
const DEFAULT_PRIVACY: PrivacySettings = {
  analyticsEnabled: true,
  crashReportsEnabled: true,
  personalizedRecommendations: true,
  locationEnabled: false,
};

/**
 * Settings store state interface
 */
export interface SettingsState {
  /** Security settings */
  security: SecuritySettings;
  /** Display settings */
  display: DisplaySettings;
  /** Notification preferences */
  notifications: NotificationPreferences;
  /** Privacy settings */
  privacy: PrivacySettings;
  /** App version */
  appVersion?: string;
  /** First launch timestamp */
  firstLaunchDate?: string;
  /** Update security settings */
  updateSecurity: (settings: Partial<SecuritySettings>) => void;
  /** Update display settings */
  updateDisplay: (settings: Partial<DisplaySettings>) => void;
  /** Update notification preferences */
  updateNotifications: (prefs: Partial<NotificationPreferences>) => void;
  /** Update privacy settings */
  updatePrivacy: (settings: Partial<PrivacySettings>) => void;
  /** Record authentication */
  recordAuth: (success: boolean) => void;
  /** Reset failed auth attempts */
  resetFailedAttempts: () => void;
  /** Check if auth is required */
  isAuthRequired: () => boolean;
  /** Reset all settings */
  resetSettings: () => void;
  /** Mark first launch */
  markFirstLaunch: () => void;
}

/**
 * Settings store with MMKV persistence
 * 
 * @example
 * ```typescript
 * import { useSettingsStore } from '@/store/settingsStore';
 * 
 * function SecuritySettings() {
 *   const { security, updateSecurity } = useSettingsStore();
 *   
 *   return (
 *     <View>
 *       <Text>Auto-lock timeout: {security.autoLockTimeout}s</Text>
 *       <Button
 *         title="Set to 1 minute"
 *         onPress={() => updateSecurity({ autoLockTimeout: 60 })}
 *       />
 *     </View>
 *   );
 * }
 * ```
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      security: DEFAULT_SECURITY,
      display: DEFAULT_DISPLAY,
      notifications: DEFAULT_NOTIFICATIONS,
      privacy: DEFAULT_PRIVACY,

      updateSecurity: (settings) => {
        set((state) => ({
          security: { ...state.security, ...settings },
        }));
      },

      updateDisplay: (settings) => {
        set((state) => ({
          display: { ...state.display, ...settings },
        }));
      },

      updateNotifications: (prefs) => {
        set((state) => ({
          notifications: { ...state.notifications, ...prefs },
        }));
      },

      updatePrivacy: (settings) => {
        set((state) => ({
          privacy: { ...state.privacy, ...settings },
        }));
      },

      recordAuth: (success) => {
        if (success) {
          set((state) => ({
            security: {
              ...state.security,
              lastAuthTimestamp: new Date().toISOString(),
              failedAuthAttempts: 0,
            },
          }));
        } else {
          set((state) => ({
            security: {
              ...state.security,
              failedAuthAttempts: state.security.failedAuthAttempts + 1,
            },
          }));
        }
      },

      resetFailedAttempts: () => {
        set((state) => ({
          security: { ...state.security, failedAuthAttempts: 0 },
        }));
      },

      isAuthRequired: () => {
        const { security } = get();
        if (security.autoLockTimeout === 0) return false;
        if (!security.lastAuthTimestamp) return true;

        const lastAuth = new Date(security.lastAuthTimestamp);
        const now = new Date();
        const diffSeconds = (now.getTime() - lastAuth.getTime()) / 1000;

        return diffSeconds > security.autoLockTimeout;
      },

      resetSettings: () => {
        set({
          security: DEFAULT_SECURITY,
          display: DEFAULT_DISPLAY,
          notifications: DEFAULT_NOTIFICATIONS,
          privacy: DEFAULT_PRIVACY,
        });
      },

      markFirstLaunch: () => {
        if (!get().firstLaunchDate) {
          set({ firstLaunchDate: new Date().toISOString() });
        }
      },
    }),
    {
      name: 'smartpay-settings',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
