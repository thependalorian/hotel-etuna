/**
 * Account Details - Bank account balance and transactions
 * 
 * Shows detailed information for a linked bank account
 * 
 * Features:
 * - Account balance (available/current)
 * - Recent transactions
 * - Account info
 * - Disconnect option
 * 
 * Location: app/(authenticated)/banking/account-details/[id].tsx
 */

import React, { useState, useEffect } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { designSystem as DS } from '@/constants/designSystem';
import {
  getLinkedAccounts,
  getAccountBalances,
  getAccountTransactions,
  disconnectBank,
  LinkedBankAccount,
  AccountBalance,
  BankTransaction,
  NAMIBIAN_BANKS,
} from '@/services/openBanking';

export default function AccountDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [account, setAccount] = useState<LinkedBankAccount | null>(null);
  const [balance, setBalance] = useState<AccountBalance | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);

  useEffect(() => {
    loadAccountDetails();
  }, [params.id]);

  const loadAccountDetails = async () => {
    try {
      const accounts = await getLinkedAccounts();
      const foundAccount = accounts.find((acc) => acc.id === params.id);

      if (!foundAccount) {
        Alert.alert('Error', 'Account not found');
        router.back();
        return;
      }

      setAccount(foundAccount);

      const [balanceData, transactionsData] = await Promise.all([
        getAccountBalances(foundAccount.id),
        getAccountTransactions(foundAccount.id),
      ]);

      setBalance(balanceData);
      setTransactions(transactionsData.slice(0, 10));
    } catch (error) {
      console.error('loadAccountDetails error:', error);
      Alert.alert('Error', 'Failed to load account details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAccountDetails();
  };

  const handleDisconnect = () => {
    if (!account) return;

    Alert.alert(
      'Disconnect Account',
      `Are you sure you want to disconnect ${account.bankName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            const success = await disconnectBank(account.id);
            if (success) {
              router.replace('/banking/linked-accounts');
            } else {
              Alert.alert('Error', 'Failed to disconnect account');
            }
          },
        },
      ]
    );
  };

  if (loading || !account) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <AppHeader
          title="Account Details"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DS.colors.brand.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const bank = NAMIBIAN_BANKS[account.bankId];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader
        title={account.bankName}
        showBackButton
        onBackPress={() => router.back()}
        rightContent={
          <TouchableOpacity
            onPress={handleDisconnect}
            accessibilityLabel="Disconnect account"
            accessibilityRole="button"
          >
            <Ionicons name="unlink" size={24} color={DS.colors.semantic.error} />
          </TouchableOpacity>
        }
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
        <View style={[styles.balanceCard, { borderLeftColor: bank.color }]}>
          <View style={[styles.bankIcon, { backgroundColor: bank.color + '15' }]}>
            <Ionicons name="business" size={32} color={bank.color} />
          </View>

          <View style={styles.accountInfo}>
            <Text style={styles.accountType}>
              {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} Account
            </Text>
            <Text style={styles.accountNumber}>{account.accountNumber}</Text>
          </View>

          <View style={styles.balanceSection}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={[styles.balanceValue, { color: bank.color }]}>
                {account.currency} {balance?.available.toFixed(2) || '---'}
              </Text>
            </View>

            <View style={styles.balanceDivider} />

            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceValue}>
                {account.currency} {balance?.current.toFixed(2) || '---'}
              </Text>
            </View>
          </View>

          {balance?.lastUpdated && (
            <Text style={styles.lastUpdated}>
              Updated {new Date(balance.lastUpdated).toLocaleString()}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>

          {transactions.length === 0 ? (
            <View style={styles.emptyTransactions}>
              <Ionicons name="receipt-outline" size={48} color={DS.colors.textTertiary} />
              <Text style={styles.emptyText}>No recent transactions</Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoCard}>
            <InfoRow label="Bank" value={account.bankName} />
            <InfoRow label="Account ID" value={account.accountId} />
            <InfoRow label="Currency" value={account.currency} />
            <InfoRow
              label="Linked Since"
              value={new Date(account.linkedAt).toLocaleDateString()}
            />
            <InfoRow label="Status" value={account.status.toUpperCase()} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface TransactionItemProps {
  transaction: BankTransaction;
}

function TransactionItem({ transaction }: TransactionItemProps) {
  const isCredit = transaction.type === 'credit';

  return (
    <View style={styles.transactionItem}>
      <View
        style={[
          styles.transactionIcon,
          {
            backgroundColor: isCredit
              ? DS.colors.feedback.green100
              : DS.colors.feedback.red100,
          },
        ]}
      >
        <Ionicons
          name={isCredit ? 'arrow-down' : 'arrow-up'}
          size={20}
          color={isCredit ? DS.colors.semantic.success : DS.colors.semantic.error}
        />
      </View>

      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDescription} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.transactionDate}>
          {new Date(transaction.date).toLocaleDateString()}
        </Text>
      </View>

      <Text
        style={[
          styles.transactionAmount,
          {
            color: isCredit ? DS.colors.semantic.success : DS.colors.semantic.error,
          },
        ]}
      >
        {isCredit ? '+' : '-'}N$ {transaction.amount.toFixed(2)}
      </Text>
    </View>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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
  balanceCard: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    padding: DS.spacing.lg,
    borderLeftWidth: 4,
    marginBottom: DS.spacing.xl,
  },
  bankIcon: {
    width: 56,
    height: 56,
    borderRadius: DS.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DS.spacing.md,
  },
  accountInfo: {
    marginBottom: DS.spacing.lg,
  },
  accountType: {
    fontSize: DS.typography.fontSize.lg,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: 4,
  },
  accountNumber: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
  },
  balanceSection: {
    flexDirection: 'row',
    gap: DS.spacing.md,
    marginBottom: DS.spacing.sm,
  },
  balanceItem: {
    flex: 1,
  },
  balanceDivider: {
    width: 1,
    backgroundColor: DS.colors.border,
  },
  balanceLabel: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: DS.typography.fontSize.xl,
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.text,
  },
  lastUpdated: {
    fontSize: DS.typography.fontSize.xs,
    color: DS.colors.textTertiary,
    textAlign: 'right',
  },
  section: {
    marginBottom: DS.spacing.xl,
  },
  sectionTitle: {
    fontSize: DS.typography.fontSize.lg,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: DS.spacing.md,
  },
  transactionsList: {
    gap: DS.spacing.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.md,
    padding: DS.spacing.md,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.md,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: DS.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.medium,
    color: DS.colors.text,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
  },
  transactionAmount: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: DS.spacing.xl,
  },
  emptyText: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.textSecondary,
    marginTop: DS.spacing.md,
  },
  infoSection: {
    marginBottom: DS.spacing.xl,
  },
  infoCard: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    padding: DS.spacing.md,
    gap: DS.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.textSecondary,
  },
  infoValue: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.medium,
    color: DS.colors.text,
  },
});
