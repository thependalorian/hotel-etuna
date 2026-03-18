/**
 * Home tab – Smartpay dashboard (authenticated).
 * Buffr-g2p style: balance/card area, services grid, Send CTA, wallet carousel, recent contacts.
 * Respects docs/UX_APP_STATE_BEFORE_AFTER_LINKING.md (before/after linking).
 * Location: fintech/smartpay/app/(authenticated)/(tabs)/index.tsx
 */
import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/constants/designSystem';
import { BalanceStrip } from '@/components/BalanceStrip';
import { WalletCarousel, RecentContactsCarousel, ServicesGrid } from '@/components/home';
import { getWallets } from '@/services/wallets';

const ds = designSystem;

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshTrigger((t) => t + 1);
    try {
      await getWallets();
    } finally {
      setRefreshing(false);
    }
  }, []);

  const onNavigate = useCallback((route: string) => {
    router.push(route as any);
  }, [router]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ds.colors.brand.primary} />
        }
      >
        {/* Balance / card area – primary wallet context */}
        <View style={styles.balanceCard}>
          <BalanceStrip />
        </View>

        {/* Send – primary CTA (buffr-g2p: FAB or primary, not in grid) */}
        <TouchableOpacity
          style={styles.sendCta}
          onPress={() => router.push('/send-money')}
          activeOpacity={0.8}
        >
          <Ionicons name="send" size={22} color="#FFF" />
          <Text style={styles.sendCtaText}>Send</Text>
        </TouchableOpacity>

        {/* Services grid: Proof of life, Receive, Wallets, Vouchers, Bills, Loans, Groups, Find Agent */}
        <ServicesGrid onNavigate={onNavigate} />

        {/* Wallet carousel */}
        <WalletCarousel refreshTrigger={refreshTrigger} onWalletPress={() => onNavigate('/wallets')} />

        {/* Recent contacts */}
        <RecentContactsCarousel onSendPress={() => router.push('/send-money')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ds.colors.neutral.background },
  scroll: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: ds.spacing.smartpay.horizontalPadding,
    paddingTop: ds.spacing.md,
    paddingBottom: ds.spacing.xxl,
  },
  balanceCard: {
    width: '100%',
    paddingVertical: ds.spacing.lg,
    paddingHorizontal: ds.spacing.lg,
    borderRadius: ds.radius.lg,
    borderWidth: 1,
    borderColor: ds.colors.neutral.border,
    marginBottom: ds.spacing.lg,
    ...ds.shadows.sm,
    backgroundColor: ds.colors.neutral.surface,
  },
  sendCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing.sm,
    paddingVertical: ds.spacing.md,
    paddingHorizontal: ds.spacing.xl,
    marginBottom: ds.spacing.xl,
    backgroundColor: ds.colors.brand.primary,
    borderRadius: ds.radius.lg,
    ...ds.shadows.md,
  },
  sendCtaText: {
    ...ds.typography.textStyles.button,
    color: '#FFF',
  },
});
