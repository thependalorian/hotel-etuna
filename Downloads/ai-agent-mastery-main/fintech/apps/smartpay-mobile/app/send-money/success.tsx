/**
 * Payment Success Screen - Send Money Flow Step 5/5
 * 
 * Figma Node: 87:410
 * Location: app/send-money/success.tsx
 * 
 * Components:
 * - Animated checkmark (96×96, green #22C55E, spring animation)
 * - Title: "Payment Sent!" (24px bold)
 * - Amount (36px bold accent color)
 * - Subtitle: "You sent N$X to [Name]" (16px regular)
 * - Receipt card:
 *   - Transaction ID
 *   - Timestamp (formatted)
 *   - Fee
 * - Actions:
 *   - Share Receipt (secondary CTA)
 *   - Done (primary CTA) → Home
 * 
 * Navigation:
 * - onDone → /(tabs)/home (replace stack)
 * - onShare → Share API
 * 
 * ASCII Diagram (Figma):
 * ┌─────────────────────────────────────────┐
 * │                                         │
 * │            ✓                            │ ← Animated (96×96)
 * │        ┌──────┐                         │   Green #22C55E
 * │        │  ✓   │                         │   Spring animation
 * │        └──────┘                         │
 * │                                         │
 * │     Payment Sent!                       │ ← 24px bold
 * │                                         │
 * │     N$ 100.00                           │ ← 36px bold accent
 * │                                         │
 * │  You sent N$100 to Anna Johnson         │ ← 16px regular
 * │                                         │
 * │ ┌─────────────────────────────────────┐│
 * │ │ Transaction ID: TXN-123456789       ││ ← Receipt Card
 * │ │ Mar 17, 2026 • 14:23                ││
 * │ │ Fee: N$1.50                          ││
 * │ └─────────────────────────────────────┘│
 * │                                         │
 * │ [Share Receipt] ← 56px Secondary CTA    │
 * │ [Done] ← 56px Primary CTA               │
 * └─────────────────────────────────────────┘
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { designSystem as DS } from '@/constants/designSystem';
import { Button } from '@/components/ui/Button';

export default function SuccessScreen() {
  const params = useLocalSearchParams<{
    recipientName: string;
    recipientSmartpayId: string;
    amount: string;
    fee: string;
    total: string;
    transactionId: string;
    timestamp: string;
  }>();

  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: DS.animations.spring.damping,
      stiffness: DS.animations.spring.stiffness,
      mass: DS.animations.spring.mass,
    }).start();
  }, []);

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${month} ${day}, ${year} • ${hours}:${minutes}`;
  };

  const handleShareReceipt = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      const message = `
Payment Receipt

To: ${params.recipientName}
Amount: N$ ${params.amount}
Fee: N$ ${params.fee}
Total: N$ ${params.total}

Transaction ID: ${params.transactionId}
Date: ${formatTimestamp(params.timestamp)}

Sent via Smartpay
      `.trim();

      await Share.share({
        message,
        title: 'Payment Receipt',
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
    }
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Animated Checkmark - 96×96px */}
          <Animated.View style={[styles.checkmarkContainer, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.checkmarkCircle}>
              <Ionicons name="checkmark" size={48} color="#FFFFFF" />
            </View>
          </Animated.View>

          {/* Title - 24px bold */}
          <Text style={styles.title}>Payment Sent!</Text>

          {/* Amount - 36px bold accent */}
          <Text style={styles.amount}>N$ {params.amount}</Text>

          {/* Subtitle - 16px regular */}
          <Text style={styles.subtitle}>
            You sent N${params.amount} to {params.recipientName}
          </Text>

          {/* Receipt Card */}
          <View style={styles.receiptCard}>
            <View style={styles.receiptRow}>
              <Ionicons name="receipt-outline" size={20} color={DS.colors.textSecondary} />
              <Text style={styles.receiptLabel}>Transaction ID</Text>
            </View>
            <Text style={styles.receiptValue}>{params.transactionId}</Text>

            <View style={[styles.receiptRow, { marginTop: DS.spacing.md }]}>
              <Ionicons name="time-outline" size={20} color={DS.colors.textSecondary} />
              <Text style={styles.receiptLabel}>Date & Time</Text>
            </View>
            <Text style={styles.receiptValue}>{formatTimestamp(params.timestamp)}</Text>

            <View style={[styles.receiptRow, { marginTop: DS.spacing.md }]}>
              <Ionicons name="card-outline" size={20} color={DS.colors.textSecondary} />
              <Text style={styles.receiptLabel}>Transaction Fee</Text>
            </View>
            <Text style={styles.receiptValue}>N$ {params.fee}</Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.bottomContainer}>
          <Button
            variant="secondary"
            onPress={handleShareReceipt}
            accessibilityLabel="Share receipt"
            style={styles.shareButton}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="share-outline" size={20} color={DS.colors.text} />
              <Text style={styles.shareButtonText}>Share Receipt</Text>
            </View>
          </Button>

          <Button
            variant="primary"
            onPress={handleDone}
            accessibilityLabel="Return to home"
          >
            Done
          </Button>
        </View>
      </SafeAreaView>
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
    paddingTop: DS.spacing['3xl'],
    alignItems: 'center',
  },
  checkmarkContainer: {
    marginBottom: DS.spacing.xl,
  },
  checkmarkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: DS.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: DS.typography.fontSize['2xl'],
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.text,
    marginBottom: DS.spacing.md,
    textAlign: 'center',
  },
  amount: {
    fontSize: DS.typography.fontSize['4xl'],
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.accent,
    marginBottom: DS.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.textSecondary,
    textAlign: 'center',
    marginBottom: DS.spacing.xl,
  },
  receiptCard: {
    width: '100%',
    backgroundColor: DS.colors.surface,
    padding: DS.spacing.lg,
    borderRadius: DS.radius.lg,
    marginBottom: DS.spacing.lg,
    ...DS.shadows.sm,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    marginBottom: 4,
  },
  receiptLabel: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
  },
  receiptValue: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.medium,
    color: DS.colors.text,
    marginLeft: 28,
  },
  bottomContainer: {
    paddingHorizontal: DS.spacing.horizontalPadding,
    paddingVertical: DS.spacing.md,
    backgroundColor: DS.colors.background,
    borderTopWidth: 1,
    borderTopColor: DS.colors.borderLight,
    gap: DS.spacing.md,
  },
  shareButton: {
    marginBottom: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
  },
  shareButtonText: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
  },
});
