/**
 * Lock Screen – Account Locked Due to Failed Authentication Attempts
 * Displays when user exceeds maximum failed PIN/biometric attempts.
 * Location: fintech/smartpay/mobile/app/lock.tsx
 * 
 * FEATURES:
 * - Countdown timer showing remaining lock time
 * - Contact support option
 * - Emergency sign out
 * - Security information
 * 
 * SECURITY:
 * - Cannot be bypassed without waiting for lock expiry
 * - Sign out clears local data but doesn't unlock account
 * - Contact support provides secure communication channel
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { designSystem } from '@/constants/designSystem';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useUser } from '@/contexts/UserContext';

const ds = designSystem;

// Support contact information
const SUPPORT_EMAIL = 'support@smartpay.na';
const SUPPORT_PHONE = '+264 61 123 4567';

interface LockScreenParams {
  lockedUntil?: string;
  reason?: string;
}

/**
 * Format remaining time as human-readable string
 */
function formatRemainingTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export default function LockScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { signOut } = useSupabaseAuth();
  const { clearUser } = useUser();
  
  const lockedUntil = params.lockedUntil ? parseInt(String(params.lockedUntil), 10) : Date.now() + (5 * 60 * 1000);
  const reason = (params.reason as string) || 'Too many failed authentication attempts';
  
  const [remainingMs, setRemainingMs] = useState(lockedUntil - Date.now());
  const [isExpired, setIsExpired] = useState(false);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = lockedUntil - Date.now();
      
      if (remaining <= 0) {
        setIsExpired(true);
        setRemainingMs(0);
        clearInterval(interval);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setRemainingMs(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockedUntil]);

  const handleContactSupport = async () => {
    Alert.alert(
      'Contact Support',
      'Choose how you would like to contact our support team:',
      [
        {
          text: 'Email',
          onPress: async () => {
            const url = `mailto:${SUPPORT_EMAIL}?subject=Account%20Locked%20-%20SmartPay`;
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
              await Linking.openURL(url);
            } else {
              Alert.alert('Email Not Available', `Please contact us at ${SUPPORT_EMAIL}`);
            }
          },
        },
        {
          text: 'Phone',
          onPress: async () => {
            const url = `tel:${SUPPORT_PHONE}`;
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
              await Linking.openURL(url);
            } else {
              Alert.alert('Phone Not Available', `Please call us at ${SUPPORT_PHONE}`);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleEmergencySignOut = () => {
    Alert.alert(
      'Emergency Sign Out',
      'This will sign you out and clear your local data, but your account will remain locked. You will need to wait for the lock period to expire or contact support to unlock your account. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await signOut();
            clearUser();
            router.replace('/(auth)');
          },
        },
      ]
    );
  };

  const handleRetry = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(authenticated)/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Lock Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed" size={64} color={ds.colors.semantic.error} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Account Locked</Text>

        {/* Reason */}
        <Text style={styles.reason}>{reason}</Text>

        {/* Countdown or Expired Message */}
        {isExpired ? (
          <View style={styles.expiredContainer}>
            <Ionicons name="checkmark-circle" size={48} color={ds.colors.semantic.success} />
            <Text style={styles.expiredText}>Lock period expired</Text>
            <Text style={styles.expiredSubtext}>You can now try again</Text>
          </View>
        ) : (
          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>Time remaining</Text>
            <Text style={styles.timer}>{formatRemainingTime(remainingMs)}</Text>
            <Text style={styles.timerHint}>Please wait before trying again</Text>
          </View>
        )}

        {/* Security Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={20} color={ds.colors.brand.primary} />
            <Text style={styles.infoText}>
              Your account has been temporarily locked for security reasons
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {isExpired ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleRetry}
              accessibilityLabel="Try again"
            >
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleContactSupport}
            accessibilityLabel="Contact support"
          >
            <Ionicons name="mail" size={20} color={ds.colors.brand.primary} />
            <Text style={styles.secondaryButtonText}>Contact Support</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleEmergencySignOut}
            accessibilityLabel="Emergency sign out"
          >
            <Ionicons name="log-out" size={20} color={ds.colors.semantic.error} />
            <Text style={styles.dangerButtonText}>Emergency Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Support Info */}
        <View style={styles.supportInfo}>
          <Text style={styles.supportText}>Need immediate help?</Text>
          <Text style={styles.supportContact}>Email: {SUPPORT_EMAIL}</Text>
          <Text style={styles.supportContact}>Phone: {SUPPORT_PHONE}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ds.colors.neutral.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: ds.spacing.lg,
    paddingVertical: ds.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: ds.spacing.xl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: ds.colors.feedback.red100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...ds.typography.textStyles.h1,
    color: ds.colors.neutral.text,
    marginBottom: ds.spacing.sm,
    textAlign: 'center',
  },
  reason: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: ds.spacing.xl,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: ds.spacing.xl,
    paddingVertical: ds.spacing.lg,
    paddingHorizontal: ds.spacing.xl,
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.lg,
    ...ds.shadows.md,
  },
  timerLabel: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: ds.spacing.xs,
  },
  timer: {
    ...ds.typography.textStyles.h1,
    fontSize: 48,
    color: ds.colors.semantic.error,
    fontWeight: '700',
    marginBottom: ds.spacing.xs,
  },
  timerHint: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
  },
  expiredContainer: {
    alignItems: 'center',
    marginBottom: ds.spacing.xl,
    paddingVertical: ds.spacing.lg,
  },
  expiredText: {
    ...ds.typography.textStyles.h3,
    color: ds.colors.semantic.success,
    marginTop: ds.spacing.md,
    marginBottom: ds.spacing.xs,
  },
  expiredSubtext: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.textSecondary,
  },
  infoCard: {
    backgroundColor: ds.colors.brand.primaryLight,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    marginBottom: ds.spacing.xl,
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.spacing.sm,
  },
  infoText: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.brand.primary,
    flex: 1,
  },
  actions: {
    width: '100%',
    gap: ds.spacing.md,
    marginBottom: ds.spacing.xl,
  },
  primaryButton: {
    backgroundColor: ds.colors.brand.primary,
    borderRadius: ds.radius.md,
    paddingVertical: ds.spacing.md,
    paddingHorizontal: ds.spacing.lg,
    alignItems: 'center',
    ...ds.shadows.sm,
  },
  primaryButtonText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.surface,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.md,
    paddingVertical: ds.spacing.md,
    paddingHorizontal: ds.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing.sm,
    borderWidth: 1,
    borderColor: ds.colors.neutral.border,
  },
  secondaryButtonText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.brand.primary,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.md,
    paddingVertical: ds.spacing.md,
    paddingHorizontal: ds.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing.sm,
    borderWidth: 1,
    borderColor: ds.colors.feedback.red100,
  },
  dangerButtonText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.semantic.error,
    fontWeight: '600',
  },
  supportInfo: {
    alignItems: 'center',
    paddingTop: ds.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: ds.colors.neutral.border,
    width: '100%',
  },
  supportText: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.textSecondary,
    marginBottom: ds.spacing.xs,
  },
  supportContact: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textTertiary,
  },
});
