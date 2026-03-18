/**
 * Amount Screen - Send Money Flow Step 2/5
 * 
 * Figma Node: 153:752
 * Location: app/send-money/amount.tsx
 * 
 * Components:
 * - AppHeader with "Send to [Name]"
 * - ContactChip at top (selected recipient with avatar)
 * - Large amount display (32-40px bold)
 * - AmountInput component (numeric keypad, 72×72px keys)
 * - Wallet selector: "From: Primary Wallet (N$ 800.00)"
 * - Change Wallet button (opens WalletPicker bottom sheet)
 * - Primary CTA: "Continue" (56px)
 * 
 * Validation:
 * - amount > 0
 * - amount <= wallet balance
 * 
 * Navigation:
 * - onContinue → /send-money/confirm?recipient=[data]&amount=[value]
 * 
 * ASCII Diagram (Figma):
 * ┌─────────────────────────────────────────┐
 * │ [← Back]  Send to Anna                  │
 * ├─────────────────────────────────────────┤
 * │                                         │
 * │ [Avatar: AB]  Anna Johnson              │ ← ContactChip
 * │ SP-81234567                             │
 * │                                         │
 * │         N$ 0                            │ ← Amount (32-40px)
 * │                                         │
 * │ ┌───┬───┬───┐                          │
 * │ │ 1 │ 2 │ 3 │                          │ ← Numeric keypad
 * │ ├───┼───┼───┤                          │   72×72px keys
 * │ │ 4 │ 5 │ 6 │                          │   24px font
 * │ ├───┼───┼───┤                          │
 * │ │ 7 │ 8 │ 9 │                          │
 * │ ├───┼───┼───┤                          │
 * │ │   │ 0 │ ⌫ │                          │
 * │ └───┴───┴───┘                          │
 * │                                         │
 * │ From: Primary Wallet (N$ 800.00)       │
 * │ [Change Wallet ▼]                       │
 * │                                         │
 * │ [Continue] ← 56px Primary CTA           │
 * └─────────────────────────────────────────┘
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { designSystem as DS } from '@/constants/designSystem';
import { AppHeader } from '@/components/layout/AppHeader';
import { AmountInput } from '@/components/shared/AmountInput';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useWallets } from '@/contexts/WalletsContext';
import type { Wallet } from '@/contexts/WalletsContext';

export default function AmountScreen() {
  const params = useLocalSearchParams<{
    recipientId: string;
    recipientName: string;
    recipientPhone: string;
    recipientSmartpayId: string;
    recipientAvatar?: string;
  }>();

  const { wallets, primaryWallet } = useWallets();
  const [amount, setAmount] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(primaryWallet);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (primaryWallet && !selectedWallet) {
      setSelectedWallet(primaryWallet);
    }
  }, [primaryWallet]);

  const numericAmount = amount ? parseFloat(amount) / 100 : 0;
  const walletBalance = selectedWallet ? selectedWallet.balance / 100 : 0;
  const isValidAmount = numericAmount > 0 && numericAmount <= walletBalance;

  const handleContinue = () => {
    if (!isValidAmount) {
      setError(
        numericAmount <= 0
          ? 'Please enter an amount'
          : 'Insufficient funds'
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/send-money/confirm',
      params: {
        ...params,
        amount: numericAmount.toString(),
        walletId: selectedWallet?.id || '',
        walletName: selectedWallet?.name || '',
      },
    });
  };

  const handleWalletSelect = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setShowWalletPicker(false);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader
          showSearch={false}
          showBackButton
          onBackPress={() => router.back()}
          title={`Send to ${params.recipientName}`}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Recipient Chip */}
          <View style={styles.recipientContainer}>
            <View style={styles.recipientChip}>
              <View style={styles.recipientAvatar}>
                {params.recipientAvatar ? (
                  <Image
                    source={{ uri: params.recipientAvatar }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarInitials}>
                    {getInitials(params.recipientName)}
                  </Text>
                )}
              </View>
              <View style={styles.recipientInfo}>
                <Text style={styles.recipientName}>{params.recipientName}</Text>
                <Text style={styles.recipientId}>
                  {params.recipientSmartpayId || params.recipientPhone}
                </Text>
              </View>
            </View>
          </View>

          {/* Amount Input with Keypad */}
          <AmountInput
            amount={amount}
            onAmountChange={setAmount}
            maxAmount={walletBalance}
            currency="N$"
          />

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color={DS.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Wallet Selector */}
          <View style={styles.walletSection}>
            <Text style={styles.walletLabel}>From</Text>
            <TouchableOpacity
              style={styles.walletSelector}
              onPress={() => setShowWalletPicker(true)}
              accessibilityLabel="Change wallet"
              accessibilityRole="button"
            >
              <View style={styles.walletInfo}>
                <View style={[styles.walletIcon, { backgroundColor: selectedWallet?.color || DS.colors.brand.primary }]}>
                  <Ionicons
                    name={(selectedWallet?.icon as any) || 'wallet'}
                    size={20}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.walletDetails}>
                  <Text style={styles.walletName}>
                    {selectedWallet?.name || 'Select Wallet'}
                  </Text>
                  <Text style={styles.walletBalance}>
                    Balance: N$ {walletBalance.toFixed(2)}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-down" size={20} color={DS.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.bottomContainer}>
          <Button
            variant="primary"
            onPress={handleContinue}
            disabled={!isValidAmount}
            accessibilityLabel="Continue to confirmation"
            accessibilityHint={`Send ${numericAmount.toFixed(2)} dollars to ${params.recipientName}`}
          >
            Continue
          </Button>
        </View>
      </SafeAreaView>

      {/* Wallet Picker BottomSheet */}
      <BottomSheet
        visible={showWalletPicker}
        onClose={() => setShowWalletPicker(false)}
        maxHeight="50%"
      >
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>Select Wallet</Text>
          {wallets.map(wallet => (
            <TouchableOpacity
              key={wallet.id}
              style={[
                styles.walletOption,
                selectedWallet?.id === wallet.id && styles.walletOptionSelected,
              ]}
              onPress={() => handleWalletSelect(wallet)}
              accessibilityLabel={`${wallet.name}, balance ${(wallet.balance / 100).toFixed(2)} dollars`}
              accessibilityRole="button"
            >
              <View style={[styles.walletIcon, { backgroundColor: wallet.color }]}>
                <Ionicons name={(wallet.icon as any) || 'wallet'} size={20} color="#FFFFFF" />
              </View>
              <View style={styles.walletDetails}>
                <Text style={styles.walletName}>{wallet.name}</Text>
                <Text style={styles.walletBalance}>
                  N$ {(wallet.balance / 100).toFixed(2)}
                </Text>
              </View>
              {selectedWallet?.id === wallet.id && (
                <Ionicons name="checkmark-circle" size={24} color={DS.colors.success} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DS.colors.background,
  },
  safe: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  recipientContainer: {
    paddingHorizontal: DS.spacing.horizontalPadding,
    paddingVertical: DS.spacing.lg,
    alignItems: 'center',
  },
  recipientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DS.colors.surface,
    paddingVertical: DS.spacing.md,
    paddingHorizontal: DS.spacing.lg,
    borderRadius: DS.radius.pill,
    borderWidth: 1,
    borderColor: DS.colors.border,
    ...DS.shadows.sm,
  },
  recipientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DS.colors.brand50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DS.spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.brand.primary,
  },
  recipientInfo: {
    alignItems: 'flex-start',
  },
  recipientName: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: 2,
  },
  recipientId: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DS.spacing.xs,
    paddingHorizontal: DS.spacing.horizontalPadding,
    marginTop: DS.spacing.sm,
  },
  errorText: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.error,
  },
  walletSection: {
    paddingHorizontal: DS.spacing.horizontalPadding,
    marginTop: DS.spacing.xl,
  },
  walletLabel: {
    fontSize: DS.typography.fontSize.sm,
    fontWeight: DS.typography.fontWeight.medium,
    color: DS.colors.textSecondary,
    marginBottom: DS.spacing.sm,
  },
  walletSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DS.colors.surface,
    padding: DS.spacing.md,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.colors.border,
    ...DS.shadows.sm,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DS.spacing.md,
  },
  walletDetails: {
    flex: 1,
  },
  walletName: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: 2,
  },
  walletBalance: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
  },
  bottomContainer: {
    paddingHorizontal: DS.spacing.horizontalPadding,
    paddingVertical: DS.spacing.md,
    backgroundColor: DS.colors.background,
    borderTopWidth: 1,
    borderTopColor: DS.colors.borderLight,
  },
  pickerContainer: {
    paddingVertical: DS.spacing.md,
  },
  pickerTitle: {
    fontSize: DS.typography.fontSize['2xl'],
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    textAlign: 'center',
    marginBottom: DS.spacing.lg,
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DS.spacing.md,
    paddingHorizontal: DS.spacing.md,
    borderRadius: DS.radius.md,
    marginBottom: DS.spacing.sm,
  },
  walletOptionSelected: {
    backgroundColor: DS.colors.brand50,
  },
});
