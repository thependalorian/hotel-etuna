/**
 * Wallets Index - Wallet picker/list
 * 
 * Figma Spec: Vertical list of wallet cards
 * Features:
 * - List of wallet cards (164×140 or full-width variant)
 * - Each wallet card: Accent bar, Icon + name, Balance
 * - Primary wallet indicator
 * - "Add Wallet" CTA at bottom
 * - Tap to view details
 * 
 * Location: app/(authenticated)/wallets/index.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { designSystem as DS } from '@/constants/designSystem';
import { getWallets, type Wallet } from '@/services/wallets';
import { getWalletCardFill } from '@/constants/CardDesign';

export default function WalletsScreen() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const data = await getWallets();
      setWallets(data);
    } catch (error) {
      console.error('Failed to load wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletPress = (walletId: string) => {
    router.push(`/wallets/${walletId}`);
  };

  const handleAddWallet = () => {
    router.push('/wallets/add');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <AppHeader
          title="Wallets"
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
        title="Wallets"
        showBackButton
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {wallets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={64} color={DS.colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Wallets Yet</Text>
            <Text style={styles.emptyDescription}>
              Create your first wallet to organize your funds
            </Text>
          </View>
        ) : (
          <View style={styles.walletsList}>
            {wallets.map((wallet, index) => (
              <WalletListCard
                key={wallet.id}
                wallet={wallet}
                index={index}
                onPress={() => handleWalletPress(wallet.id)}
                isPrimary={index === 0}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomButton}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddWallet}
          activeOpacity={0.8}
          accessibilityLabel="Add new wallet"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={24} color={DS.colors.background} />
          <Text style={styles.addButtonText}>Add Wallet</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

interface WalletListCardProps {
  wallet: Wallet;
  index: number;
  onPress: () => void;
  isPrimary: boolean;
}

function WalletListCard({ wallet, index, onPress, isPrimary }: WalletListCardProps) {
  const accentColor = wallet.color || getWalletCardFill(undefined, index);
  const iconBg = `${accentColor}26`;

  return (
    <TouchableOpacity
      style={styles.walletCard}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityLabel={`${wallet.name} wallet, balance N$${wallet.balance.toFixed(2)}`}
      accessibilityRole="button"
    >
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View style={styles.walletCardBody}>
        <View style={styles.walletCardLeft}>
          <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
            <Ionicons name={wallet.icon as any || 'wallet-outline'} size={24} color={accentColor} />
          </View>

          <View style={styles.walletCardInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.walletName} numberOfLines={1}>
                {wallet.name}
              </Text>
              {isPrimary && (
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                </View>
              )}
            </View>
            <Text style={styles.walletBalance}>
              N${wallet.balance.toLocaleString('en-NA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
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
    paddingTop: DS.spacing.md,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DS.spacing.xxl,
    paddingHorizontal: DS.spacing.lg,
  },
  emptyTitle: {
    fontSize: DS.typography.fontSize['2xl'],
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginTop: DS.spacing.lg,
    marginBottom: DS.spacing.sm,
  },
  emptyDescription: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  walletsList: {
    gap: DS.spacing.md,
  },
  walletCard: {
    backgroundColor: DS.colors.background,
    borderRadius: DS.radius.lg,
    overflow: 'hidden',
    ...DS.shadows.sm,
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  walletCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DS.spacing.md,
  },
  walletCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: DS.spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: DS.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletCardInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
  },
  walletName: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    flex: 1,
  },
  primaryBadge: {
    backgroundColor: DS.colors.brand.primaryLight,
    paddingHorizontal: DS.spacing.sm,
    paddingVertical: 2,
    borderRadius: DS.radius.sm,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.brand.primary,
    letterSpacing: 0.5,
  },
  walletBalance: {
    fontSize: DS.typography.fontSize.xl,
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.text,
  },
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.md,
    backgroundColor: DS.colors.background,
    borderTopWidth: 1,
    borderTopColor: DS.colors.border,
  },
  addButton: {
    height: 56,
    backgroundColor: DS.colors.brand.primary,
    borderRadius: DS.components.button.borderRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DS.spacing.sm,
    ...DS.shadows.md,
  },
  addButtonText: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.background,
  },
});
