# Smartpay Store Cheat Sheet

Quick reference for MMKV + Zustand stores in Smartpay.

## Import

```typescript
import { 
  useBalanceStore, 
  useUserStore, 
  useWalletStore, 
  useSettingsStore 
} from '@/store';
```

## Balance Store

```typescript
// Get state
const { balance, transactions, runTransaction, clearTransactions } = useBalanceStore();

// Add transaction
runTransaction({
  id: Date.now().toString(),
  title: 'Coffee',
  amount: -500, // -N$5.00 in cents
});

// Get balance
const currentBalance = balance(); // Returns number in cents

// Clear all
clearTransactions();

// Selective subscription
const balance = useBalanceStore(state => state.balance());
const txCount = useBalanceStore(state => state.transactions.length);
```

## User Store

```typescript
// Get state
const { preferences, updatePreference, updatePreferences, setBiometric, completeOnboarding } = useUserStore();

// Single update
updatePreference('theme', 'dark');
updatePreference('notificationsEnabled', true);

// Batch update
updatePreferences({
  theme: 'dark',
  notificationsEnabled: true,
  hapticFeedback: true,
});

// Biometric
setBiometric(true, true); // (enabled, forTransactions)

// Onboarding
completeOnboarding();

// Selective subscription
const theme = useUserStore(state => state.preferences.theme);
const biometric = useUserStore(state => state.preferences.biometricEnabled);
```

## Wallet Store

```typescript
// Get state
const { 
  wallets, 
  selectedWalletId, 
  updateWallets, 
  selectWallet, 
  getPrimaryWallet, 
  getTotalBalance,
  addRecentTransaction 
} = useWalletStore();

// Cache wallets from API
updateWallets(walletsFromAPI);

// Select wallet
selectWallet('wallet-id');

// Get computed values
const primary = getPrimaryWallet();
const total = getTotalBalance();

// Add transaction
addRecentTransaction({
  id: Date.now().toString(),
  walletId: 'wallet-id',
  type: 'send',
  amount: 10000,
  currency: 'NAD',
  description: 'Payment',
  timestamp: new Date().toISOString(),
});

// Selective subscription
const wallets = useWalletStore(state => state.wallets);
const selected = useWalletStore(state => state.selectedWalletId);
```

## Settings Store

```typescript
// Get state
const { 
  security, 
  display, 
  notifications, 
  privacy, 
  updateSecurity, 
  isAuthRequired, 
  recordAuth 
} = useSettingsStore();

// Update settings
updateSecurity({ autoLockTimeout: 300 });
updateDisplay({ chartPeriod: 30 });
updateNotifications({ soundEnabled: false });
updatePrivacy({ analyticsEnabled: true });

// Check auth
if (isAuthRequired()) {
  // Show auth screen
}

// Record auth
recordAuth(true); // success
recordAuth(false); // failed

// Selective subscription
const autoLock = useSettingsStore(state => state.security.autoLockTimeout);
const chartPeriod = useSettingsStore(state => state.display.chartPeriod);
```

## Outside Components

```typescript
// Get current state
const balance = useBalanceStore.getState().balance();
const theme = useUserStore.getState().preferences.theme;

// Update state
useBalanceStore.getState().runTransaction({ ... });
useUserStore.getState().updatePreference('theme', 'dark');

// Subscribe to changes
const unsubscribe = useBalanceStore.subscribe(
  state => console.log('Balance:', state.balance())
);

// Later: unsubscribe()
```

## Common Patterns

### Selective Subscription (Best Practice)

```typescript
// ❌ Bad - subscribes to entire store
const store = useUserStore();

// ✅ Good - only subscribes to specific value
const theme = useUserStore(state => state.preferences.theme);
```

### Batch Updates

```typescript
// ❌ Bad - triggers multiple re-renders
updatePreference('theme', 'dark');
updatePreference('hapticFeedback', true);
updatePreference('notificationsEnabled', true);

// ✅ Good - single update, single re-render
updatePreferences({
  theme: 'dark',
  hapticFeedback: true,
  notificationsEnabled: true,
});
```

### Computed Values

```typescript
// ❌ Bad - computed in component
const total = wallets.reduce((sum, w) => sum + w.balance, 0);

// ✅ Good - use store method
const total = getTotalBalance();
```

## Type Safety

```typescript
// All types are exported
import type { 
  Transaction,
  UserPreferences,
  CachedWallet,
  SecuritySettings,
  ThemePreference,
  WalletType
} from '@/store';

// Use in your components
const handleTransaction = (tx: Transaction) => { ... };
const updateTheme = (theme: ThemePreference) => { ... };
```

## Testing

```typescript
// Reset stores
beforeEach(() => {
  useBalanceStore.getState().clearTransactions();
  useUserStore.getState().resetPreferences();
  useWalletStore.getState().clearCache();
  useSettingsStore.getState().resetSettings();
});

// Mock stores
jest.mock('@/store/userStore', () => ({
  useUserStore: jest.fn(() => ({
    preferences: { theme: 'light' },
    updatePreference: jest.fn(),
  })),
}));
```

## Troubleshooting

### Not persisting?
1. Rebuild app: `npx expo run:ios`
2. Clear cache: `npx expo start --clear`
3. Check Expo Go limitations (use dev build)

### Type errors?
1. Import types from `@/store`
2. Check TypeScript version
3. Restart TypeScript server

### Not re-rendering?
1. Use selective subscriptions
2. Ensure using store actions (not direct mutation)
3. Check component memo/useMemo

## Storage Keys

- `smartpay-balance` - Transaction history
- `smartpay-user` - User preferences
- `smartpay-wallets` - Wallet cache
- `smartpay-settings` - App settings

## Performance Tips

1. Use selective subscriptions
2. Batch updates when possible
3. Use computed values
4. Limit stored data size
5. Avoid unnecessary re-renders

## Quick Actions

| Action | Command |
|--------|---------|
| Add transaction | `runTransaction({ id, title, amount })` |
| Update theme | `updatePreference('theme', 'dark')` |
| Cache wallets | `updateWallets(wallets)` |
| Check auth | `isAuthRequired()` |
| Reset all | `clearTransactions()`, `resetPreferences()`, `clearCache()`, `resetSettings()` |

---

**See also**: [README.md](./README.md) | [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) | [USAGE_EXAMPLES.tsx](./USAGE_EXAMPLES.tsx)
