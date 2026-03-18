/**
 * Home Screen - Smartpay Copilot
 * 
 * Figma Node: 45:837 (Main Screen)
 * Location: app/(tabs)/home/index.tsx
 * 
 * Layout Structure:
 * - AppHeader (search pill + notifications + avatar)
 * - BalanceCard (120px, total balance with eye toggle)
 * - WalletCarousel (horizontal scroll, 164×140 cards)
 * - ServicesGrid (3×3, 9 tiles)
 * - RecentContactsCarousel (40px circular avatars)
 * - FloatingActionButton (Send, bottom-right)
 * 
 * Features:
 * - Pull-to-refresh functionality
 * - Loading states (skeleton)
 * - Empty states (no wallets → "Connect your bank")
 * - Offline banner (when offline)
 * - Search functionality (filter services/contacts)
 * - Navigation to all service routes
 * 
 * UX State Management:
 * - Before linking: Show "Connect your bank" CTA
 * - After linking: Show wallets carousel + full grid
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useWallets } from '@/contexts/WalletsContext';
import { useNotificationsContext } from '@/contexts/NotificationsContext';
import { getContacts, type Contact } from '@/services/send';
import { designSystem as DS } from '@/constants/designSystem';
import { AppHeader } from '@/components/layout';
import { usePullToRefresh, useNetworkStatus } from '@/hooks';
import { OfflineBanner } from '@/components/common';
import {
  BalanceCard,
  WalletCarousel,
  ServicesGrid,
  RecentContactsCarousel,
  type Service,
} from '@/components/home';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';

// ─── Services Grid Configuration (Figma Node: 45:837) ────────────────────────
// 3×3 grid: Proof of Life, Receive, Wallets, Cash Out, Vouchers, Find Agent, Loans, Groups, Bills
// Colors from designSystem.colors.services (Figma-validated)
const SERVICES_GRID: Service[] = [
  {
    id: 'proof-of-life',
    label: 'Proof of Life',
    icon: 'shield-checkmark-outline',
    color: DS.colors.services.proofOfLife,
    route: '/(authenticated)/proof-of-life/intro',
  },
  {
    id: 'receive',
    label: 'Receive',
    icon: 'arrow-down-circle-outline',
    color: DS.colors.services.receive,
    route: '/(authenticated)/receive',
  },
  {
    id: 'wallets',
    label: 'Wallets',
    icon: 'wallet-outline',
    color: DS.colors.services.wallets,
    route: '/(authenticated)/wallets',
  },
  {
    id: 'cash-out',
    label: 'Cash Out',
    icon: 'cash-outline',
    color: DS.colors.services.cashOut,
    route: '/(authenticated)/cash-out',
  },
  {
    id: 'vouchers',
    label: 'Vouchers',
    icon: 'gift-outline',
    color: DS.colors.services.vouchers,
    route: '/(authenticated)/voucher',
  },
  {
    id: 'find-agent',
    label: 'Find Agent',
    icon: 'location-outline',
    color: DS.colors.services.findAgent,
    route: '/(authenticated)/agents',
  },
  {
    id: 'loans',
    label: 'Loans',
    icon: 'business-outline',
    color: DS.colors.services.loans,
    route: '/(authenticated)/loans',
  },
  {
    id: 'groups',
    label: 'Groups',
    icon: 'people-outline',
    color: DS.colors.services.groups,
    route: '/(authenticated)/groups',
  },
  {
    id: 'bills',
    label: 'Bills',
    icon: 'document-text-outline',
    color: DS.colors.services.bills,
    route: '/(authenticated)/bills',
  },
];

/** Check if proof-of-life due date is within next 14 days */
function isProofOfLifeDueSoon(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const now = new Date();
  const in14 = new Date(now);
  in14.setDate(in14.getDate() + 14);
  return due >= now && due <= in14;
}

