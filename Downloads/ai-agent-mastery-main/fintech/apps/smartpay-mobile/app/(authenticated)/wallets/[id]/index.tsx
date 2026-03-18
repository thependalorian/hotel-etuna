/**
 * Wallet Detail - Individual wallet view
 * 
 * Figma Spec: 116:629
 * Features:
 * - AppHeader with wallet name
 * - BalanceCard for this wallet
 * - Quick actions: Cash Out, Send Money, Add Money, Settings
 * - Transaction history (filtered by wallet)
 * - Edit wallet button (name, icon, goal)
 * 
 * Location: app/(authenticated)/wallets/[id]/index.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { BalanceCard } from '@/components/home/BalanceCard';
import { designSystem as DS } from '@/constants/designSystem';
import { getWallets, type Wallet } from '@/services/wallets';
import { getTransactions, type Transaction } from '@/services/transactions';

export default function WalletDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);

  useEffect(() => {
    if (id) {
      loadWalletData();
    }
  }, [id]);

  const loadWalletData = async () => {
    try {
      const wallets = await getWallets();
      const foundWallet = wallets.find((w) => w.id === id);
      setWallet(foundWallet || null);

      const allTransactions = await getTransactions();
      const walletTransactions = allTransactions.filter(
        (t) => (t as any).walletId === id
      );
      setTransactions(walletTransactions);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCashOut = () => {
    router.push('/cash-out');
  };

  const handleSendMoney = () => {
    router.push(`/send-money?fromWalletId=${id}`);
  };

  const handleAddMoney = () => {
    Alert.alert('Add Money', 'Add money feature coming soon');
  };

  const handleSettings = () => {
    Alert.alert('Wallet Settings', 'Wallet settings feature coming soon');
  };

  const handleTransactionPress = (transactionId: string) => {
    router.push(`/transactions/${transactionId}` as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <AppHeader
          title="Wallet"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DS.colors.brand.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!wallet) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <AppHeader
          title="Wallet"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={DS.colors.error} />
          <Text style={styles.errorTitle}>Wallet Not Found</Text>
          <Text style={styles.errorDescription}>
            This wallet could not be found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader
        title={wallet.name}
        showBackButton
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.balanceSection}>
          <BalanceCard
            balance={wallet.balance}
            balanceVisible={balanceVisible}
            onToggleVisibility={() => setBalanceVisible(!balanceVisible)}
            walletName={wallet.name}
          />
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <ActionButton
              icon="cash-outline"
              label="Cash Out"
              onPress={handleCashOut}
              color={DS.colors.services.cashOut}
            />
            <ActionButton
              icon="arrow-up-outline"
              label="Send Money"
              onPress={handleSendMoney}
              color={DS.colors.brand.primary}
            />
            <ActionButton
              icon="add-circle-outline"
              label="Add Money"
              onPress={handleAddMoney}
              color={DS.colors.services.receive}
            />
            <ActionButton
              icon="settings-outline"
              label="Settings"
              onPress={handleSettings}
              color={DS.colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {transactions.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push('/activity')}
                accessibilityLabel="View all transactions"
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyTransactions}>
              <Ionicons name="receipt-outline" size={48} color={DS.colors.textTertiary} />
              <Text style={styles.emptyTransactionsText}>No transactions yet</Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.slice(0, 5).map((transaction) => (
                <TransactionListItem
                  key={transaction.id}
                  transaction={transaction}
                  onPress={() => handleTransactionPress(transaction.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface ActionButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
}

function ActionButton({ icon, label, onPress, color }: ActionButtonProps) {
  return (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <View style={[styles.actionIconCircle, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={28} color={color} />
      </View>
      <Text style={styles.actionLabel} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface TransactionListItemProps {
  transaction: Transaction;
  onPress: () => void;
}

function TransactionListItem({ transaction, onPress }: TransactionListItemProps) {
  const isDebit = transaction.type === 'debit';
  const amount = isDebit ? -Math.abs(transaction.amount) : Math.abs(transaction.amount);

  return (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`${transaction.description}, amount ${amount < 0 ? 'minus' : 'plus'} N$${Math.abs(amount).toFixed(2)}`}
    >
      <View style={styles.transactionLeft}>
        <View style={[
          styles.transactionIcon,
          { backgroundColor: isDebit ? DS.colors.feedback.red100 : DS.colors.feedback.green100 }
        ]}>
          <Ionicons
            name={isDebit ? 'arrow-up' : 'arrow-down'}
            size={20}
            color={isDebit ? DS.colors.error : DS.colors.success}
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription} numberOfLines={1}>
            {transaction.description}
          </Text>
          <Text style={styles.transactionDate}>
            {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('en-NA', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }) : 'N/A'}
          </Text>
        </View>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          { color: isDebit ? DS.colors.error : DS.colors.success },
        ]}
      >
        {amount < 0 ? '-' : '+'}N${Math.abs(amount).toFixed(2)}
      </Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DS.spacing.lg,
  },
  errorTitle: {
    fontSize: DS.typography.fontSize['2xl'],
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginTop: DS.spacing.md,
  },
  errorDescription: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.textSecondary,
    marginTop: DS.spacing.sm,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  balanceSection: {
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.md,
  },
  actionsSection: {
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.lg,
  },
  sectionTitle: {
    fontSize: DS.typography.fontSize.lg,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: DS.spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DS.spacing.md,
  },
  actionButton: {
    width: '47%',
    aspectRatio: 1.2,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    padding: DS.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: DS.spacing.sm,
    ...DS.shadows.sm,
  },
  actionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: DS.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: DS.typography.fontSize.sm,
    fontWeight: DS.typography.fontWeight.medium,
    color: DS.colors.text,
    textAlign: 'center',
  },
  transactionsSection: {
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.lg,
    paddingBottom: DS.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DS.spacing.md,
  },
  viewAllText: {
    fontSize: DS.typography.fontSize.sm,
    fontWeight: DS.typography.fontWeight.medium,
    color: DS.colors.brand.primary,
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: DS.spacing.xl,
  },
  emptyTransactionsText: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.textSecondary,
    marginTop: DS.spacing.md,
  },
  transactionsList: {
    gap: 1,
    backgroundColor: DS.colors.border,
    borderRadius: DS.radius.lg,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DS.spacing.md,
    backgroundColor: DS.colors.background,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: DS.spacing.md,
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
    gap: 2,
  },
  transactionDescription: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.medium,
    color: DS.colors.text,
  },
  transactionDate: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
  },
  transactionAmount: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
  },
});
