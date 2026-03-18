/**
 * Smartpay MMKV + Zustand Store Usage Examples
 * 
 * This file contains practical examples of using the store in various scenarios.
 * Copy these patterns into your components as needed.
 * 
 * Location: fintech/smartpay/mobile/store/USAGE_EXAMPLES.tsx
 */

import React, { useEffect } from 'react';
import { View, Text, Button, Switch, FlatList, TouchableOpacity } from 'react-native';
import {
  useBalanceStore,
  useUserStore,
  useWalletStore,
  useSettingsStore,
  type Transaction,
  type CachedWallet,
} from '@/store';

// ============================================================================
// EXAMPLE 1: Balance & Transactions
// ============================================================================

export function BalanceExample() {
  const { balance, transactions, runTransaction, clearTransactions } = useBalanceStore();

  const handleAddMoney = () => {
    runTransaction({
      id: Date.now().toString(),
      title: 'Cash Deposit',
      amount: 50000, // N$500.00 in cents
    });
  };

  const handleWithdraw = () => {
    runTransaction({
      id: Date.now().toString(),
      title: 'ATM Withdrawal',
      amount: -20000, // -N$200.00 in cents
    });
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        Balance: N${(balance() / 100).toFixed(2)}
      </Text>

      <View style={{ flexDirection: 'row', gap: 10, marginVertical: 20 }}>
        <Button title="Add N$500" onPress={handleAddMoney} />
        <Button title="Withdraw N$200" onPress={handleWithdraw} />
        <Button title="Clear All" onPress={clearTransactions} />
      </View>

      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
        Recent Transactions
      </Text>

      {transactions.length === 0 ? (
        <Text>No transactions yet</Text>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: '#eee',
              }}
            >
              <View>
                <Text style={{ fontWeight: '600' }}>{item.title}</Text>
                <Text style={{ fontSize: 12, color: '#666' }}>
                  {new Date(item.date).toLocaleString()}
                </Text>
              </View>
              <Text
                style={{
                  fontWeight: 'bold',
                  color: item.amount > 0 ? '#22c55e' : '#ef4444',
                }}
              >
                {item.amount > 0 ? '+' : ''}N${(item.amount / 100).toFixed(2)}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

// ============================================================================
// EXAMPLE 2: User Preferences
// ============================================================================

export function UserPreferencesExample() {
  const { preferences, updatePreference, updatePreferences, setBiometric } = useUserStore();

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
        User Preferences
      </Text>

      {/* Theme Toggle */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 15,
        }}
      >
        <Text>Dark Mode</Text>
        <Switch
          value={preferences.theme === 'dark'}
          onValueChange={(value) => updatePreference('theme', value ? 'dark' : 'light')}
        />
      </View>

      {/* Notifications */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 15,
        }}
      >
        <Text>Notifications</Text>
        <Switch
          value={preferences.notificationsEnabled}
          onValueChange={(value) => updatePreference('notificationsEnabled', value)}
        />
      </View>

      {/* Transaction Alerts */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 15,
        }}
      >
        <Text>Transaction Alerts</Text>
        <Switch
          value={preferences.transactionAlerts}
          onValueChange={(value) => updatePreference('transactionAlerts', value)}
        />
      </View>

      {/* Biometric */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 15,
        }}
      >
        <Text>Face ID / Touch ID</Text>
        <Switch
          value={preferences.biometricEnabled}
          onValueChange={(value) => setBiometric(value, true)}
        />
      </View>

      {/* Haptic Feedback */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 15,
        }}
      >
        <Text>Haptic Feedback</Text>
        <Switch
          value={preferences.hapticFeedback}
          onValueChange={(value) => updatePreference('hapticFeedback', value)}
        />
      </View>

      {/* Batch Update Example */}
      <Button
        title="Enable All Security Features"
        onPress={() =>
          updatePreferences({
            biometricEnabled: true,
            biometricForTransactions: true,
            transactionAlerts: true,
            notificationsEnabled: true,
          })
        }
      />

      {/* Current State */}
      <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f5f5f5' }}>
        <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>
          {JSON.stringify(preferences, null, 2)}
        </Text>
      </View>
    </View>
  );
}

