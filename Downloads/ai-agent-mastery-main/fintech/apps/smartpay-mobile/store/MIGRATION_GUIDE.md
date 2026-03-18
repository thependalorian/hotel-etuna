# MMKV + Zustand Storage Migration Guide

## Overview

This guide helps you migrate from AsyncStorage or Context-based state management to the MMKV + Zustand storage pattern in Smartpay.

## Why Migrate?

### Performance Benefits
- **10x faster** than AsyncStorage
- Synchronous operations (no async/await needed)
- Native module with C++ backing
- Efficient memory usage

### Developer Experience
- Type-safe with TypeScript
- Simple, intuitive API
- Automatic persistence
- Hot reloading support

## Migration Steps

### 1. Remove AsyncStorage Dependencies

If you're using AsyncStorage, you can now remove it:

```json
// package.json - REMOVE (if not needed elsewhere)
"@react-native-async-storage/async-storage": "^2.2.0"
```

### 2. Replace AsyncStorage Calls

**Before (AsyncStorage):**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save
await AsyncStorage.setItem('user-theme', 'dark');

// Load
const theme = await AsyncStorage.getItem('user-theme');

// Remove
await AsyncStorage.removeItem('user-theme');
```

**After (Zustand + MMKV):**
```typescript
import { useUserStore } from '@/store';

// In your component
const { preferences, updatePreference } = useUserStore();

// Save (automatic)
updatePreference('theme', 'dark');

// Load (automatic)
const theme = preferences.theme;

// No manual removal needed - use store actions
```

### 3. Migrate Context-Based State

**Before (Context):**
```typescript
// UserContext.tsx
const [theme, setTheme] = useState('light');
const [notificationsEnabled, setNotificationsEnabled] = useState(true);

// Save to storage manually
useEffect(() => {
  AsyncStorage.setItem('theme', theme);
}, [theme]);
```

**After (Zustand Store):**
```typescript
// Automatic persistence - no useEffect needed!
import { useUserStore } from '@/store';

const { preferences, updatePreference } = useUserStore();
// preferences.theme is automatically persisted
```

## Store Usage Examples

### Balance Store

```typescript
import { useBalanceStore } from '@/store';

function HomeScreen() {
  const { balance, transactions, runTransaction } = useBalanceStore();

  const handleAddMoney = () => {
    runTransaction({
      id: Date.now().toString(),
      title: 'Deposit',
      amount: 10000, // cents (100.00 NAD)
    });
  };

  return (
    <View>
      <Text>Balance: N${(balance() / 100).toFixed(2)}</Text>
      <Button title="Add N$100" onPress={handleAddMoney} />
    </View>
  );
}
```

### User Store

```typescript
import { useUserStore } from '@/store';

function SettingsScreen() {
  const { preferences, updatePreference, setBiometric } = useUserStore();

  return (
    <View>
      {/* Theme Toggle */}
      <Switch
        value={preferences.theme === 'dark'}
        onValueChange={(value) => 
          updatePreference('theme', value ? 'dark' : 'light')
        }
      />

      {/* Notifications */}
      <Switch
        value={preferences.notificationsEnabled}
        onValueChange={(value) => 
          updatePreference('notificationsEnabled', value)
        }
      />

      {/* Biometric */}
      <Switch
        value={preferences.biometricEnabled}
        onValueChange={(value) => setBiometric(value, true)}
      />
    </View>
  );
}
```

### Wallet Store

```typescript
import { useWalletStore } from '@/store';
import { useWallets } from '@/contexts/WalletsContext';

function WalletScreen() {
  const { wallets: liveWallets } = useWallets();
  const { 
    wallets: cachedWallets, 
    updateWallets, 
    getPrimaryWallet,
    getTotalBalance 
  } = useWalletStore();

  // Sync live data to cache
  useEffect(() => {
    if (liveWallets.length > 0) {
      updateWallets(liveWallets.map(w => ({
        ...w,
        lastUpdated: new Date().toISOString(),
      })));
    }
  }, [liveWallets, updateWallets]);

  // Use cached data for instant UI
  const primaryWallet = getPrimaryWallet();
  const totalBalance = getTotalBalance();

  return (
    <View>
      <Text>Total: N${(totalBalance / 100).toFixed(2)}</Text>
      <Text>Primary: {primaryWallet?.name}</Text>
    </View>
  );
}
```

### Settings Store

```typescript
import { useSettingsStore } from '@/store';

