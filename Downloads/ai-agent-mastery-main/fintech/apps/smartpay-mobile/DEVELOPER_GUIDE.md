# SmartPay Developer Guide

**Comprehensive guide for developers working on the SmartPay mobile app**  
**Last Updated:** March 17, 2026

---

## Table of Contents
1. [Getting Started](#getting-started)
2. [Design System](#design-system)
3. [Component Development](#component-development)
4. [Navigation](#navigation)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [Testing](#testing)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites
```bash
node --version    # v18+
npm --version     # v9+
expo --version    # Expo CLI
```

### Installation
```bash
cd /path/to/smartpay/mobile
npm install
```

### Running the App
```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web (limited support)
npm run web
```

### Environment Setup
Create `.env` file:
```env
# Node.js Backend
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000

# Python AI Backend
EXPO_PUBLIC_AI_API_BASE_URL=http://localhost:8000

# Feature Flags
EXPO_PUBLIC_ENABLE_BIOMETRICS=true
EXPO_PUBLIC_ENABLE_OFFLINE_MODE=true
EXPO_PUBLIC_ENABLE_AI_COPILOT=true
```

---

## Design System

### Using Design Tokens

**Always import and use the centralized design system:**

```typescript
import { designSystem as DS } from '@/constants/designSystem';

const styles = StyleSheet.create({
  container: {
    backgroundColor: DS.colors.background,
    padding: DS.spacing.md,
    borderRadius: DS.radius.md,
    ...DS.shadows.md,
  },
  title: {
    fontSize: DS.typography.fontSize.xl,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
  },
});
```

### Available Tokens

#### Colors
```typescript
// Primary
DS.colors.primary           // #020617 (slate-950)
DS.colors.background        // #FFFFFF
DS.colors.surface           // #F8FAFC
DS.colors.border            // #E2E8F0

// Brand (SmartPay teal)
DS.colors.brand             // #005D6E
DS.colors.brandDark         // #004552
DS.colors.brandLight        // #B2E5ED

// Text
DS.colors.text              // #020617 (18.3:1 contrast)
DS.colors.textSecondary     // #64748B (4.6:1 - WCAG AA)
DS.colors.textTertiary      // #94A3B8

// Semantic
DS.colors.semantic.success  // #22C55E
DS.colors.semantic.error    // #E11D48
DS.colors.semantic.warning  // #F59E0B
DS.colors.semantic.info     // #2563EB
```

#### Typography
```typescript
// Font sizes
DS.typography.fontSize.xs       // 12
DS.typography.fontSize.sm       // 14
DS.typography.fontSize.base     // 16
DS.typography.fontSize.lg       // 18
DS.typography.fontSize.xl       // 20
DS.typography.fontSize['2xl']   // 24
DS.typography.fontSize['3xl']   // 30
DS.typography.fontSize['4xl']   // 36

// Font weights
DS.typography.fontWeight.normal    // '400'
DS.typography.fontWeight.medium    // '500'
DS.typography.fontWeight.semibold  // '600'
DS.typography.fontWeight.bold      // '700'

// Pre-defined styles
DS.typography.textStyles.heroAmount     // { fontSize: 40, ... }
DS.typography.textStyles.pageTitle      // { fontSize: 32, ... }
DS.typography.textStyles.screenTitle    // { fontSize: 24, ... }
DS.typography.textStyles.body           // { fontSize: 16, ... }
DS.typography.textStyles.caption        // { fontSize: 12, ... }
```

#### Spacing
```typescript
// Named scale
DS.spacing.xs    // 4
DS.spacing.sm    // 8
DS.spacing.md    // 16
DS.spacing.lg    // 24
DS.spacing.xl    // 32
DS.spacing['2xl'] // 40
DS.spacing['3xl'] // 48
DS.spacing['4xl'] // 64

// Numbered scale (8px grid)
DS.spacing[1]    // 4
DS.spacing[2]    // 8
DS.spacing[3]    // 12
DS.spacing[4]    // 16
DS.spacing[6]    // 24
DS.spacing[8]    // 32

// Screen-specific
DS.spacing.horizontalPadding      // 16
DS.spacing.sectionSpacing         // 32
DS.spacing.contentBottomPadding   // 128
```

#### Border Radius
```typescript
DS.radius.sm     // 8
DS.radius.md     // 12
DS.radius.lg     // 16
DS.radius.xl     // 24
DS.radius['2xl'] // 28
DS.radius.pill   // 999
DS.radius.full   // 9999
```

#### Shadows
```typescript
DS.shadows.sm    // Subtle shadow
DS.shadows.md    // Medium elevation
DS.shadows.lg    // High elevation
```

#### Component Specs
```typescript
// Buttons
DS.components.button.height.lg       // 56
DS.components.button.height.md       // 48
DS.components.button.height.sm       // 40
DS.components.button.minTouchTarget  // 44

// Inputs
DS.components.input.height           // 56
DS.components.input.borderRadius     // 999

// Cards
DS.components.balanceCard.height     // 120
DS.components.walletCard.width       // 164
DS.components.walletCard.height      // 140

// Header
DS.components.header.height          // 64
DS.components.header.avatarSize      // 36

// Tab Bar
DS.components.tabBar.height          // 72
```

#### Animations
```typescript
DS.animations.fast               // 150ms
DS.animations.normal             // 250ms
DS.animations.slow               // 350ms
DS.animations.buttonPress.scale  // 0.98
DS.animations.buttonPress.duration // 150ms
```

---

## Component Development

### Creating a New Component

#### 1. Component File Structure
```typescript
/**
 * ComponentName - Brief Description
 * 
 * Figma Node: [Node ID if applicable]
 * Location: components/category/ComponentName.tsx
 * 
 * Features:
 * - Feature 1
 * - Feature 2
 * 
 * @see Related components or docs
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { designSystem as DS } from '@/constants/designSystem';

// ─── Props Interface ────────────────────────────────────────────────────────
export interface ComponentNameProps {
  /** Brief description */
  propName: string;
  /** Optional prop */
  optionalProp?: number;
  /** Callback description */
  onAction: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────
export function ComponentName({
  propName,
  optionalProp = 0,
  onAction,
}: ComponentNameProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{propName}</Text>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    backgroundColor: DS.colors.background,
    padding: DS.spacing.md,
    borderRadius: DS.radius.md,
  },
  text: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.text,
  },
});
```

#### 2. Add to Index File
```typescript
// components/category/index.ts
export { ComponentName } from './ComponentName';
export type { ComponentNameProps } from './ComponentName';
```

#### 3. Use in Screen
```typescript
import { ComponentName } from '@/components/category';

<ComponentName
  propName="value"
  onAction={handleAction}
/>
```

### Component Checklist
- [ ] Follow naming convention (PascalCase)
- [ ] Use design system tokens
- [ ] Include TypeScript props interface
- [ ] Export props type
- [ ] Add JSDoc comments
- [ ] Include accessibility attributes
- [ ] Add to index.ts barrel export
- [ ] Follow Figma specs (if applicable)
- [ ] Include usage example in header comment

---

## Navigation

### Expo Router (File-Based)

#### Route Structure
```
app/
├── (tabs)/            → Group (no URL segment)
│   ├── index.tsx      → /(tabs) or /
│   ├── profile.tsx    → /profile
│   └── _layout.tsx    → Layout wrapper
├── groups/
│   ├── index.tsx      → /groups
│   ├── [id].tsx       → /groups/123 (dynamic)
│   └── create.tsx     → /groups/create
└── _layout.tsx        → Root layout
```

### Navigation Patterns

#### Basic Navigation
```typescript
import { router } from 'expo-router';

// Push (can go back)
router.push('/send-money');

// Replace (cannot go back)
router.replace('/(tabs)/home');

// Go back
router.back();

// Go to specific tab
router.push('/(tabs)/profile');
```

#### With Parameters
```typescript
// Pass params
router.push({
  pathname: '/send-money/amount',
  params: {
    recipientId: '123',
    recipientName: 'John Doe',
  }
});

// Receive params (in target screen)
import { useLocalSearchParams } from 'expo-router';

export default function AmountScreen() {
  const { recipientId, recipientName } = useLocalSearchParams();
  // ...
}
```

#### Type-Safe Navigation
```typescript
// For type safety, cast routes
router.push('/(tabs)/home' as never);
router.push('/send-money/select-recipient' as never);
```

### Navigation Guards

#### Protected Routes
Use `(authenticated)` group with layout guard:

```typescript
// app/(authenticated)/_layout.tsx
export default function AuthenticatedLayout() {
  const { isAuthenticated } = useUser();
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)');
    }
  }, [isAuthenticated]);
  
  return <Slot />;
}
```

#### Onboarding Guard
```typescript
// app/_layout.tsx or index.tsx
const { hasCompletedOnboarding } = useUser();

useEffect(() => {
  if (!hasCompletedOnboarding) {
    router.replace('/onboarding');
  }
}, [hasCompletedOnboarding]);
```

---

## State Management

### Context API

#### Using Contexts
```typescript
import { useUser } from '@/contexts/UserContext';
import { useWallets } from '@/contexts/WalletsContext';
import { useNetwork } from '@/contexts/NetworkContext';

function MyComponent() {
  const { profile, smartpayId, isAuthenticated } = useUser();
  const { wallets, totalBalance, refresh } = useWallets();
  const { isConnected } = useNetwork();
  
  // Use context data
}
```

#### Available Contexts

**UserContext:**
```typescript
{
  profile: UserProfile | null;
  smartpayId: string | null;
  isAuthenticated: boolean;
  proofOfLifeDueDate: string | null;
  walletStatus: 'active' | 'frozen';
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  logout: () => void;
}
```

**WalletsContext:**
```typescript
{
  wallets: Wallet[];
  totalBalance: number;
  primaryWallet: Wallet | null;
  isLoading: boolean;
  hasLinkedAccounts: boolean;
  refresh: () => Promise<void>;
  addWallet: (wallet: Wallet) => void;
  updateWallet: (id: string, data: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;
}
```

**NetworkContext:**
```typescript
{
  isConnected: boolean;
  connectionType: string | null;
}
```

### Zustand Stores

For local/persistent state:

```typescript
import { useBalanceStore } from '@/store/balanceStore';
import { useUserStore } from '@/store/userStore';
import { useWalletStore } from '@/store/walletStore';
import { useSettingsStore } from '@/store/settingsStore';

function MyComponent() {
  const balance = useBalanceStore(state => state.balance);
  const setBalance = useBalanceStore(state => state.setBalance);
  
  // ...
}
```

### MMKV Storage (Fast Key-Value)

```typescript
import { storage } from '@/store/mmkv-storage';

// Store
storage.set('key', 'value');
storage.set('balance', 1500.50);
storage.set('user', JSON.stringify(user));

// Retrieve
const value = storage.getString('key');
const balance = storage.getNumber('balance');
const user = JSON.parse(storage.getString('user') || '{}');

// Delete
storage.delete('key');

// Clear all
storage.clearAll();
```

### Secure Storage

For sensitive data (tokens, PINs):

```typescript
import * as SecureStore from 'expo-secure-store';

// Store (async)
await SecureStore.setItemAsync('authToken', token);
await SecureStore.setItemAsync('pin', hashedPin);

// Retrieve
const token = await SecureStore.getItemAsync('authToken');

// Delete
await SecureStore.deleteItemAsync('authToken');
```

---

## API Integration

### Service Layer Pattern

All API calls go through service modules in `services/`.

#### Service Structure
```typescript
// services/example.ts
import { API_BASE_URL } from '@/constants/api';

interface ExampleResponse {
  success: boolean;
  data: any;
}

export async function fetchExample(): Promise<ExampleResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/example`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('fetchExample error:', error);
    throw error;
  }
}
```

### Available Services

#### 1. Auth Service (`services/auth.ts`)
```typescript
import { login, logout, verifyOTP, refreshToken } from '@/services/auth';

// Login
const { token, user } = await login({ phone, password });

// Verify OTP
const result = await verifyOTP({ phone, code });

// Logout
await logout();
```

#### 2. Wallet Service (`services/wallets.ts`)
```typescript
import { getWallets, createWallet, getWalletBalance } from '@/services/wallets';

// Get user wallets
const wallets = await getWallets();

// Create wallet
const newWallet = await createWallet({
  name: 'Savings',
  type: 'custom',
  icon: 'piggy-bank',
  color: '#2563EB',
});

// Get balance
const balance = await getWalletBalance(walletId);
```

#### 3. Send Service (`services/send.ts`)
```typescript
import { sendMoney, getContacts } from '@/services/send';

// Send money
const result = await sendMoney({
  recipientPhone: '+26481234567',
  amount: 50.00,
  note: 'Lunch',
  walletId: 'wallet-1',
});

// Get contacts
const contacts = await getContacts();
```

#### 4. Transaction Service (`services/transactions.ts`)
```typescript
import { getTransactions, getTransactionDetail } from '@/services/transactions';

// Get transactions
const txns = await getTransactions({
  limit: 20,
  offset: 0,
  type: 'all', // 'sent' | 'received'
});

// Get detail
const detail = await getTransactionDetail(txnId);
```

### API Error Handling

```typescript
try {
  const result = await sendMoney(data);
  // Success
} catch (error) {
  if (error instanceof Error) {
    // Network error
    if (error.message.includes('network')) {
      showError('Check your internet connection');
    }
    // API error
    else if (error.message.includes('insufficient')) {
      showError('Insufficient balance');
    }
    // Generic
    else {
      showError('Something went wrong. Please try again.');
    }
  }
}
```

### Loading Pattern
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleSubmit = async () => {
  try {
    setLoading(true);
    setError(null);
    const result = await sendMoney(data);
    // Success
    router.push('/send-money/success');
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown error');
  } finally {
    setLoading(false);
  }
};
```

---

## State Management

### Context Pattern

#### Creating a Context
```typescript
// contexts/ExampleContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ExampleContextType {
  data: string[];
  addItem: (item: string) => void;
}

const ExampleContext = createContext<ExampleContextType | undefined>(undefined);

export function ExampleProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<string[]>([]);
  
  const addItem = (item: string) => {
    setData(prev => [...prev, item]);
  };
  
  return (
    <ExampleContext.Provider value={{ data, addItem }}>
      {children}
    </ExampleContext.Provider>
  );
}

export function useExample() {
  const context = useContext(ExampleContext);
  if (!context) {
    throw new Error('useExample must be used within ExampleProvider');
  }
  return context;
}
```

#### Using the Context
```typescript
// In _layout.tsx
<ExampleProvider>
  <Slot />
</ExampleProvider>

// In any child component
import { useExample } from '@/contexts/ExampleContext';

function MyComponent() {
  const { data, addItem } = useExample();
  // ...
}
```

### Local State (useState)
Use for component-specific state:

```typescript
const [value, setValue] = useState('');
const [isOpen, setIsOpen] = useState(false);
const [items, setItems] = useState<Item[]>([]);
```

### Derived State (useMemo)
Use for computed values:

```typescript
const filteredItems = useMemo(() => {
  return items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [items, searchQuery]);
```

### Side Effects (useEffect)
```typescript
// Load data on mount
useEffect(() => {
  loadData();
}, []);

// Watch dependency changes
useEffect(() => {
  if (userId) {
    loadUserData(userId);
  }
}, [userId]);

// Cleanup
useEffect(() => {
  const subscription = api.subscribe();
  return () => subscription.unsubscribe();
}, []);
```

---

## Custom Hooks

### Available Hooks

#### 1. usePullToRefresh
```typescript
import { usePullToRefresh } from '@/hooks';

const { refreshing, onRefresh } = usePullToRefresh({
  onRefresh: async () => {
    await loadData();
  },
});

<ScrollView
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
>
  {/* Content */}
</ScrollView>
```

#### 2. useNetworkStatus
```typescript
import { useNetworkStatus } from '@/hooks';

const { isConnected, connectionType } = useNetworkStatus();

if (!isConnected) {
  return <OfflineBanner />;
}
```

#### 3. useHaptics
```typescript
import { useHaptics } from '@/hooks';

const { impact, notification, selection } = useHaptics();

const handlePress = () => {
  impact('medium'); // 'light' | 'medium' | 'heavy'
  onPress();
};
```

#### 4. useCopilotSession
```typescript
import { useCopilotSession } from '@/hooks';

const {
  messages,
  sendMessage,
  isStreaming,
  error,
} = useCopilotSession();
```

### Creating Custom Hooks

```typescript
// hooks/useMyHook.ts
import { useState, useEffect } from 'react';

export function useMyHook(param: string) {
  const [data, setData] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function load() {
      try {
        const result = await fetchData(param);
        setData(result);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [param]);
  
  return { data, loading };
}

// Usage
import { useMyHook } from '@/hooks/useMyHook';

const { data, loading } = useMyHook('param');
```

---

## Common Patterns

### Screen Pattern
```typescript
export default function MyScreen() {
  // 1. Context & Hooks
  const { user } = useUser();
  const { isConnected } = useNetworkStatus();
  
  // 2. Local State
  const [data, setData] = useState<Data[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 3. Data Loading
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const result = await fetchData();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 4. Event Handlers
  const handleAction = () => {
    router.push('/next-screen');
  };
  
  // 5. Early Returns
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;
  
  // 6. Render
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="My Screen" showBackButton />
      <ScrollView>
        {/* Content */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.background,
  },
});
```

### Form Pattern
```typescript
export default function FormScreen() {
  const [formData, setFormData] = useState({
    field1: '',
    field2: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.field1) {
      newErrors.field1 = 'Field 1 is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validate()) return;
    
    try {
      setSubmitting(true);
      await submitForm(formData);
      router.push('/success');
    } catch (error) {
      // Handle error
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <SafeAreaView>
      <AppHeader title="Form" showBackButton />
      <ScrollView>
        <TextInput
          label="Field 1"
          value={formData.field1}
          onChangeText={(value) => setFormData(prev => ({ ...prev, field1: value }))}
          error={errors.field1}
        />
        
        <Button onPress={handleSubmit} isLoading={submitting}>
          Submit
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
```

### List Pattern
```typescript
export default function ListScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadItems();
  }, []);
  
  const loadItems = async () => {
    const data = await fetchItems();
    setItems(data);
    setLoading(false);
  };
  
  const { refreshing, onRefresh } = usePullToRefresh({ onRefresh: loadItems });
  
  if (loading) return <LoadingState />;
  
  return (
    <SafeAreaView>
      <AppHeader title="List" />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {items.length > 0 ? (
          items.map(item => (
            <ItemCard key={item.id} item={item} onPress={handlePress} />
          ))
        ) : (
          <EmptyState message="No items found" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

### Modal Pattern
```typescript
export default function ScreenWithModal() {
  const [modalVisible, setModalVisible] = useState(false);
  
  return (
    <SafeAreaView>
      {/* Screen content */}
      <Button onPress={() => setModalVisible(true)}>
        Open Modal
      </Button>
      
      {/* Modal */}
      <BottomSheet
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Modal Title"
      >
        <ModalContent />
      </BottomSheet>
    </SafeAreaView>
  );
}
```

---

## Testing

### Unit Tests (Jest + React Native Testing Library)

#### Component Test
```typescript
// __tests__/components/Button.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <Button onPress={() => {}}>Click me</Button>
    );
    
    expect(getByText('Click me')).toBeTruthy();
  });
  
  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <Button onPress={onPress}>Click</Button>
    );
    
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalled();
  });
  
  it('shows loading spinner when isLoading', () => {
    const { queryByTestId } = render(
      <Button onPress={() => {}} isLoading>Submit</Button>
    );
    
    expect(queryByTestId('activity-indicator')).toBeTruthy();
  });
  
  it('is disabled when disabled prop is true', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <Button onPress={onPress} disabled>Click</Button>
    );
    
    fireEvent.press(getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

#### Hook Test
```typescript
// __tests__/hooks/useNetworkStatus.test.ts
import { renderHook } from '@testing-library/react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

describe('useNetworkStatus', () => {
  it('returns connection status', () => {
    const { result } = renderHook(() => useNetworkStatus());
    
    expect(result.current).toHaveProperty('isConnected');
    expect(typeof result.current.isConnected).toBe('boolean');
  });
});
```

### Integration Tests
```typescript
// __tests__/integration/send-money-flow.test.ts
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import SendMoneyFlow from '@/app/send-money';

describe('Send Money Flow', () => {
  it('completes full send money flow', async () => {
    const { getByText, getByPlaceholderText } = render(
      <NavigationContainer>
        <SendMoneyFlow />
      </NavigationContainer>
    );
    
    // Select recipient
    fireEvent.press(getByText('John Doe'));
    
    // Enter amount
    const amountInput = getByPlaceholderText('0.00');
    fireEvent.changeText(amountInput, '50');
    fireEvent.press(getByText('Continue'));
    
    // Confirm
    await waitFor(() => {
      expect(getByText('Confirm')).toBeTruthy();
    });
    fireEvent.press(getByText('Confirm'));
    
    // Success
    await waitFor(() => {
      expect(getByText('Money Sent!')).toBeTruthy();
    });
  });
});
```

### E2E Tests (Detox)
```typescript
// e2e/critical-paths.test.ts
describe('Critical User Paths', () => {
  beforeAll(async () => {
    await device.launchApp();
  });
  
  it('should complete onboarding', async () => {
    await element(by.text('Get Started')).tap();
    await element(by.id('phone-input')).typeText('81234567');
    await element(by.text('Continue')).tap();
    // ... more steps
  });
  
  it('should send money', async () => {
    await element(by.id('send-fab')).tap();
    await element(by.text('John Doe')).tap();
    await element(by.id('amount-input')).typeText('50');
    await element(by.text('Continue')).tap();
    await element(by.text('Confirm')).tap();
    await expect(element(by.text('Money Sent!'))).toBeVisible();
  });
});
```

### Running Tests
```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# E2E (iOS)
npm run e2e:build:ios
npm run e2e:test:ios

# E2E (Android)
npm run e2e:build:android
npm run e2e:test:android
```

---

## Common Patterns

### 1. Accessibility
```typescript
<TouchableOpacity
  onPress={handlePress}
  accessibilityRole="button"
  accessibilityLabel="Send money"
  accessibilityHint="Opens send money form"
  accessibilityState={{ disabled: isDisabled }}
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
>
  <Text>Send</Text>
</TouchableOpacity>
```

### 2. Haptic Feedback
```typescript
import * as Haptics from 'expo-haptics';

// Light impact (secondary actions)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium impact (primary actions)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Heavy impact (important actions)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Success notification
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Error notification
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
```

### 3. Animations
```typescript
import { Animated } from 'react-native';

const fadeAnim = useRef(new Animated.Value(0)).current;

// Fade in
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: DS.animations.normal,
  useNativeDriver: true,
}).start();

// Scale on press
const scaleAnim = useRef(new Animated.Value(1)).current;

const handlePressIn = () => {
  Animated.timing(scaleAnim, {
    toValue: 0.98,
    duration: 150,
    useNativeDriver: true,
  }).start();
};

const handlePressOut = () => {
  Animated.spring(scaleAnim, {
    toValue: 1,
    friction: 5,
    useNativeDriver: true,
  }).start();
};

<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
  <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut}>
    {/* Content */}
  </TouchableOpacity>
</Animated.View>
```

### 4. Safe Area Handling
```typescript
import { SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView edges={['top', 'bottom']}>
  {/* Content */}
</SafeAreaView>

// Or specific edges
<SafeAreaView edges={['top']}>
  {/* Only top safe area */}
</SafeAreaView>
```

### 5. Keyboard Handling
```typescript
import { KeyboardAvoidingView, Platform } from 'react-native';

<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
>
  <ScrollView keyboardShouldPersistTaps="handled">
    {/* Form content */}
  </ScrollView>
</KeyboardAvoidingView>
```

### 6. Image Handling
```typescript
import { Image } from 'react-native';

// Local image
<Image 
  source={require('@/assets/logo.png')} 
  style={styles.logo}
/>

// Remote image with fallback
<Image
  source={{ uri: user.photoUri }}
  defaultSource={require('@/assets/avatar-placeholder.png')}
  style={styles.avatar}
/>
```

### 7. Conditional Rendering
```typescript
// Simple conditional
{isLoading && <ActivityIndicator />}

// If-else
{isLoading ? (
  <LoadingState />
) : (
  <Content />
)}

// Multiple conditions
{loading ? (
  <LoadingState />
) : error ? (
  <ErrorState message={error} />
) : items.length === 0 ? (
  <EmptyState />
) : (
  <ItemList items={items} />
)}
```

---

## Troubleshooting

### Common Issues

#### 1. "Unable to resolve module"
**Problem:** Import path not found

**Solution:**
```bash
# Clear Metro bundler cache
npm start -- --clear

# Or
npx expo start -c

# Reinstall dependencies
rm -rf node_modules
npm install
```

#### 2. "Invariant Violation: requireNativeComponent"
**Problem:** Native module not linked

**Solution:**
```bash
# Rebuild iOS
cd ios && pod install && cd ..
npm run ios

# Rebuild Android
npm run android
```

#### 3. "TypeError: Cannot read property 'X' of undefined"
**Problem:** Context used outside provider

**Solution:**
```typescript
// Ensure component is wrapped in provider
<UserProvider>
  <MyComponent />
</UserProvider>

// Add context check in hook
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
```

#### 4. Styles not applying
**Problem:** StyleSheet not applying correctly

**Solution:**
```typescript
// Ensure style is an array if merging
<View style={[styles.base, customStyle]} />

// Not
<View style={styles.base, customStyle} />  // ❌ Wrong

// Check for typos in DS tokens
backgroundColor: DS.colors.background  // ✅ Correct
backgroundColor: DS.color.background   // ❌ Wrong (singular)
```

#### 5. Navigation not working
**Problem:** Router push not navigating

**Solution:**
```typescript
// Ensure path is correct (matches file structure)
router.push('/(tabs)/home');  // ✅ Correct
router.push('/tabs/home');    // ❌ Wrong

// For TypeScript, cast as never
router.push('/(tabs)/home' as never);

// Check _layout.tsx exists for route groups
```

#### 6. Android back button not working
**Problem:** Hardware back button ignored

**Solution:**
```typescript
import { useEffect } from 'react';
import { BackHandler } from 'react-native';

useEffect(() => {
  const backHandler = BackHandler.addEventListener(
    'hardwareBackPress',
    () => {
      router.back();
      return true; // Prevent default
    }
  );
  
  return () => backHandler.remove();
}, []);
```

#### 7. Slow performance
**Problem:** App lagging or freezing

**Solutions:**
```typescript
// Use FlatList for long lists (not ScrollView)
<FlatList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
  keyExtractor={(item) => item.id}
  initialNumToRender={10}
  maxToRenderPerBatch={5}
  windowSize={5}
/>

// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize components
const MemoizedItem = React.memo(ItemCard);

// Use useCallback for handlers
const handlePress = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

#### 8. Context re-renders
**Problem:** Entire app re-renders on context change

**Solution:**
```typescript
// Split contexts by concern
// ❌ One big context
<AppContext.Provider value={{ user, wallets, transactions, ... }}>

// ✅ Multiple focused contexts
<UserProvider>
  <WalletsProvider>
    <TransactionsProvider>
      <App />
    </TransactionsProvider>
  </WalletsProvider>
</UserProvider>

// Use memo for context value
const contextValue = useMemo(() => ({
  data,
  updateData,
}), [data]);

<Context.Provider value={contextValue}>
```

### Debug Tools

#### React DevTools
```bash
# Install
npm install -g react-devtools

# Run
react-devtools

# Then shake device or press Cmd+D (iOS) / Cmd+M (Android)
# Select "Toggle Element Inspector"
```

#### Expo Dev Tools
```bash
# Shake device or press Cmd+D (iOS) / Cmd+M (Android)
# Options:
# - Reload
# - Toggle Performance Monitor
# - Toggle Element Inspector
# - Debug Remote JS
```

#### Console Logging
```typescript
// Debug component renders
useEffect(() => {
  console.log('Component mounted');
  return () => console.log('Component unmounted');
}, []);

// Debug prop changes
useEffect(() => {
  console.log('Prop changed:', propName);
}, [propName]);

// Debug API calls
console.log('API Request:', endpoint, data);
console.log('API Response:', response);
```

### Performance Profiling

```typescript
// React Profiler
import { Profiler } from 'react';

function onRenderCallback(
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
  interactions
) {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}

<Profiler id="MyScreen" onRender={onRenderCallback}>
  <MyScreen />
</Profiler>
```

---

## Code Style Guide

### Naming Conventions
```typescript
// Components: PascalCase
export function MyComponent() {}

// Hooks: camelCase with 'use' prefix
export function useMyHook() {}

// Constants: UPPER_SNAKE_CASE
export const MAX_AMOUNT = 5000;

// Variables: camelCase
const userName = 'John';
const isActive = true;

// Types/Interfaces: PascalCase
interface UserProfile {}
type ButtonVariant = 'primary' | 'secondary';

// Files: Component names = PascalCase, others = camelCase
MyComponent.tsx
useMyHook.ts
formatters.ts
```

### Import Order
```typescript
// 1. React
import React, { useState, useEffect } from 'react';

// 2. React Native
import { View, Text, StyleSheet } from 'react-native';

// 3. Third-party libraries
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// 4. Absolute imports (components)
import { Button, TextInput } from '@/components/ui';
import { AppHeader } from '@/components/layout';

// 5. Absolute imports (contexts, hooks, services)
import { useUser } from '@/contexts/UserContext';
import { usePullToRefresh } from '@/hooks';
import { sendMoney } from '@/services/send';

// 6. Constants
import { designSystem as DS } from '@/constants/designSystem';

// 7. Types
import type { User, Wallet } from '@/types';
```

### File Structure Order
```typescript
/**
 * File header comment
 */

// 1. Imports
import ...

// 2. Constants (component-level)
const MAX_LENGTH = 100;

// 3. Types/Interfaces
interface Props {}
type Variant = 'a' | 'b';

// 4. Component
export function Component({ ... }: Props) {
  // 4a. Hooks
  const { user } = useUser();
  const [state, setState] = useState();
  
  // 4b. Derived state
  const computed = useMemo(() => ..., []);
  
  // 4c. Effects
  useEffect(() => ..., []);
  
  // 4d. Handlers
  const handlePress = () => {};
  
  // 4e. Early returns
  if (loading) return <LoadingState />;
  
  // 4f. Render
  return <View>{/* JSX */}</View>;
}

// 5. Styles
const styles = StyleSheet.create({ ... });

// 6. Helper functions (private)
function helperFunction() {}
```

---

## Best Practices

### Performance
1. **Use FlatList for long lists** (not ScrollView + map)
2. **Memoize expensive computations** (useMemo)
3. **Memoize callbacks** (useCallback)
4. **Memoize components** (React.memo)
5. **Optimize images** (proper size, caching)
6. **Lazy load screens** (React.lazy)
7. **Avoid inline styles** (use StyleSheet.create)
8. **Limit context re-renders** (split contexts)

### Security
1. **Never store sensitive data unencrypted**
2. **Use SecureStore for tokens/PINs**
3. **Hash PINs before sending**
4. **Validate all user input**
5. **Sanitize display data**
6. **Use HTTPS only**
7. **Implement token refresh**
8. **Add request timeouts**

### Accessibility
1. **Add accessibilityLabel to all interactive elements**
2. **Use accessibilityRole for semantic meaning**
3. **Ensure touch targets ≥44×44px**
4. **Test with VoiceOver/TalkBack**
5. **Support dynamic type**
6. **Maintain focus order**
7. **Provide error announcements**

### Code Quality
1. **Use TypeScript strictly** (no any)
2. **Export prop types**
3. **Add JSDoc comments**
4. **Follow ESLint rules**
5. **Write tests for critical paths**
6. **Keep components small** (<300 lines)
7. **Extract reusable logic to hooks**
8. **Use design system tokens** (no hardcoded values)

---

## Project Commands

### Development
```bash
npm start                  # Start Expo dev server
npm run ios                # Run on iOS simulator
npm run android            # Run on Android emulator
npm run web                # Run in web browser
```

### Testing
```bash
npm test                   # Run unit tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
npm run e2e:test:ios       # E2E tests (iOS)
npm run e2e:test:android   # E2E tests (Android)
```

### Code Quality
```bash
npm run lint               # Run ESLint
npm run lint:fix           # Auto-fix lint issues
npm run type-check         # TypeScript type checking
```

### Build
```bash
npm run build:ios          # Build iOS app
npm run build:android      # Build Android app
eas build --platform ios   # EAS build (iOS)
eas build --platform android # EAS build (Android)
```

---

## Useful Resources

### Documentation
- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Tools
- [React DevTools](https://react-devtools-tutorial.vercel.app/)
- [Expo DevTools](https://docs.expo.dev/debugging/)
- [Flipper](https://fbflipper.com/) (advanced debugging)

### Design
- [Figma File](https://www.figma.com/file/VeGAwsChUvwTBZxAU6H8VQ)
- [Ionicons](https://ionic.io/ionicons)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Contributing

### Branching Strategy
```bash
# Create feature branch
git checkout -b feature/my-feature

# Create bugfix branch
git checkout -b bugfix/issue-123

# Create hotfix branch
git checkout -b hotfix/critical-fix
```

### Commit Messages
```
feat: Add wallet creation flow
fix: Fix OTP verification timeout
docs: Update component library
style: Format auth screens
refactor: Extract common validation logic
test: Add tests for send money flow
chore: Update dependencies
```

### Pull Request Checklist
- [ ] Code follows style guide
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No console errors/warnings
- [ ] Accessibility tested
- [ ] Design system used correctly
- [ ] Documentation updated
- [ ] PR description explains changes

---

**Document Version:** 1.0.0  
**Last Updated:** March 17, 2026  
**Maintainer:** SmartPay Development Team