// ============================================================================
// EXAMPLE 3: Wallet Cache
// ============================================================================

export function WalletCacheExample() {
  const {
    wallets,
    selectedWalletId,
    selectWallet,
    updateWallets,
    getPrimaryWallet,
    getTotalBalance,
    addRecentTransaction,
  } = useWalletStore();

  // Simulate loading wallets from API
  useEffect(() => {
    const mockWallets: CachedWallet[] = [
      {
        id: '1',
        name: 'Main Wallet',
        type: 'general',
        balance: 125000,
        currency: 'NAD',
        isPrimary: true,
        tier: 'standard',
        kycRequired: false,
        color: '#0029D6',
        icon: 'wallet',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Savings',
        type: 'savings',
        balance: 350000,
        currency: 'NAD',
        isPrimary: false,
        tier: 'premium',
        kycRequired: false,
        color: '#22C55E',
        icon: 'cash',
        lastUpdated: new Date().toISOString(),
      },
    ];

    updateWallets(mockWallets);
  }, [updateWallets]);

  const primaryWallet = getPrimaryWallet();
  const totalBalance = getTotalBalance();

  const handleSendMoney = () => {
    if (selectedWalletId) {
      addRecentTransaction({
        id: Date.now().toString(),
        walletId: selectedWalletId,
        type: 'send',
        amount: 10000,
        currency: 'NAD',
        description: 'Sent to John Doe',
        recipient: 'John Doe',
        timestamp: new Date().toISOString(),
      });
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
        My Wallets
      </Text>

      {/* Total Balance */}
      <View style={{ backgroundColor: '#0029D6', padding: 20, borderRadius: 10, marginBottom: 20 }}>
        <Text style={{ color: 'white', fontSize: 14 }}>Total Balance</Text>
        <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>
          N${(totalBalance / 100).toFixed(2)}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 5 }}>
          Primary: {primaryWallet?.name}
        </Text>
      </View>

      {/* Wallet List */}
      <FlatList
        data={wallets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              padding: 15,
              backgroundColor: selectedWalletId === item.id ? '#e0f2fe' : '#f5f5f5',
              borderRadius: 10,
              marginBottom: 10,
              borderWidth: selectedWalletId === item.id ? 2 : 0,
              borderColor: '#0284c7',
            }}
            onPress={() => selectWallet(item.id)}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.name}</Text>
                <Text style={{ color: '#666', fontSize: 12, textTransform: 'capitalize' }}>
                  {item.type} • {item.tier}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontWeight: 'bold', fontSize: 18 }}>
                  N${(item.balance / 100).toFixed(2)}
                </Text>
                {item.isPrimary && (
                  <Text style={{ fontSize: 10, color: '#22c55e' }}>PRIMARY</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Actions */}
      <View style={{ marginTop: 20 }}>
        <Button
          title="Send Money"
          onPress={handleSendMoney}
          disabled={!selectedWalletId}
        />
      </View>
    </View>
  );
}

// ============================================================================
// EXAMPLE 4: Security Settings
// ============================================================================

