# Smartpay Store (MMKV + Zustand)

High-performance, type-safe state management with automatic persistence for Smartpay mobile app.

## 🚀 Quick Start

```typescript
import { useBalanceStore, useUserStore, useWalletStore, useSettingsStore } from '@/store';

function MyComponent() {
  // Get balance and transactions
  const { balance, transactions, runTransaction } = useBalanceStore();
  
  // Get user preferences
  const { preferences, updatePreference } = useUserStore();
  
  // Get wallet cache
  const { wallets, getTotalBalance } = useWalletStore();
  
  // Get app settings
  const { security, display } = useSettingsStore();
  
  return <View>...</View>;
}
```

## 📦 What's Included

### Stores

1. **`balanceStore`** - Balance and transaction history
2. **`userStore`** - User preferences and settings
3. **`walletStore`** - Wallet cache for offline access
4. **`settingsStore`** - App-level settings and security

### Features

- ✅ **10x faster** than AsyncStorage (MMKV-backed)
- ✅ **Automatic persistence** - no manual save/load
- ✅ **Type-safe** - full TypeScript support
- ✅ **Synchronous API** - no async/await needed
- ✅ **Hot reload** support in development
- ✅ **Small bundle size** - ~1KB per store
- ✅ **Zero config** - works out of the box

## 📚 Documentation

- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Migrate from AsyncStorage/Context
- **[USAGE_EXAMPLES.tsx](./USAGE_EXAMPLES.tsx)** - Copy-paste examples
- **Individual store files** - See inline documentation

## 🏗️ Architecture

```
store/
├── mmkv-storage.ts      # MMKV adapter for Zustand
├── balanceStore.ts      # Balance & transactions
├── userStore.ts         # User preferences
├── walletStore.ts       # Wallet cache
├── settingsStore.ts     # App settings
├── index.ts             # Central exports
├── README.md            # This file
├── MIGRATION_GUIDE.md   # Migration guide
└── USAGE_EXAMPLES.tsx   # Usage examples
```

## 💾 Storage Details

### Storage Backend

- **Production**: MMKV (C++ native module)
- **Expo Go**: In-memory fallback (limited)
- **Storage ID**: `smartpay-storage`

### Data Structure

Each store has its own persistent key:
- `smartpay-balance` - Transaction history
- `smartpay-user` - User preferences
- `smartpay-wallets` - Cached wallet data
- `smartpay-settings` - App settings

### Storage Size

Typical storage usage per user:
- Balance: ~10-50 KB (100 transactions)
- User: ~1-2 KB
- Wallets: ~5-10 KB
- Settings: ~2-3 KB

**Total**: ~20-65 KB per user

## 🎯 Common Use Cases

### 1. Save User Preference

```typescript
const { updatePreference } = useUserStore();
updatePreference('theme', 'dark'); // Automatically persisted
```

### 2. Add Transaction

```typescript
const { runTransaction } = useBalanceStore();
runTransaction({
  id: Date.now().toString(),
  title: 'Coffee',
  amount: -500, // -N$5.00
});
```

### 3. Cache Wallet Data

```typescript
const { updateWallets } = useWalletStore();
updateWallets(walletsFromAPI); // Cached for offline access
```

### 4. Check Auth Requirement

```typescript
const { isAuthRequired } = useSettingsStore();
if (isAuthRequired()) {
  // Show authentication screen
}
```

## 🔍 Selective Subscriptions

Only re-render when specific state changes:

```typescript
// ❌ Bad - subscribes to entire store
const store = useUserStore();

// ✅ Good - only subscribes to theme
const theme = useUserStore(state => state.preferences.theme);

// ✅ Good - only subscribes to balance
const balance = useBalanceStore(state => state.balance());
```

## 🔧 Advanced Usage

### Outside React Components

```typescript
// Get current state
const currentBalance = useBalanceStore.getState().balance();

// Update state
useBalanceStore.getState().runTransaction({ ... });

// Subscribe to changes
const unsubscribe = useBalanceStore.subscribe(
  state => console.log('Balance:', state.balance())
);
```

### Batch Updates

```typescript
const { updatePreferences } = useUserStore();

// Update multiple preferences at once
updatePreferences({
  theme: 'dark',
  notificationsEnabled: true,
  hapticFeedback: true,
});
```

### Computed Values

```typescript
const { getTotalBalance } = useWalletStore();
const totalBalance = getTotalBalance(); // Computed from all wallets
```

## 🧪 Testing

### Reset Store State

```typescript
import { useUserStore, useBalanceStore } from '@/store';

beforeEach(() => {
  useUserStore.getState().resetPreferences();
  useBalanceStore.getState().clearTransactions();
});
```

### Mock Store

```typescript
jest.mock('@/store/userStore', () => ({
  useUserStore: jest.fn(() => ({
    preferences: { theme: 'light' },
    updatePreference: jest.fn(),
  })),
}));
```

## ⚡ Performance Tips

1. **Use selective subscriptions** to avoid unnecessary re-renders
2. **Batch updates** when changing multiple values
3. **Use computed values** instead of deriving in components
4. **Limit store size** - keep only essential data
5. **Use middleware** for logging/debugging in development only

## 🚨 Important Notes

### Expo Go Limitations

MMKV requires native modules. In Expo Go, it falls back to in-memory storage. For full MMKV support, use development builds:

```bash
npx expo run:ios
# or
npx expo run:android
```

### Data Migration

When updating store schemas, ensure backward compatibility:

```typescript
// Good - backward compatible
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      preferences: {
        ...DEFAULT_PREFERENCES,
        // New field with default
        newField: false,
      },
    }),
    { name: 'smartpay-user' }
  )
);
```

## 🔗 Related

- **Reference Implementation**: [fintech-clone-react-native](https://github.com/Galaxies-dev/fintech-clone-react-native)
- **Zustand Docs**: https://docs.pmnd.rs/zustand
- **MMKV Docs**: https://github.com/mrousavy/react-native-mmkv

## 📝 License

Part of Smartpay mobile app.
