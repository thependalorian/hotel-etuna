import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/constants/designSystem';
import { AppHeader } from '@/components/layout';
import { LoadingState } from '@/components/ui';
import { getTransactions, type Transaction } from '@/services/transactions';
import { usePullToRefresh } from '@/hooks';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');

  const loadTransactions = async () => {
    try {
      const txs = await getTransactions();
      setTransactions(txs);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const { refreshing, onRefresh } = usePullToRefresh({ onRefresh: loadTransactions });

  useEffect(() => {
    loadTransactions();
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'sent') return tx.type === 'send';
    if (filter === 'received') return tx.type === 'receive';
    return true;
  });

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader />

        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Transactions</Text>
          </View>

          <View style={styles.filters}>
            {(['all', 'sent', 'received'] as const).map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterButton, filter === f && styles.filterButtonActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx) => (
                <TouchableOpacity
                  key={tx.id}
                  style={styles.txCard}
                  onPress={() => router.push(`/transactions/${tx.id}` as any)}
                >
                  <View style={[
                    styles.txIcon,
                    { backgroundColor: tx.type === 'send' ? '#FEE2E2' : '#DCFCE7' }
                  ]}>
                    <Ionicons 
                      name={tx.type === 'send' ? 'arrow-up' : 'arrow-down'} 
                      size={20} 
                      color={tx.type === 'send' ? designSystem.colors.error : designSystem.colors.success} 
                    />
                  </View>
                  <View style={styles.txDetails}>
                    <Text style={styles.txLabel}>{tx.counterparty}</Text>
                    <Text style={styles.txMeta}>
                      {new Date(tx.timestamp).toLocaleDateString()} • {tx.type}
                    </Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, tx.type === 'send' && styles.txAmountNegative]}>
                      {tx.type === 'send' ? '-' : '+'}N${tx.amount.toFixed(2)}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      tx.status === 'completed' && styles.statusBadgeSuccess,
                      tx.status === 'pending' && styles.statusBadgePending,
                      tx.status === 'failed' && styles.statusBadgeFailed,
                    ]}>
                      <Text style={styles.statusText}>{tx.status}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No transactions found</Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: designSystem.colors.background },
  safe: { flex: 1 },
  scrollView: { flex: 1 },
  header: {
    paddingHorizontal: designSystem.spacing.smartpay.horizontalPadding,
    paddingVertical: designSystem.spacing.lg,
  },
  title: {
    ...designSystem.typography.textStyles.heading,
    color: designSystem.colors.text,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: designSystem.spacing.smartpay.horizontalPadding,
    gap: 8,
    marginBottom: designSystem.spacing.lg,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: designSystem.colors.surface,
    borderWidth: 1,
    borderColor: designSystem.colors.border,
  },
  filterButtonActive: {
    backgroundColor: designSystem.colors.primary,
    borderColor: designSystem.colors.primary,
  },
  filterText: {
    ...designSystem.typography.textStyles.bodySm,
    color: designSystem.colors.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: designSystem.spacing.smartpay.horizontalPadding,
    paddingBottom: 100,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designSystem.colors.surface,
    padding: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.md,
    marginBottom: designSystem.spacing.sm,
    ...designSystem.shadows.sm,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txDetails: { flex: 1 },
  txLabel: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  txMeta: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.textSecondary,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.success,
    fontWeight: '700',
    marginBottom: 4,
  },
  txAmountNegative: {
    color: designSystem.colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeFailed: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    ...designSystem.typography.textStyles.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyText: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: designSystem.spacing.xl,
  },
});
