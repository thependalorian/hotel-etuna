/**
 * Activity Tab - Transaction History
 * 
 * Features from design skill:
 * - Transaction list with 72px ListItems
 * - Categories: All, Sent, Received, Cash-out, Vouchers
 * - Filter by date range
 * - Search transactions
 * - Pull-to-refresh
 * - Infinite scroll / pagination
 * - Empty state: "No transactions yet"
 * - Loading state: skeleton list
 * 
 * Location: app/(tabs)/activity/index.tsx
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { TransactionListItem } from '@/components/activity/TransactionListItem';
import { LoadingState } from '@/components/ui/LoadingState';
import { designSystem as DS } from '@/constants/designSystem';
import { getTransactions, type Transaction } from '@/services/transactions';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useUser } from '@/contexts/UserContext';

type FilterCategory = 'all' | 'sent' | 'received' | 'cashout' | 'vouchers';

const FILTER_CATEGORIES: { id: FilterCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'sent', label: 'Sent' },
  { id: 'received', label: 'Received' },
  { id: 'cashout', label: 'Cash-out' },
  { id: 'vouchers', label: 'Vouchers' },
];

export default function ActivityScreen() {
  const { profile } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadTransactions = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      }
      
      const txs = await getTransactions({ limit: 20 });
      setTransactions(txs);
      setHasMore(false);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    setPage(p => p + 1);
  }, [loadingMore, hasMore]);

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: async () => loadTransactions(true),
  });

  useEffect(() => {
    loadTransactions(true);
  }, []);

  useEffect(() => {
    let filtered = transactions;

    if (selectedFilter !== 'all') {
      filtered = transactions.filter(tx => {
        if (selectedFilter === 'sent') return tx.type === 'send';
        if (selectedFilter === 'received') return tx.type === 'receive';
        if (selectedFilter === 'cashout') return tx.type === 'cashout';
        if (selectedFilter === 'vouchers') return tx.type === 'voucher' || tx.type === 'voucher_redeem';
        return true;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        tx =>
          tx.counterparty?.toLowerCase().includes(query) ||
          tx.description?.toLowerCase().includes(query) ||
          tx.reference?.toLowerCase().includes(query)
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, selectedFilter, searchQuery]);

  const handleTransactionPress = useCallback((transaction: Transaction) => {
    router.push(`/transactions/${transaction.id}` as any);
  }, []);

  const handleFilterPress = useCallback((filter: FilterCategory) => {
    setSelectedFilter(filter);
  }, []);

  if (loading && !refreshing) {
    return <LoadingState />;
  }

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="receipt-outline" size={48} color={DS.colors.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>No transactions yet</Text>
      <Text style={styles.emptyText}>
        Your transaction history will appear here once you start using Smartpay.
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push('/(tabs)/home')}
        activeOpacity={0.8}
      >
        <Text style={styles.emptyButtonText}>Go to Home</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={DS.colors.brand.primary} />
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
        style={styles.filterScroll}
      >
        {FILTER_CATEGORIES.map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              selectedFilter === filter.id && styles.filterChipActive,
            ]}
            onPress={() => handleFilterPress(filter.id)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${filter.label}`}
            accessibilityState={{ selected: selectedFilter === filter.id }}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === filter.id && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search result count (only when searching) */}
      {searchQuery.trim() && (
        <View style={styles.searchResultContainer}>
          <Text style={styles.searchResultText}>
            {filteredTransactions.length} result{filteredTransactions.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader
        title="Activity"
        showSearch
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search transactions..."
        onNotificationPress={() => router.push('/notifications' as any)}
        onAvatarPress={() => router.push('/(tabs)/profile')}
        avatarInitials={
          profile?.firstName?.[0]?.toUpperCase() +
          (profile?.lastName?.[0]?.toUpperCase() || '')
        }
      />

      <FlatList
        data={filteredTransactions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TransactionListItem
            transaction={item}
            onPress={handleTransactionPress}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderLoadingFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={DS.colors.brand.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={(
          filteredTransactions.length === 0 ? styles.emptyListContent : styles.listContent
        ) as any}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.background,
  },
  listContent: {
    paddingBottom: DS.spacing.contentBottomPadding,
  },
  emptyListContent: {
    flexGrow: 1,
    paddingBottom: DS.spacing.contentBottomPadding,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterContainer: {
    paddingHorizontal: DS.spacing[4],
    paddingVertical: DS.spacing[3],
    gap: DS.spacing[2],
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: DS.radius.pill,
    backgroundColor: DS.colors.surface,
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  filterChipActive: {
    backgroundColor: DS.colors.primary,
    borderColor: DS.colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: DS.colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  searchResultContainer: {
    paddingHorizontal: DS.spacing[4],
    paddingBottom: DS.spacing[2],
  },
  searchResultText: {
    fontSize: 14,
    fontWeight: '400',
    color: DS.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DS.spacing[8],
    paddingVertical: DS.spacing[12],
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: DS.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DS.spacing[6],
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: DS.colors.text,
    marginBottom: DS.spacing[2],
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    color: DS.colors.textSecondary,
    textAlign: 'center',
    marginBottom: DS.spacing[6],
    maxWidth: 280,
    lineHeight: 21,
  },
  emptyButton: {
    paddingHorizontal: DS.spacing[6],
    paddingVertical: DS.spacing[3],
    borderRadius: DS.radius.md,
    backgroundColor: DS.colors.brand.primary,
    ...DS.shadows.sm,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingFooter: {
    paddingVertical: DS.spacing[4],
    alignItems: 'center',
  },
});
