/**
 * Wallet Overview Screen
 * 
 * Location: app/wallets/[id].tsx
 * Purpose: Display detailed wallet view with balance, quick actions, and recent activity
 * 
 * Based on Wallet View.svg design
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useWallets } from '@/contexts/WalletsContext';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import WalletCard from '@/components/WalletCard';

export default function WalletOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getWalletById, getWalletTransactions, getWalletStats, refreshWallets, loading } = useWallets();

  const wallet = useMemo(() => {
    return id ? getWalletById(id) : null;
  }, [id, getWalletById]);

  const transactions = useMemo(() => {
    return id ? getWalletTransactions(id) : [];
  }, [id, getWalletTransactions]);

  const stats = useMemo(() => {
    return id ? getWalletStats(id) : { totalIn: 0, totalOut: 0, net: 0 };
  }, [id, getWalletStats]);

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  useEffect(() => {
    if (id && !wallet) {
      refreshWallets();
    }
  }, [id, wallet, refreshWallets]);

  const handleRefresh = async () => {
    await refreshWallets();
  };

  if (!wallet) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <ErrorState
          title="Wallet not found"
          message="The wallet you're looking for doesn't exist or has been deleted."
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push(`/wallets/${id}/settings`)}
        >
          <FontAwesome name="cog" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Wallet Name */}
      <Text style={styles.walletName}>{wallet.name}</Text>

      {/* Wallet Card with Custom Design */}
      <View style={styles.cardContainer}>
        <WalletCard
          wallet={wallet}
          showBalance={true}
          onToggleBalance={() => {
            // Toggle balance visibility
          }}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/wallets/${id}/add-money`)}
        >
          <View style={[styles.actionIcon, { backgroundColor: Colors.primary + '20' }]}>
            <FontAwesome name="plus" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.actionLabel}>Add Money</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/wallets/${id}/transfer`)}
        >
          <View style={[styles.actionIcon, { backgroundColor: Colors.success + '20' }]}>
            <FontAwesome name="paper-plane" size={24} color={Colors.success} />
          </View>
          <Text style={styles.actionLabel}>Transfer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/wallets/${id}/settings`)}
        >
          <View style={[styles.actionIcon, { backgroundColor: Colors.info + '20' }]}>
            <FontAwesome name="credit-card" size={24} color={Colors.info} />
          </View>
          <Text style={styles.actionLabel}>Card</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/wallets/${id}/history`)}
        >
          <View style={[styles.actionIcon, { backgroundColor: Colors.warning + '20' }]}>
            <FontAwesome name="bar-chart" size={24} color={Colors.warning} />
          </View>
          <Text style={styles.actionLabel}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No recent transactions</Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {recentTransactions.map((tx) => (
              <View key={tx.id} style={styles.transactionItem}>
                <View
                  style={[
                    styles.transactionIcon,
                    {
                      backgroundColor:
                        tx.type === 'added' || tx.type === 'transfer_in'
                          ? Colors.success + '20'
                          : Colors.error + '20',
                    },
                  ]}
                >
                  <FontAwesome
                    name={tx.type === 'added' || tx.type === 'transfer_in' ? 'arrow-down' : 'arrow-up'}
                    size={20}
                    color={tx.type === 'added' || tx.type === 'transfer_in' ? Colors.success : Colors.error}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription}>{tx.description}</Text>
                  <Text style={styles.transactionDate}>
                    {tx.date.toLocaleDateString()} {tx.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    {
                      color:
                        tx.type === 'added' || tx.type === 'transfer_in'
                          ? Colors.success
                          : Colors.error,
                    },
                  ]}
                >
                  {tx.type === 'added' || tx.type === 'transfer_in' ? '+' : '-'}
                  {wallet.currency || 'N$'} {tx.amount.toLocaleString()}
                </Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => router.push(`/wallets/${id}/history`)}
            >
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Wallet Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallet Stats</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total In</Text>
            <Text style={[styles.statValue, { color: Colors.success }]}>
              {wallet.currency || 'N$'} {stats.totalIn.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Out</Text>
            <Text style={[styles.statValue, { color: Colors.error }]}>
              {wallet.currency || 'N$'} {stats.totalOut.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Net</Text>
            <Text
              style={[
                styles.statValue,
                { color: stats.net >= 0 ? Colors.success : Colors.error },
              ]}
            >
              {wallet.currency || 'N$'} {stats.net.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  cardContainer: {
    marginBottom: 32,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  transactionsList: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    gap: 4,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  viewAllButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
});
