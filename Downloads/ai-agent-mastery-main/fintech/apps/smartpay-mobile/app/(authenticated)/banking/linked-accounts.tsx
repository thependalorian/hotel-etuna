/**
 * Linked Accounts - List of linked bank accounts
 * 
 * Shows all bank accounts linked via Open Banking
 * 
 * Features:
 * - List of linked accounts
 * - Account balances
 * - Navigate to account details
 * - Link more accounts
 * - Disconnect accounts
 * 
 * Location: app/(authenticated)/banking/linked-accounts.tsx
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { designSystem as DS } from '@/constants/designSystem';
import {
  getLinkedAccounts,
  getAccountBalances,
  disconnectBank,
  LinkedBankAccount,
  NAMIBIAN_BANKS,
} from '@/services/openBanking';

export default function LinkedAccountsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accounts, setAccounts] = useState<LinkedBankAccount[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});

  useFocusEffect(
    useCallback(() => {
      loadAccounts();
    }, [])
  );

  const loadAccounts = async () => {
    try {
      const linkedAccounts = await getLinkedAccounts();
      setAccounts(linkedAccounts);

      const balancePromises = linkedAccounts.map(async (acc) => {
        const balance = await getAccountBalances(acc.id);
        return { id: acc.id, balance: balance?.available || 0 };
      });

      const balanceResults = await Promise.all(balancePromises);
      const balancesMap: Record<string, number> = {};
      balanceResults.forEach((result) => {
        balancesMap[result.id] = result.balance;
      });
      setBalances(balancesMap);
    } catch (error) {
      console.error('loadAccounts error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAccounts();
  };

  const handleDisconnect = (account: LinkedBankAccount) => {
    Alert.alert(
      'Disconnect Bank Account',
      `Are you sure you want to disconnect ${account.bankName}? You can link it again anytime.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            const success = await disconnectBank(account.id);
            if (success) {
              Alert.alert('Success', 'Bank account disconnected');
              loadAccounts();
            } else {
              Alert.alert('Error', 'Failed to disconnect account');
            }
          },
        },
      ]
    );
  };

  const handleAccountPress = (account: LinkedBankAccount) => {
    router.push({
      pathname: '/banking/account-details/[id]',
      params: { id: account.id },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <AppHeader
          title="Linked Accounts"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DS.colors.brand.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader
        title="Linked Accounts"
        showBackButton
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={DS.colors.brand.primary}
          />
        }
      >
        {accounts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={64} color={DS.colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Linked Accounts</Text>
            <Text style={styles.emptyDescription}>
              Link your bank account to enable instant transfers
            </Text>
            <View style={styles.emptyButton}>
              <Button
                title="Link Bank Account"
                onPress={() => router.push('/banking/link-bank')}
                icon="add"
              />
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              {accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'} Linked
            </Text>

            <View style={styles.accountsList}>
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  balance={balances[account.id]}
                  onPress={() => handleAccountPress(account)}
                  onDisconnect={() => handleDisconnect(account)}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.linkAccountButton}
              onPress={() => router.push('/banking/link-bank')}
              accessibilityLabel="Link another bank account"
            >
              <Ionicons name="add-circle-outline" size={24} color={DS.colors.brand.primary} />
              <Text style={styles.linkAccountText}>Link Another Account</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface AccountCardProps {
  account: LinkedBankAccount;
  balance?: number;
  onPress: () => void;
  onDisconnect: () => void;
}

function AccountCard({ account, balance, onPress, onDisconnect }: AccountCardProps) {
  const bank = NAMIBIAN_BANKS[account.bankId];

  return (
    <TouchableOpacity
      style={[styles.accountCard, { borderLeftColor: bank.color }]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`${account.bankName}, ${account.accountType} account`}
      accessibilityRole="button"
    >
      <View style={styles.accountHeader}>
        <View style={[styles.bankIcon, { backgroundColor: bank.color + '15' }]}>
          <Ionicons name="business" size={24} color={bank.color} />
        </View>
        <View style={styles.accountMainInfo}>
          <Text style={styles.bankName}>{account.bankName}</Text>
          <Text style={styles.accountType}>
            {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} •{' '}
            {account.accountNumber}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={onDisconnect}
          accessibilityLabel="Disconnect account"
          accessibilityRole="button"
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={DS.colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.accountFooter}>
        <View>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            {account.currency} {balance !== undefined ? balance.toFixed(2) : '---'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={DS.colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.lg,
    paddingBottom: DS.spacing.contentBottomPadding,
  },
  sectionTitle: {
    fontSize: DS.typography.fontSize.lg,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: DS.spacing.md,
  },
  accountsList: {
    gap: DS.spacing.md,
    marginBottom: DS.spacing.lg,
  },
  accountCard: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    padding: DS.spacing.md,
    borderLeftWidth: 4,
    gap: DS.spacing.md,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.md,
  },
  bankIcon: {
    width: 48,
    height: 48,
    borderRadius: DS.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountMainInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: 2,
  },
  accountType: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
  },
  menuButton: {
    padding: DS.spacing.sm,
  },
  accountFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: DS.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: DS.colors.border,
  },
  balanceLabel: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
    marginBottom: 2,
  },
  balanceAmount: {
    fontSize: DS.typography.fontSize.xl,
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.text,
  },
  linkAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DS.spacing.sm,
    padding: DS.spacing.md,
    borderRadius: DS.radius.lg,
    borderWidth: 2,
    borderColor: DS.colors.brand.primary,
    borderStyle: 'dashed',
  },
  linkAccountText: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.brand.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: DS.spacing.xxl,
  },
  emptyTitle: {
    fontSize: DS.typography.fontSize['2xl'],
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginTop: DS.spacing.md,
    marginBottom: DS.spacing.sm,
  },
  emptyDescription: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.textSecondary,
    textAlign: 'center',
    marginBottom: DS.spacing.lg,
  },
  emptyButton: {
    width: '100%',
  },
});
