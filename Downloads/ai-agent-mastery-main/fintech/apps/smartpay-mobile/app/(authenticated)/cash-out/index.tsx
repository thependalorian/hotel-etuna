/**
 * Cash Out Index - Method selection hub
 * 
 * Figma Spec: Cash-out flow hub
 * Features:
 * - Current wallet balance display
 * - Method cards (72px each):
 *   - At Till - Instant, icon: store
 *   - At Agent - N$5 fee, icon: person
 *   - At Merchant - Free, icon: storefront
 *   - At ATM - N$10 fee, icon: card
 *   - Bank Transfer - 1-2 days, icon: bank
 * - Each card shows: icon, name, fee/time, chevron
 * - Tap → Navigate to method-specific flow
 * 
 * Location: app/(authenticated)/cash-out/index.tsx
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
import { getWallets } from '@/services/wallets';

type CashOutMethod = {
  id: string;
  name: string;
  icon: string;
  description: string;
  fee: string;
  route: string;
};

const CASH_OUT_METHODS: CashOutMethod[] = [
  {
    id: 'till',
    name: 'At Till',
    icon: 'storefront-outline',
    description: 'Instant cash withdrawal',
    fee: 'Instant',
    route: '/cash-out/till',
  },
  {
    id: 'agent',
    name: 'At Agent',
    icon: 'person-outline',
    description: 'Cash out at agent location',
    fee: 'N$5 fee',
    route: '/cash-out/till?type=agent',
  },
  {
    id: 'merchant',
    name: 'At Merchant',
    icon: 'business-outline',
    description: 'Cash out at merchant',
    fee: 'Free',
    route: '/cash-out/till?type=merchant',
  },
  {
    id: 'atm',
    name: 'At ATM',
    icon: 'card-outline',
    description: 'Withdraw from ATM',
    fee: 'N$10 fee',
    route: '/cash-out/atm',
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    icon: 'business-outline',
    description: 'Transfer to bank account',
    fee: '1-2 days',
    route: '/cash-out/bank',
  },
];

export default function CashOutIndexScreen() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const wallets = await getWallets();
      const total = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
      setBalance(total);
    } catch (error) {
      console.error('Failed to load balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMethodPress = (method: CashOutMethod) => {
    router.push(method.route as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <AppHeader
          title="Cash Out"
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
        title="Cash Out"
        showBackButton
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            N${balance.toLocaleString('en-NA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={styles.balanceHint}>Choose a cash-out method below</Text>
        </View>

        <View style={styles.methodsSection}>
          <Text style={styles.sectionTitle}>Cash-Out Methods</Text>
          <View style={styles.methodsList}>
            {CASH_OUT_METHODS.map((method) => (
              <CashOutMethodCard
                key={method.id}
                method={method}
                onPress={() => handleMethodPress(method)}
              />
            ))}
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={DS.colors.brand.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Need Help?</Text>
              <Text style={styles.infoText}>
                Choose the method that works best for you. All methods are secure and instant.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface CashOutMethodCardProps {
  method: CashOutMethod;
  onPress: () => void;
}

function CashOutMethodCard({ method, onPress }: CashOutMethodCardProps) {
  return (
    <TouchableOpacity
      style={styles.methodCard}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`${method.name}, ${method.description}, ${method.fee}`}
      accessibilityRole="button"
    >
      <View style={styles.methodLeft}>
        <View style={[styles.methodIcon, { backgroundColor: `${DS.colors.services.cashOut}15` }]}>
          <Ionicons name={method.icon as any} size={28} color={DS.colors.services.cashOut} />
        </View>
        <View style={styles.methodInfo}>
          <Text style={styles.methodName}>{method.name}</Text>
          <Text style={styles.methodDescription}>{method.description}</Text>
        </View>
      </View>
      <View style={styles.methodRight}>
        <Text style={styles.methodFee}>{method.fee}</Text>
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
    paddingBottom: DS.spacing.xl,
  },
  balanceSection: {
    backgroundColor: DS.colors.surface,
    padding: DS.spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: DS.colors.border,
  },
  balanceLabel: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
    marginBottom: DS.spacing.xs,
  },
  balanceAmount: {
    fontSize: DS.typography.fontSize['4xl'],
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.text,
    marginBottom: DS.spacing.xs,
  },
  balanceHint: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
  },
  methodsSection: {
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.lg,
  },
  sectionTitle: {
    fontSize: DS.typography.fontSize.lg,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: DS.spacing.md,
  },
  methodsList: {
    gap: DS.spacing.sm,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DS.spacing.md,
    backgroundColor: DS.colors.background,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.colors.border,
    minHeight: 72,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: DS.spacing.md,
  },
  methodIcon: {
    width: 56,
    height: 56,
    borderRadius: DS.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodInfo: {
    flex: 1,
    gap: 2,
  },
  methodName: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
  },
  methodDescription: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
  },
  methodRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
  },
  methodFee: {
    fontSize: DS.typography.fontSize.sm,
    fontWeight: DS.typography.fontWeight.medium,
    color: DS.colors.brand.primary,
  },
  infoSection: {
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    gap: DS.spacing.md,
    padding: DS.spacing.md,
    backgroundColor: DS.colors.brand.primaryMuted,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.colors.brand.primaryLight,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.brand.primary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.brand.primary,
    lineHeight: 20,
  },
});