export function SecuritySettingsExample() {
  const { security, updateSecurity, recordAuth, isAuthRequired, resetFailedAttempts } =
    useSettingsStore();

  const handleAuthenticate = (success: boolean) => {
    recordAuth(success);
    if (success) {
      alert('Authentication successful!');
    } else {
      alert(`Authentication failed. Attempts: ${security.failedAuthAttempts + 1}/3`);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
        Security Settings
      </Text>

      {/* Auth Required Status */}
      {isAuthRequired() && (
        <View
          style={{
            backgroundColor: '#fef3c7',
            padding: 15,
            borderRadius: 10,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: '#92400e', fontWeight: 'bold' }}>
            Authentication Required
          </Text>
          <Text style={{ color: '#92400e', marginTop: 5 }}>
            Please authenticate to continue
          </Text>
        </View>
      )}

      {/* Failed Attempts */}
      {security.failedAuthAttempts > 0 && (
        <View
          style={{
            backgroundColor: '#fee2e2',
            padding: 15,
            borderRadius: 10,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: '#991b1b', fontWeight: 'bold' }}>
            Failed Attempts: {security.failedAuthAttempts}/3
          </Text>
          <Button title="Reset" onPress={resetFailedAttempts} />
        </View>
      )}

      {/* Auto-lock Timeout */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontWeight: '600', marginBottom: 10 }}>Auto-lock Timeout</Text>
        {[
          { label: 'Immediately', value: 0 },
          { label: '1 minute', value: 60 },
          { label: '5 minutes', value: 300 },
          { label: '15 minutes', value: 900 },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={{
              padding: 15,
              backgroundColor:
                security.autoLockTimeout === option.value ? '#e0f2fe' : '#f5f5f5',
              borderRadius: 10,
              marginBottom: 10,
            }}
            onPress={() => updateSecurity({ autoLockTimeout: option.value })}
          >
            <Text>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Toggles */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 15,
        }}
      >
        <Text>Require Auth for Transactions</Text>
        <Switch
          value={security.requireAuthForTransactions}
          onValueChange={(value) => updateSecurity({ requireAuthForTransactions: value })}
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 15,
        }}
      >
        <Text>Screenshot Protection</Text>
        <Switch
          value={security.screenshotProtection}
          onValueChange={(value) => updateSecurity({ screenshotProtection: value })}
        />
      </View>

      {/* Test Authentication */}
      <View style={{ marginTop: 20, gap: 10 }}>
        <Button title="Test Success Auth" onPress={() => handleAuthenticate(true)} />
        <Button title="Test Failed Auth" onPress={() => handleAuthenticate(false)} />
      </View>
    </View>
  );
}

// ============================================================================
// EXAMPLE 5: Display Settings
// ============================================================================

export function DisplaySettingsExample() {
  const { display, updateDisplay } = useSettingsStore();

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
        Display Settings
      </Text>

      {/* Chart Period */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontWeight: '600', marginBottom: 10 }}>Chart Period</Text>
        {[
          { label: '7 days', value: 7 },
          { label: '30 days', value: 30 },
          { label: '90 days', value: 90 },
          { label: '1 year', value: 365 },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={{
              padding: 15,
              backgroundColor: display.chartPeriod === option.value ? '#e0f2fe' : '#f5f5f5',
              borderRadius: 10,
              marginBottom: 10,
            }}
            onPress={() => updateDisplay({ chartPeriod: option.value as 7 | 30 | 90 | 365 })}
          >
            <Text>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Toggles */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 15,
        }}
      >
        <Text>Show Categories</Text>
        <Switch
          value={display.showCategories}
          onValueChange={(value) => updateDisplay({ showCategories: value })}
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 15,
        }}
      >
        <Text>Show Merchant Logos</Text>
        <Switch
          value={display.showMerchantLogos}
          onValueChange={(value) => updateDisplay({ showMerchantLogos: value })}
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 15,
        }}
      >
        <Text>Compact Transaction List</Text>
        <Switch
          value={display.compactTransactionList}
          onValueChange={(value) => updateDisplay({ compactTransactionList: value })}
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 15,
        }}
      >
        <Text>Show Balance Chart</Text>
        <Switch
          value={display.showBalanceChart}
          onValueChange={(value) => updateDisplay({ showBalanceChart: value })}
        />
      </View>
    </View>
  );
}

// ============================================================================
// EXAMPLE 6: Using Outside Components (Utility Functions)
// ============================================================================

// Check authentication requirement without being in a component
export function checkAuthStatus(): boolean {
  return useSettingsStore.getState().isAuthRequired();
}

// Get current balance from anywhere
export function getCurrentBalance(): number {
  return useBalanceStore.getState().balance();
}

// Add transaction from API response
export function recordTransactionFromAPI(transaction: Omit<Transaction, 'date'>) {
  useBalanceStore.getState().runTransaction(transaction);
}

// Update wallet cache from API
export function syncWalletsFromAPI(wallets: CachedWallet[]) {
  useWalletStore.getState().updateWallets(wallets);
}

// Log out - clear all stores
export function handleLogout() {
  useBalanceStore.getState().clearTransactions();
  useWalletStore.getState().clearCache();
  useUserStore.getState().resetPreferences();
  useSettingsStore.getState().resetSettings();
}