export default function HomeScreen() {
  // ─── Context & State ────────────────────────────────────────────────────────
  const { profile, proofOfLifeDueDate, walletStatus } = useUser();
  const { 
    wallets, 
    totalBalance, 
    primaryWallet,
    isLoading: walletsLoading,
    hasLinkedAccounts,
    refresh: refreshWallets,
  } = useWallets();
  const { unreadCount } = useNotificationsContext();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [contactsLoading, setContactsLoading] = useState(true);

  const { isConnected } = useNetworkStatus();
  const showProofOfLifeBanner = isProofOfLifeDueSoon(proofOfLifeDueDate);

  // ─── Computed State ─────────────────────────────────────────────────────────
  const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');
  const hasWallets = wallets.length > 0;
  const loading = walletsLoading || contactsLoading;

  // Search filtering
  const q = searchQuery.trim().toLowerCase();
  const filteredServices = q
    ? SERVICES_GRID.filter((s) => s.label.toLowerCase().includes(q))
    : SERVICES_GRID;
  const filteredContacts = q
    ? contacts.filter((c) => 
        c.name.toLowerCase().includes(q) || 
        (c.phone ?? '').includes(q) ||
        (c.smartpayId ?? '').toLowerCase().includes(q)
      )
    : contacts;

  // ─── Data Loading ───────────────────────────────────────────────────────────
  const loadContacts = useCallback(async () => {
    try {
      setContactsLoading(true);
      const contactsList = await getContacts();
      setContacts(contactsList);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setContactsLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    await Promise.all([
      refreshWallets(),
      loadContacts(),
    ]);
  }, [refreshWallets, loadContacts]);

  // Pull-to-refresh
  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: loadData,
  });

  // Initial load
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Reload on screen focus (after navigation back)
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      loadData();
    }, [loadData])
  );

  // Redirect to proof-of-life expired if wallet is frozen
  useEffect(() => {
    if (walletStatus === 'frozen') {
      router.replace('/(authenticated)/proof-of-life/expired' as never);
    }
  }, [walletStatus]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleServicePress = (service: Service) => {
    router.push(service.route as never);
  };

  const handleWalletPress = (walletId: string) => {
    router.push(`/(authenticated)/wallets/${walletId}` as never);
  };

  const handleAddWallet = () => {
    router.push('/(authenticated)/add-wallet' as never);
  };

  const handleContactPress = (contact: Contact) => {
    router.push({
      pathname: '/(authenticated)/send-money/amount' as never,
      params: {
        recipientPhone: contact.phone,
        recipientName: contact.name,
        recipientSmartpayId: contact.smartpayId,
      },
    });
  };

  const handleSendPress = () => {
    router.push('/(authenticated)/send-money/select-recipient' as never);
  };

  const handleLinkBank = () => {
    router.push('/(authenticated)/obs-consent' as never);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* App Header with search */}
      <AppHeader
        showSearch
        searchPlaceholder="Search or ask Copilot..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onNotificationPress={() => router.push('/notifications' as never)}
        onAvatarPress={() => router.push('/(tabs)/profile' as never)}
        avatarUri={profile?.photoUri ?? null}
        avatarInitials={
          profile?.firstName || profile?.lastName
            ? [profile?.firstName?.[0], profile?.lastName?.[0]]
                .filter(Boolean)
                .join('')
                .toUpperCase()
                .slice(0, 2) || null
            : null
        }
        notificationBadge={unreadCount > 0}
      />

      {/* Offline banner */}
      {!isConnected && <OfflineBanner />}

      {/* Proof-of-life banner when due within 14 days */}
      {showProofOfLifeBanner && (
        <TouchableOpacity
          style={styles.pofBanner}
          onPress={() => router.push('/(authenticated)/proof-of-life/intro' as never)}
          activeOpacity={0.9}
          accessibilityLabel="Proof of life due. Verify now to continue receiving grants."
          accessibilityRole="button"
        >
          <Ionicons name="shield-checkmark-outline" size={20} color="#B45309" />
          <Text style={styles.pofBannerText}>
            Please verify to continue receiving grants.
          </Text>
          <Text style={styles.pofBannerCta}>Verify now</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={DS.colors.brand.primary}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={DS.colors.brand.primary} />
            <Text style={styles.loadingText}>Loading your dashboard...</Text>
          </View>
        ) : (
          <>
            {/* BalanceCard - Figma: 120px height, 12px radius */}
            <BalanceCard
              balance={totalBalance}
              balanceVisible={balanceVisible}
              onToggleVisibility={() => setBalanceVisible(!balanceVisible)}
              walletName={primaryWallet?.name ?? 'Primary Wallet'}
            />

            {/* Empty State: Before Linking (no wallets, no linked accounts) */}
            {!hasWallets && !hasLinkedAccounts && (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="wallet-outline" size={48} color={DS.colors.brand.primary} />
                </View>
                <Text style={styles.emptyTitle}>Connect your bank</Text>
                <Text style={styles.emptyDesc}>
                  Link your bank account to start managing your money with Smartpay
                </Text>
                <TouchableOpacity
                  style={styles.linkBankButton}
                  onPress={handleLinkBank}
                  activeOpacity={0.8}
                  accessibilityLabel="Link your bank account"
                  accessibilityRole="button"
                >
                  <Text style={styles.linkBankButtonText}>Link Bank Account</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* WalletCarousel - Figma: 164×140px cards with 16px gap */}
            {hasWallets && (
              <WalletCarousel
                wallets={wallets as any}
                onWalletPress={(wallet) => handleWalletPress(wallet.id)}
                onAddWallet={handleAddWallet}
              />
            )}

            {/* ServicesGrid - Figma: 3×3 grid, 110×110px tiles */}
            <ServicesGrid
              services={filteredServices}
              onServicePress={handleServicePress}
            />

            {/* RecentContactsCarousel - Figma: 40px circular avatars */}
            {filteredContacts.length > 0 && (
              <RecentContactsCarousel
                contacts={filteredContacts.slice(0, 8)}
                onContactPress={handleContactPress}
              />
            )}

            {/* Empty state for search with no results */}
            {q && filteredServices.length === 0 && filteredContacts.length === 0 && (
              <View style={styles.searchEmptyState}>
                <Ionicons name="search-outline" size={48} color={DS.colors.textTertiary} />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptyDesc}>
                  Try searching for something else
                </Text>
              </View>
            )}

            {/* Bottom padding for FAB + TabBar (128px) */}
            <View style={styles.bottomPadding} />
          </>
        )}
      </ScrollView>

      {/* Floating Action Button - Figma: 56px, bottom-right */}
      <FloatingActionButton
        icon="paper-plane-outline"
        label="Send"
        onPress={handleSendPress}
        backgroundColor={DS.colors.brand.primary}
        iconColor={DS.colors.background}
      />
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: DS.spacing.contentBottomPadding,
  },

  // ─── Loading State ────────────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: DS.spacing['4xl'],
  },
  loadingText: {
    fontSize: DS.typography.fontSize.sm,
    fontWeight: DS.typography.fontWeight.medium,
    color: DS.colors.textSecondary,
    marginTop: DS.spacing.md,
  },

  // ─── Banners ──────────────────────────────────────────────────────────────
  pofBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: DS.spacing.horizontalPadding,
    marginTop: DS.spacing.sm,
    marginBottom: DS.spacing.sm,
    padding: DS.spacing.md,
    backgroundColor: DS.colors.accentLightest,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.colors.accentLight,
    gap: DS.spacing[2],
  },
  pofBannerText: {
    flex: 1,
    fontSize: DS.typography.fontSize.sm,
    fontWeight: DS.typography.fontWeight.medium,
    color: DS.colors.accentDark,
  },
  pofBannerCta: {
    fontSize: DS.typography.fontSize.sm,
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.accent,
  },

  // ─── Empty State (Before Linking) ─────────────────────────────────────────
  emptyStateCard: {
    marginHorizontal: DS.spacing.horizontalPadding,
    marginBottom: DS.spacing.sectionSpacing,
    backgroundColor: DS.colors.background,
    borderRadius: DS.radius.xl,
    padding: DS.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DS.colors.border,
    ...DS.shadows.md,
  },
  emptyIconCircle: {
    width: DS.components.avatar.xxl,
    height: DS.components.avatar.xxl,
    borderRadius: DS.components.avatar.xxl / 2,
    backgroundColor: `${DS.colors.brand.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DS.spacing.lg,
  },
  emptyTitle: {
    fontSize: DS.typography.fontSize.xl,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: DS.spacing.sm,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: DS.typography.fontSize.sm,
    fontWeight: DS.typography.fontWeight.normal,
    color: DS.colors.textSecondary,
    textAlign: 'center',
    marginBottom: DS.spacing.lg,
    maxWidth: 280,
  },
  linkBankButton: {
    height: DS.components.button.height.lg,
    paddingHorizontal: DS.components.button.paddingX,
    backgroundColor: DS.colors.brand.primary,
    borderRadius: DS.components.button.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    ...DS.shadows.md,
  },
  linkBankButtonText: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.background,
  },

  // ─── Search Empty State ───────────────────────────────────────────────────
  searchEmptyState: {
    alignItems: 'center',
    paddingVertical: DS.spacing['4xl'],
    paddingHorizontal: DS.spacing.horizontalPadding,
  },

  // ─── Bottom Padding ───────────────────────────────────────────────────────
  bottomPadding: {
    height: DS.spacing.contentBottomPadding,
  },
});
