/**
 * Usage Examples – Smartpay Mobile Contexts
 * Demonstrates how to use the newly implemented contexts
 * Location: fintech/smartpay/mobile/USAGE_EXAMPLES.tsx
 */
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useWallets } from '@/contexts/WalletsContext';
import { useCopilot } from '@/contexts/copilot/CopilotContext';
import { useGroups } from '@/contexts/GroupsContext';

/**
 * Example 1: Display Wallets with Total Balance
 */
export function WalletsExample() {
  const { wallets, totalBalance, primaryWallet, isLoading, error, refresh } = useWallets();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
        <Text className="mt-4">Loading wallets...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-red-600 text-center">{error}</Text>
        <TouchableOpacity 
          onPress={refresh}
          className="mt-4 px-6 py-3 bg-blue-600 rounded-lg"
        >
          <Text className="text-white font-medium">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Total Balance Card */}
      <View className="bg-blue-600 p-6 rounded-b-3xl">
        <Text className="text-white text-sm opacity-80">Total Balance</Text>
        <Text className="text-white text-4xl font-bold mt-2">
          NAD {(totalBalance / 100).toFixed(2)}
        </Text>
        {primaryWallet && (
          <Text className="text-white text-sm mt-2 opacity-80">
            Primary: {primaryWallet.name}
          </Text>
        )}
      </View>

      {/* Wallets List */}
      <View className="p-4">
        <Text className="text-lg font-semibold mb-4">My Wallets</Text>
        {wallets.map((wallet) => (
          <View 
            key={wallet.id}
            className="bg-white p-4 rounded-xl mb-3 shadow-sm"
          >
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-lg font-semibold">{wallet.name}</Text>
                <Text className="text-sm text-gray-600 capitalize">
                  {wallet.type} • {wallet.tier}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xl font-bold">
                  NAD {(wallet.balance / 100).toFixed(2)}
                </Text>
                {wallet.isPrimary && (
                  <View className="bg-blue-100 px-2 py-1 rounded mt-1">
                    <Text className="text-blue-600 text-xs font-medium">Primary</Text>
                  </View>
                )}
              </View>
            </View>
            {wallet.kycRequired && (
              <View className="mt-3 p-2 bg-yellow-50 rounded">
                <Text className="text-yellow-700 text-xs">
                  KYC verification required
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Refresh Button */}
      <TouchableOpacity 
        onPress={refresh}
        className="mx-4 mb-6 px-6 py-3 bg-gray-200 rounded-lg"
      >
        <Text className="text-center font-medium">Refresh Wallets</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/**
 * Example 2: Send Money with Copilot Confirmation
 */
export function SendMoneyExample() {
  const { setPendingAction } = useCopilot();
  const { primaryWallet } = useWallets();

  const handleSendMoney = (recipientName: string, amount: number) => {
    setPendingAction({
      type: 'send_money',
      label: 'Confirm Transfer',
      detail: `Send NAD ${(amount / 100).toFixed(2)} to ${recipientName}`,
      payload: {
        amount,
        recipientName,
        fromWalletId: primaryWallet?.id,
      },
      resolve: async (confirmed) => {
        if (confirmed) {
          console.log('Executing transfer...');
          // Execute API call here
          // await transferMoney({ amount, recipientName });
        } else {
          console.log('Transfer cancelled');
        }
      }
    });
  };

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-6">Send Money</Text>
      
      {/* Quick Send Options */}
      <View className="space-y-3">
        <TouchableOpacity 
          onPress={() => handleSendMoney('John Doe', 10000)}
          className="p-4 bg-blue-50 rounded-xl border border-blue-200"
        >
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="font-semibold text-lg">John Doe</Text>
              <Text className="text-gray-600">+264 81 123 4567</Text>
            </View>
            <Text className="text-blue-600 font-bold">NAD 100.00</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => handleSendMoney('Jane Smith', 25000)}
          className="p-4 bg-blue-50 rounded-xl border border-blue-200"
        >
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="font-semibold text-lg">Jane Smith</Text>
              <Text className="text-gray-600">+264 81 987 6543</Text>
            </View>
            <Text className="text-blue-600 font-bold">NAD 250.00</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View className="mt-6 p-4 bg-gray-50 rounded-xl">
        <Text className="text-sm text-gray-600">
          💡 Tap a contact to send money. You'll be asked to confirm before the transfer is processed.
        </Text>
      </View>
    </View>
  );
}

/**
 * Example 3: Display Groups List
 */
export function GroupsExample() {
  const { groups, isLoading, error, refresh } = useGroups();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
        <Text className="mt-4">Loading groups...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-red-600 text-center">{error}</Text>
        <TouchableOpacity 
          onPress={refresh}
          className="mt-4 px-6 py-3 bg-blue-600 rounded-lg"
        >
          <Text className="text-white font-medium">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-2xl font-bold mb-4">My Groups</Text>
        
        {groups.length === 0 ? (
          <View className="bg-white p-8 rounded-xl items-center">
            <Text className="text-gray-600 text-center">
              You're not part of any groups yet
            </Text>
            <TouchableOpacity className="mt-4 px-6 py-3 bg-blue-600 rounded-lg">
              <Text className="text-white font-medium">Create Group</Text>
            </TouchableOpacity>
          </View>
        ) : (
          groups.map((group) => (
            <View 
              key={group.id}
              className="bg-white p-4 rounded-xl mb-3 shadow-sm"
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-lg font-semibold">{group.name}</Text>
                    {group.isAdmin && (
                      <View className="bg-purple-100 px-2 py-1 rounded">
                        <Text className="text-purple-600 text-xs font-medium">Admin</Text>
                      </View>
                    )}
                  </View>
                  {group.description && (
                    <Text className="text-sm text-gray-600 mt-1">
                      {group.description}
                    </Text>
                  )}
                  <View className="flex-row items-center mt-2 gap-4">
                    <Text className="text-sm text-gray-600 capitalize">
                      {group.type}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {group.members.length} members
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-xl font-bold">
                    NAD {(group.balance / 100).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Refresh Button */}
      <TouchableOpacity 
        onPress={refresh}
        className="mx-4 mb-6 px-6 py-3 bg-gray-200 rounded-lg"
      >
        <Text className="text-center font-medium">Refresh Groups</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/**
 * Example 4: Wallet Management with Actions
 */
export function WalletManagementExample() {
  const { wallets, hasLinkedAccounts, linkedAccounts, refresh } = useWallets();
  const { setPendingAction } = useCopilot();

  const handleCreateWallet = () => {
    setPendingAction({
      type: 'create_wallet',
      label: 'Create New Wallet',
      detail: 'Create a new savings wallet?',
      payload: {
        name: 'Savings',
        type: 'savings',
      },
      resolve: async (confirmed) => {
        if (confirmed) {
          console.log('Creating wallet...');
          // await createWallet({ name: 'Savings', type: 'savings' });
          await refresh();
        }
      }
    });
  };

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-6">Wallet Management</Text>

      {/* Wallet Count */}
      <View className="bg-blue-50 p-4 rounded-xl mb-4">
        <Text className="text-blue-900 text-lg font-semibold">
          {wallets.length} {wallets.length === 1 ? 'Wallet' : 'Wallets'}
        </Text>
        <Text className="text-blue-700 text-sm mt-1">
          {hasLinkedAccounts 
            ? `${linkedAccounts.length} linked bank account(s)` 
            : 'No linked bank accounts'}
        </Text>
      </View>

      {/* Create Wallet Button */}
      <TouchableOpacity 
        onPress={handleCreateWallet}
        className="bg-blue-600 p-4 rounded-xl mb-4"
      >
        <Text className="text-white text-center font-semibold text-lg">
          Create New Wallet
        </Text>
      </TouchableOpacity>

      {/* Linked Accounts */}
      {hasLinkedAccounts && (
        <View className="mt-4">
          <Text className="text-lg font-semibold mb-3">Linked Accounts</Text>
          {linkedAccounts.map((account) => (
            <View 
              key={account.id}
              className="bg-gray-50 p-4 rounded-xl mb-2"
            >
              <View className="flex-row justify-between">
                <View>
                  <Text className="font-semibold">{account.bankName}</Text>
                  <Text className="text-gray-600 text-sm">
                    {account.accountNumber}
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    {account.accountHolder}
                  </Text>
                </View>
                {account.isDefault && (
                  <View className="bg-green-100 px-2 py-1 rounded h-fit">
                    <Text className="text-green-600 text-xs font-medium">Default</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Example 5: Complete Flow - Group Payment
 */
export function GroupPaymentExample() {
  const { groups } = useGroups();
  const { primaryWallet } = useWallets();
  const { setPendingAction } = useCopilot();

  const handleContributeToGroup = (groupId: string, groupName: string, amount: number) => {
    setPendingAction({
      type: 'split_bill',
      label: 'Contribute to Group',
      detail: `Contribute NAD ${(amount / 100).toFixed(2)} to ${groupName}`,
      payload: {
        groupId,
        amount,
        fromWalletId: primaryWallet?.id,
      },
      resolve: async (confirmed) => {
        if (confirmed) {
          console.log('Contributing to group...');
          // await contributeToGroup({ groupId, amount });
        }
      }
    });
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-6">Contribute to Groups</Text>

      {groups.map((group) => (
        <View key={group.id} className="bg-gray-50 p-4 rounded-xl mb-4">
          <Text className="text-lg font-semibold">{group.name}</Text>
          <Text className="text-gray-600 text-sm mb-3">
            Balance: NAD {(group.balance / 100).toFixed(2)}
          </Text>
          
          <View className="flex-row gap-2">
            <TouchableOpacity 
              onPress={() => handleContributeToGroup(group.id, group.name, 5000)}
              className="flex-1 bg-blue-600 p-3 rounded-lg"
            >
              <Text className="text-white text-center font-medium">NAD 50</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleContributeToGroup(group.id, group.name, 10000)}
              className="flex-1 bg-blue-600 p-3 rounded-lg"
            >
              <Text className="text-white text-center font-medium">NAD 100</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleContributeToGroup(group.id, group.name, 20000)}
              className="flex-1 bg-blue-600 p-3 rounded-lg"
            >
              <Text className="text-white text-center font-medium">NAD 200</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
