import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/constants/designSystem';
import { AppHeader } from '@/components/layout';
import { LoadingState } from '@/components/ui';
import { useWallets } from '@/contexts/WalletsContext';
import { usePullToRefresh } from '@/hooks';

export default function WalletsScreen() {
  const { wallets, isLoading, refresh } = useWallets();
  const { refreshing, onRefresh } = usePullToRefresh({ onRefresh: refresh });

  if (isLoading && !refreshing) {
    return <LoadingState />;
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader />

        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.header}>
            <Text style={styles.title}>My Wallets</Text>
          </View>

          <View style={styles.section}>
            {wallets.map(wallet => (
              <TouchableOpacity
                key={wallet.id}
                style={[styles.walletCard, { borderLeftColor: wallet.color, borderLeftWidth: 4 }]}
                onPress={() => router.push(`/wallets/${wallet.id}` as any)}
              >
                <View style={styles.walletHeader}>
                  <View style={styles.walletIconContainer}>
                    <Ionicons name={wallet.icon as any} size={24} color={wallet.color} />
                  </View>
                  <View style={styles.walletInfo}>
                    <Text style={styles.walletName}>{wallet.name}</Text>
                    <Text style={styles.walletCurrency}>{wallet.currency}</Text>
                  </View>
                </View>
                <Text style={styles.walletBalance}>N${wallet.balance.toFixed(2)}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.addWalletCard} onPress={() => router.push('/add-wallet' as any)}>
              <Ionicons name="add-circle-outline" size={32} color={designSystem.colors.primary} />
              <Text style={styles.addWalletText}>Add New Wallet</Text>
            </TouchableOpacity>
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
  section: {
    paddingHorizontal: designSystem.spacing.smartpay.horizontalPadding,
    paddingBottom: 100,
  },
  walletCard: {
    backgroundColor: designSystem.colors.surface,
    padding: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.md,
    marginBottom: designSystem.spacing.md,
    ...designSystem.shadows.sm,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designSystem.spacing.md,
  },
  walletIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: designSystem.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  walletCurrency: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.textSecondary,
  },
  walletBalance: {
    ...designSystem.typography.textStyles.titleLg,
    color: designSystem.colors.text,
    fontWeight: '700',
  },
  addWalletCard: {
    backgroundColor: designSystem.colors.surface,
    padding: designSystem.spacing.xl,
    borderRadius: designSystem.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: designSystem.colors.border,
    borderStyle: 'dashed',
    marginBottom: designSystem.spacing.md,
  },
  addWalletText: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.primary,
    fontWeight: '600',
    marginTop: 8,
  },
});
