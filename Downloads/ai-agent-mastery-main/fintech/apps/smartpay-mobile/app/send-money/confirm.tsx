/**
 * Confirm Payment Screen - Send Money Flow Step 3/5
 * 
 * Figma Node: 84:356
 * Location: app/send-money/confirm.tsx
 * 
 * Components:
 * - AppHeader with "Confirm Payment"
 * - Recipient card (avatar, name, SmartpayID)
 * - Transaction Summary:
 *   - Amount: N$ X
 *   - Fee: N$ Y
 *   - Total: N$ Z (bold)
 * - From wallet info
 * - New balance calculation
 * - Primary CTA: "Send Money" (56px)
 * - Opens TwoFAModal on press
 * 
 * Navigation:
 * - onConfirm → Opens TwoFAModal
 * - onVerify → POST /api/v1/mobile/send-money
 * - onSuccess → /send-money/success?transaction=[data]
 * 
 * Error Handling:
 * - Send 4xx → Toast error, stay on confirm
 * - Network error → ErrorState with retry
 * 
 * ASCII Diagram (Figma):
 * ┌─────────────────────────────────────────┐
 * │ [← Back]  Confirm Payment               │
 * ├─────────────────────────────────────────┤
 * │ ┌─────────────────────────────────────┐│
 * │ │ [Avatar: AB]                         ││
 * │ │ Anna Johnson                         ││ ← Recipient card
 * │ │ SP-81234567                          ││
 * │ └─────────────────────────────────────┘│
 * │                                         │
 * │ Amount:        N$ 100.00                │
 * │ Fee:           N$   1.50                │
 * │ ────────────────────                    │
 * │ Total:         N$ 101.50                │ ← Bold
 * │                                         │
 * │ From:  Primary Wallet                   │
 * │ New Balance: N$ 698.50                  │
 * │                                         │
 * │ [Send Money] ← 56px Primary CTA         │
 * └─────────────────────────────────────────┘
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { designSystem as DS } from '@/constants/designSystem';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { TwoFAModal } from '@/components/modals/TwoFAModal';
import { useWallets } from '@/contexts/WalletsContext';
import { sendMoney } from '@/services/send';

const TRANSACTION_FEE_PERCENTAGE = 0.015;

export default function ConfirmScreen() {
  const params = useLocalSearchParams<{
    recipientId: string;
    recipientName: string;
    recipientPhone: string;
    recipientSmartpayId: string;
    recipientAvatar?: string;
    amount: string;
    walletId: string;
    walletName: string;
  }>();

  const { getWalletById, refresh } = useWallets();
  const [showTwoFA, setShowTwoFA] = useState(false);
  const [loading, setLoading] = useState(false);

  const amount = parseFloat(params.amount);
  const fee = amount * TRANSACTION_FEE_PERCENTAGE;
  const total = amount + fee;

  const wallet = getWalletById(params.walletId);
  const walletBalance = wallet ? wallet.balance / 100 : 0;
  const newBalance = walletBalance - total;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSendMoney = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowTwoFA(true);
  };

  const handleVerify = async (pin: string) => {
    setLoading(true);

    try {
      const result = await sendMoney({
        recipientPhone: params.recipientPhone,
        amount: total * 100,
        walletId: params.walletId,
        pin,
      });

      if (result.success) {
        await refresh();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        setShowTwoFA(false);
        router.replace({
          pathname: '/send-money/success',
          params: {
            ...params,
            amount: amount.toString(),
            fee: fee.toFixed(2),
            total: total.toFixed(2),
            transactionId: result.transactionId || 'TXN-' + Date.now(),
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Transfer Failed', result.error || 'Please try again');
        setShowTwoFA(false);
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Network error. Please try again.');
      setShowTwoFA(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader
          showSearch={false}
          showBackButton
          onBackPress={() => router.back()}
          title="Confirm Payment"
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Recipient Card */}
          <View style={styles.recipientCard}>
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
            <Text style={styles.recipientName}>{params.recipientName}</Text>
            <Text style={styles.recipientId}>
              {params.recipientSmartpayId || params.recipientPhone}
            </Text>
          </View>

          {/* Transaction Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryValue}>N$ {amount.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Fee</Text>
              <Text style={styles.summaryValue}>N$ {fee.toFixed(2)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>N$ {total.toFixed(2)}</Text>
            </View>
          </View>

          {/* Wallet Info */}
          <View style={styles.walletCard}>
            <View style={styles.walletRow}>
              <Text style={styles.walletLabel}>From</Text>
              <Text style={styles.walletValue}>{params.walletName}</Text>
            </View>

            <View style={styles.walletRow}>
              <Text style={styles.walletLabel}>Current Balance</Text>
              <Text style={styles.walletValue}>N$ {walletBalance.toFixed(2)}</Text>
            </View>

            <View style={[styles.walletRow, { marginTop: DS.spacing.sm }]}>
              <Text style={[styles.walletLabel, styles.newBalanceLabel]}>New Balance</Text>
              <Text style={[styles.walletValue, styles.newBalanceValue]}>
                N$ {newBalance.toFixed(2)}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Send Money Button */}
        <View style={styles.bottomContainer}>
          <Button
            variant="primary"
            onPress={handleSendMoney}
            isLoading={loading}
            disabled={loading}
            accessibilityLabel="Send money"
            accessibilityHint={`Send ${total.toFixed(2)} dollars to ${params.recipientName}`}
          >
            Send Money
          </Button>
        </View>
      </SafeAreaView>

      {/* Two-Factor Authentication Modal */}
      <TwoFAModal
        visible={showTwoFA}
        onClose={() => setShowTwoFA(false)}
        onVerify={handleVerify}
        transaction={{
          amount: total,
          recipient: params.recipientName,
        }}
        allowBiometric={true}
      />
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
    paddingHorizontal: DS.spacing.horizontalPadding,
    paddingTop: DS.spacing.lg,
    paddingBottom: 100,
  },
  recipientCard: {
    backgroundColor: DS.colors.surface,
    padding: DS.spacing.lg,
    borderRadius: DS.radius.lg,
    alignItems: 'center',
    marginBottom: DS.spacing.lg,
    ...DS.shadows.sm,
  },
  recipientAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: DS.colors.brand50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DS.spacing.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: DS.colors.brand.primary,
  },
  avatarImage: {
    width: 72,
    height: 72,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.brand.primary,
  },
  recipientName: {
    fontSize: DS.typography.fontSize.xl,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: 4,
  },
  recipientId: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: DS.colors.surface,
    padding: DS.spacing.lg,
    borderRadius: DS.radius.lg,
    marginBottom: DS.spacing.lg,
    ...DS.shadows.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DS.spacing.md,
  },
  summaryLabel: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.textSecondary,
  },
  summaryValue: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: DS.colors.border,
    marginVertical: DS.spacing.sm,
  },
  totalLabel: {
    fontSize: DS.typography.fontSize.lg,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
  },
  totalValue: {
    fontSize: DS.typography.fontSize.xl,
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.text,
  },
  walletCard: {
    backgroundColor: DS.colors.surface,
    padding: DS.spacing.lg,
    borderRadius: DS.radius.lg,
    marginBottom: DS.spacing.lg,
    ...DS.shadows.sm,
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DS.spacing.sm,
  },
  walletLabel: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
  },
  walletValue: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.medium,
    color: DS.colors.text,
  },
  newBalanceLabel: {
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
  },
  newBalanceValue: {
    fontSize: DS.typography.fontSize.lg,
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.brand.primary,
  },
  bottomContainer: {
    paddingHorizontal: DS.spacing.horizontalPadding,
    paddingVertical: DS.spacing.md,
    backgroundColor: DS.colors.background,
    borderTopWidth: 1,
    borderTopColor: DS.colors.borderLight,
  },
});
