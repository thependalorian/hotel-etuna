/**
 * User preferences and settings store (Zustand + MMKV persist).
 * Stores user preferences, theme, and app-level settings.
 * Location: fintech/smartpay/mobile/store/userStore.ts
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '@/store/mmkv-storage';

/**
 * Theme preference type
 */
export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * Language code type
 */
export type LanguageCode = 'en' | 'af' | 'de' | 'pt';

/**
 * User preferences interface
 */
export interface UserPreferences {
  /** Theme preference */
  theme: ThemePreference;
  /** Language code */
  language: LanguageCode;
  /** Currency display preference */
  currency: 'NAD';
  /** Enable notifications */
  notificationsEnabled: boolean;
  /** Enable push notifications */
  pushNotificationsEnabled: boolean;
  /** Enable transaction alerts */
  transactionAlerts: boolean;
  /** Enable biometric authentication */
  biometricEnabled: boolean;
  /** Require biometric for transactions */
  biometricForTransactions: boolean;
  /** Transaction PIN set */
  hasPinSet: boolean;
  /** Marketing emails enabled */
  marketingEnabled: boolean;
  /** Last app version used */
  lastAppVersion?: string;
  /** Onboarding completed */
  onboardingCompleted: boolean;
  /** Show balance on home screen */
  showBalanceOnHome: boolean;
  /** Enable haptic feedback */
  hapticFeedback: boolean;
}

/**
 * Default user preferences
 */
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'en',
  currency: 'NAD',
  notificationsEnabled: true,
  pushNotificationsEnabled: true,
  transactionAlerts: true,
  biometricEnabled: false,
  biometricForTransactions: false,
  hasPinSet: false,
  marketingEnabled: false,
  onboardingCompleted: false,
  showBalanceOnHome: true,
  hapticFeedback: true,
};

/**
 * User store state interface
 */
export interface UserState {
  /** User preferences */
  preferences: UserPreferences;
  /** Update specific preference */
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
  /** Update multiple preferences at once */
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  /** Reset preferences to defaults */
  resetPreferences: () => void;
  /** Mark onboarding as completed */
  completeOnboarding: () => void;
  /** Set biometric authentication */
  setBiometric: (enabled: boolean, forTransactions?: boolean) => void;
  /** Set transaction PIN */
  setPin: (hasPin: boolean) => void;
}

/**
 * User preferences store with MMKV persistence
 * 
 * @example
 * ```typescript
 * import { useUserStore } from '@/store/userStore';
 * 
 * function SettingsScreen() {
 *   const { preferences, updatePreference } = useUserStore();
 *   
 *   return (
 *     <Switch
 *       value={preferences.notificationsEnabled}
 *       onValueChange={(value) => updatePreference('notificationsEnabled', value)}
 *     />
 *   );
 * }
 * ```
 */
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      preferences: DEFAULT_PREFERENCES,

      updatePreference: (key, value) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            [key]: value,
          },
        }));
      },

      updatePreferences: (prefs) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...prefs,
          },
        }));
      },

      resetPreferences: () => {
        set({ preferences: DEFAULT_PREFERENCES });
      },

      completeOnboarding: () => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            onboardingCompleted: true,
          },
        }));
      },

      setBiometric: (enabled, forTransactions = false) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            biometricEnabled: enabled,
            biometricForTransactions: enabled ? forTransactions : false,
          },
        }));
      },

      setPin: (hasPin) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            hasPinSet: hasPin,
          },
        }));
      },
    }),
    {
      name: 'smartpay-user',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
