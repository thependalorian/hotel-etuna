/**
 * TwoFAModal – Two-Factor Authentication with PIN and biometric
 * Figma spec: BottomSheet wrapper, 6 PIN dots (12px, 8px gap)
 * Numeric keypad: 72×72px keys, 24px font (3×4 grid)
 * Location: mobile/components/modals/TwoFAModal.tsx
 * 
 * States: default, loading, error
 * 
 * USAGE:
 * ```tsx
 * <TwoFAModal
 *   visible={showAuth}
 *   onClose={() => setShowAuth(false)}
 *   onVerify={(pin) => handleVerify(pin)}
 *   transaction={{
 *     amount: 100,
 *     recipient: 'Anna Johnson',
 *   }}
 *   allowBiometric={true}
 * />
 * ```
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { designSystem as DS } from '@/constants/designSystem';

export interface TwoFAModalProps {
  visible: boolean;
  onClose: () => void;
  onVerify: (pin: string) => Promise<void>;
  transaction?: {
    amount: number;
    recipient: string;
  };
  allowBiometric?: boolean;
}

const PIN_LENGTH = 6;
const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'backspace'],
];

export function TwoFAModal({
  visible,
  onClose,
  onVerify,
  transaction,
  allowBiometric = false,
}: TwoFAModalProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    if (!allowBiometric) return;
    
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(hasHardware && isEnrolled);
  };

  const handleKeyPress = (key: string) => {
    if (loading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (key === 'backspace') {
      setPin(prev => prev.slice(0, -1));
      setError(null);
      return;
    }

    if (key === '' || pin.length >= PIN_LENGTH) return;

    const newPin = pin + key;
    setPin(newPin);
    setError(null);

    if (newPin.length === PIN_LENGTH) {
      handleVerify(newPin);
    }
  };

  const handleVerify = async (pinCode: string) => {
    setLoading(true);
    setError(null);

    try {
      await onVerify(pinCode);
      setPin('');
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err instanceof Error ? err.message : 'Verification failed');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: transaction
          ? `Verify payment of N$${transaction.amount.toFixed(2)}`
          : 'Verify your identity',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        await onVerify('BIOMETRIC_AUTH');
        setPin('');
      } else {
        setError('Biometric authentication failed');
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      maxHeight="70%"
    >
      <View style={styles.container}>
        <Text style={styles.title}>Verify identity</Text>

        {transaction && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>
              N$ {transaction.amount.toFixed(2)} to {transaction.recipient}
            </Text>
          </View>
        )}

        <View style={styles.pinDotsContainer}>
          {Array.from({ length: PIN_LENGTH }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.pinDot,
                index < pin.length && styles.pinDotFilled,
              ]}
            />
          ))}
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color={DS.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={DS.colors.brand.primary} />
          </View>
        )}

        {!loading && (
          <View style={styles.keypad}>
            {KEYS.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.keypadRow}>
                {row.map((key, keyIndex) => (
                  <TouchableOpacity
                    key={keyIndex}
                    style={[
                      styles.key,
                      key === '' && styles.keyEmpty,
                    ]}
                    onPress={() => handleKeyPress(key)}
                    activeOpacity={0.7}
                    disabled={key === '' || loading}
                    accessibilityLabel={key === 'backspace' ? 'Delete' : key}
                    accessibilityRole="button"
                  >
                    {key === 'backspace' ? (
                      <Ionicons name="backspace-outline" size={28} color={DS.colors.text} />
                    ) : key !== '' ? (
                      <Text style={styles.keyText}>{key}</Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        )}

        {biometricAvailable && !loading && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometric}
            accessibilityLabel="Use biometric authentication"
            accessibilityRole="button"
          >
            <Ionicons name="finger-print" size={24} color={DS.colors.brand.primary} />
            <Text style={styles.biometricText}>Use biometric instead</Text>
          </TouchableOpacity>
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: DS.spacing.md,
  },
  title: {
    fontSize: DS.typography.fontSize['2xl'],
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    textAlign: 'center',
    marginBottom: DS.spacing.lg,
  },
  summaryContainer: {
    backgroundColor: DS.colors.surface,
    padding: DS.spacing.md,
    borderRadius: DS.radius.md,
    marginBottom: DS.spacing.lg,
  },
  summaryText: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.medium,
    color: DS.colors.text,
    textAlign: 'center',
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: DS.spacing.xl,
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: DS.colors.border,
  },
  pinDotFilled: {
    backgroundColor: DS.colors.text,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DS.spacing.xs,
    marginBottom: DS.spacing.md,
  },
  errorText: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.error,
  },
  loadingContainer: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypad: {
    gap: 12,
    alignItems: 'center',
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 12,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  keyEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  keyText: {
    fontSize: 24,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DS.spacing.sm,
    marginTop: DS.spacing.lg,
    paddingVertical: DS.spacing.md,
  },
  biometricText: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.brand.primary,
    fontWeight: DS.typography.fontWeight.medium,
  },
});