function SecuritySettings() {
  const { security, updateSecurity, isAuthRequired } = useSettingsStore();

  return (
    <View>
      {/* Auto-lock timeout */}
      <Picker
        selectedValue={security.autoLockTimeout}
        onValueChange={(value) => 
          updateSecurity({ autoLockTimeout: value })
        }
      >
        <Picker.Item label="Immediately" value={0} />
        <Picker.Item label="1 minute" value={60} />
        <Picker.Item label="5 minutes" value={300} />
        <Picker.Item label="15 minutes" value={900} />
      </Picker>

      {/* Check if auth required */}
      {isAuthRequired() && <Text>Please authenticate</Text>}
    </View>
  );
}
```

## Advanced Patterns

### Selective State Updates

```typescript
// Only re-render when specific state changes
const theme = useUserStore((state) => state.preferences.theme);
const updateTheme = useUserStore((state) => state.updatePreference);

// Component only re-renders when theme changes, not other preferences
```

### Computed Values

```typescript
// Use selectors for computed values
const totalBalance = useWalletStore((state) => state.getTotalBalance());
const hasWallets = useWalletStore((state) => state.wallets.length > 0);
```

### Outside React Components

```typescript
// Access store outside components (useful for utilities)
import { useBalanceStore } from '@/store';

function logCurrentBalance() {
  const balance = useBalanceStore.getState().balance();
  console.log('Current balance:', balance);
}

// Update store outside components
function addTransactionFromAPI(transaction: Transaction) {
  useBalanceStore.getState().runTransaction(transaction);
}
```

## Testing

### Reset Stores in Tests

```typescript
import { useUserStore, useWalletStore } from '@/store';

beforeEach(() => {
  // Reset to defaults
  useUserStore.getState().resetPreferences();
  useWalletStore.getState().clearCache();
});
```

### Mock Store in Tests

```typescript
import { useUserStore } from '@/store';

jest.mock('@/store/userStore', () => ({
  useUserStore: jest.fn(() => ({
    preferences: { theme: 'light', notificationsEnabled: true },
    updatePreference: jest.fn(),
  })),
}));
```

## Common Pitfalls

### ❌ Don't use async/await with MMKV

```typescript
// WRONG
await updatePreference('theme', 'dark'); // updatePreference is not async!

// CORRECT
updatePreference('theme', 'dark'); // Synchronous, instant
```

### ❌ Don't mutate state directly

```typescript
// WRONG
preferences.theme = 'dark'; // Direct mutation won't trigger re-render

// CORRECT
updatePreference('theme', 'dark'); // Use store actions
```

### ❌ Don't overuse store subscriptions

```typescript
// WRONG - subscribes to entire store
const store = useUserStore();

// BETTER - selective subscription
const theme = useUserStore(state => state.preferences.theme);
```

## Troubleshooting

### Store not persisting

1. Check MMKV is installed: `npm ls react-native-mmkv`
2. Rebuild app: `npx expo run:ios` or `npx expo run:android`
3. Clear cache: `npx expo start --clear`

### Expo Go limitations

MMKV requires native modules. In Expo Go, the storage falls back to in-memory mode. Use development builds for full MMKV support:

```bash
npx expo run:ios
# or
npx expo run:android
```

### Type errors

Ensure TypeScript is properly configured and all types are exported from store files.

## Performance Tips

1. **Use selective subscriptions** to avoid unnecessary re-renders
2. **Batch updates** when changing multiple values
3. **Use computed values** instead of deriving in components
4. **Limit store size** - keep only essential data
5. **Use middleware** for logging/debugging in development only

## Next Steps

1. ✅ Migrate user preferences
2. ✅ Migrate wallet caching
3. ✅ Migrate transaction history
4. ✅ Update settings screens
5. ✅ Remove old AsyncStorage code
6. ✅ Add error boundaries
7. ✅ Update tests

## Resources

- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [MMKV Documentation](https://github.com/mrousavy/react-native-mmkv)
- [Fintech Clone Reference](https://github.com/Galaxies-dev/fintech-clone-react-native)
