/**
 * TwoFAModal – Two-Factor Authentication Modal Component
 * Provides PIN and biometric authentication UI for transaction security.
 * Location: fintech/smartpay/components/TwoFAModal.tsx
 * 
 * USAGE:
 * ```tsx
 * const [showModal, setShowModal] = useState(false);
 * 
 * <TwoFAModal
 *   visible={showModal}
 *   onSuccess={(token) => {
 *     // Proceed with transaction using token
 *     executeTransaction(token);
 *   }}
 *   onCancel={() => setShowModal(false)}
 *   title="Confirm Transaction"
 *   message="Authenticate to send N$500.00 to Anna Smith"
 * />
 * ```
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CodeField, Cursor, useBlurOnFulfill, useClearByFocusCell } from 'react-native-confirmation-code-field';
import * as Haptics from 'expo-haptics';
import { designSystem } from '@/constants/designSystem';
import {
  verifyPIN,
  authenticateBiometric,
  isBiometricEnabled,
  checkBiometricAvailability,
  getFailedPINAttempts,
  type TwoFAResult,
} from '@/services/twoFactorAuth';
import { getBiometricTypeName, type BiometricType } from '@/services/biometrics';

const ds = designSystem;
const PIN_LENGTH = 6;

export interface TwoFAModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when authentication succeeds */
  onSuccess: (token: string, expiresAt: number) => void;
  /** Callback when user cancels */
  onCancel: () => void;
  /** Modal title */
  title?: string;
  /** Authentication message/context */
  message?: string;
  /** Prefer biometric over PIN (if available) */
  preferBiometric?: boolean;
  /** Test ID */
  testID?: string;
}

export function TwoFAModal({
  visible,
  onSuccess,
  onCancel,
  title = 'Authentication Required',
  message = 'Please authenticate to continue',
  preferBiometric = true,
  testID = 'two-fa-modal',
}: TwoFAModalProps) {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>('none');
  const [useBiometric, setUseBiometric] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const ref = useBlurOnFulfill({ value: pin, cellCount: PIN_LENGTH });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value: pin,
    setValue: setPin,
  });

  // Check biometric availability and failed attempts on mount
  useEffect(() => {
    async function checkBiometric() {
      const availability = await checkBiometricAvailability();
      const enabled = await isBiometricEnabled();
      const available = availability.isAvailable && availability.isEnrolled && enabled;
      setBiometricAvailable(available);
      setBiometricType(availability.biometricType);
      setUseBiometric(available && preferBiometric);
      
      // Get current failed attempts
      const attempts = await getFailedPINAttempts();
      setFailedAttempts(attempts);
    }
    checkBiometric();
  }, [preferBiometric]);

  // Auto-trigger biometric on modal open
  useEffect(() => {
    if (visible && useBiometric) {
      handleBiometricAuth();
    }
  }, [visible, useBiometric]);

  // Auto-verify PIN when 6 digits entered
  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      handlePINVerify();
    }
  }, [pin]);

  const handleBiometricAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      const biometricTypeName = getBiometricTypeName(biometricType);
      const result = await authenticateBiometric({
        promptMessage: message,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
      });

      if (result.success && result.token && result.expiresAt) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess(result.token, result.expiresAt);
      } else {
        // Biometric failed
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        // Check if account is locked
        if (result.lockedUntil) {
          router.replace({
            pathname: '/lock',
            params: {
              lockedUntil: String(result.lockedUntil),
              reason: result.error || 'Too many failed attempts',
            },
          });
          onCancel();
          return;
        }
        
        // Switch to PIN
        setUseBiometric(false);
        setError(result.error || `${biometricTypeName} authentication failed`);
        
        if (result.attemptsRemaining !== undefined) {
          setAttemptsRemaining(result.attemptsRemaining);
        }
      }
    } catch (err) {
      console.error('Biometric auth error:', err);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setUseBiometric(false);
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePINVerify = async () => {
    if (pin.length !== PIN_LENGTH) return;

    setLoading(true);
    setError(null);

    try {
      const result: TwoFAResult = await verifyPIN(pin);

      if (result.success && result.token && result.expiresAt) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess(result.token, result.expiresAt);
        setPin('');
        setError(null);
        setAttemptsRemaining(null);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(result.error || 'Authentication failed');
        setAttemptsRemaining(result.attemptsRemaining || null);
        setPin('');
        
        // Update failed attempts count
        const attempts = await getFailedPINAttempts();
        setFailedAttempts(attempts);

        // Redirect to lock screen if locked
        if (result.lockedUntil) {
          router.replace({
            pathname: '/lock',
            params: {
              lockedUntil: String(result.lockedUntil),
              reason: result.error || 'Too many failed attempts',
            },
          });
          onCancel();
        }
      }
    } catch (err) {
      console.error('PIN verification error:', err);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Verification failed');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryBiometric = async () => {
    setError(null);
    setUseBiometric(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleBiometricAuth();
  };
  
  const handleSwitchToPIN = async () => {
    setUseBiometric(false);
    setError(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handleSwitchToBiometric = async () => {
    setUseBiometric(true);
    setError(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleBiometricAuth();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      testID={testID}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onCancel}
        />

        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity
                onPress={onCancel}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={ds.colors.neutral.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Message */}
            <Text style={styles.message}>{message}</Text>

            {/* Biometric View */}
            {useBiometric ? (
              <View style={styles.biometricContainer}>
                <Ionicons
                  name={biometricType === 'face' ? 'scan' : 'finger-print'}
                  size={80}
                  color={ds.colors.brand.primary}
                  style={styles.biometricIcon}
                />
                <Text style={styles.biometricLabel}>
                  {getBiometricTypeName(biometricType)}
                </Text>
                {loading && <ActivityIndicator size="large" color={ds.colors.brand.primary} />}
                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={20} color={ds.colors.feedback.red} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={handleRetryBiometric}
                    >
                      <Text style={styles.retryButtonText}>Retry {getBiometricTypeName(biometricType)}</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {biometricAvailable && !loading && (
                  <TouchableOpacity
                    style={styles.fallbackButton}
                    onPress={handleSwitchToPIN}
                  >
                    <Text style={styles.fallbackButtonText}>Use PIN Instead</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              // PIN View
              <View style={styles.pinContainer}>
                <Text style={styles.pinLabel}>Enter your PIN</Text>

                <CodeField
                  ref={ref}
                  {...props}
                  value={pin}
                  onChangeText={setPin}
                  cellCount={PIN_LENGTH}
                  rootStyle={styles.codeFieldRoot}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  renderCell={({ index, symbol, isFocused }) => (
                    <View
                      key={index}
                      style={[styles.cell, isFocused && styles.focusCell]}
                      onLayout={getCellOnLayoutHandler(index)}
                    >
                      <Text style={styles.cellText}>
                        {symbol ? '●' : isFocused ? <Cursor /> : null}
                      </Text>
                    </View>
                  )}
                />

                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={20} color={ds.colors.feedback.red} />
                    <Text style={styles.errorText}>{error}</Text>
                    {attemptsRemaining !== null && attemptsRemaining > 0 && (
                      <Text style={styles.attemptsText}>
                        {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining
                      </Text>
                    )}
                  </View>
                )}

                {loading && (
                  <ActivityIndicator
                    size="large"
                    color={ds.colors.brand.primary}
                    style={styles.loader}
                  />
                )}

                {biometricAvailable && !loading && (
                  <TouchableOpacity
                    style={styles.biometricSwitchButton}
                    onPress={handleSwitchToBiometric}
                  >
                    <Ionicons 
                      name={biometricType === 'face' ? 'scan' : 'finger-print'} 
                      size={20} 
                      color={ds.colors.brand.primary} 
                    />
                    <Text style={styles.biometricSwitchText}>
                      Use {getBiometricTypeName(biometricType)}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {/* Show warning if approaching lockout */}
                {failedAttempts >= 2 && failedAttempts < 3 && (
                  <View style={styles.warningContainer}>
                    <Ionicons name="warning" size={16} color={ds.colors.feedback.amber} />
                    <Text style={styles.warningText}>
                      {3 - failedAttempts} more failed attempt(s) will lock your account
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Security Notice */}
            <View style={styles.securityNotice}>
              <Ionicons name="shield-checkmark" size={16} color={ds.colors.neutral.textSecondary} />
              <Text style={styles.securityNoticeText}>
                Your authentication is encrypted and secure
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.lg,
    padding: ds.spacing.lg,
    ...ds.shadows.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing.md,
  },
  title: {
    ...ds.typography.textStyles.h2,
    color: ds.colors.neutral.text,
    flex: 1,
  },
  closeButton: {
    padding: ds.spacing.xs,
  },
  message: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.textSecondary,
    marginBottom: ds.spacing.xl,
    textAlign: 'center',
  },
  biometricContainer: {
    alignItems: 'center',
    paddingVertical: ds.spacing.xl,
  },
  biometricIcon: {
    marginBottom: ds.spacing.sm,
  },
  biometricLabel: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.textSecondary,
    marginBottom: ds.spacing.md,
  },
  pinContainer: {
    marginBottom: ds.spacing.md,
  },
  pinLabel: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    textAlign: 'center',
    marginBottom: ds.spacing.md,
  },
  codeFieldRoot: {
    marginBottom: ds.spacing.md,
  },
  cell: {
    width: 48,
    height: 56,
    lineHeight: 48,
    backgroundColor: ds.colors.neutral.backgroundAlt,
    borderWidth: 2,
    borderColor: ds.colors.neutral.border,
    borderRadius: ds.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  focusCell: {
    borderColor: ds.colors.brand.primary,
    backgroundColor: ds.colors.neutral.surface,
  },
  cellText: {
    ...ds.typography.textStyles.h2,
    color: ds.colors.neutral.text,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: ds.spacing.sm,
    gap: ds.spacing.xs,
  },
  errorText: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.feedback.red,
    textAlign: 'center',
  },
  attemptsText: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.feedback.amber,
    textAlign: 'center',
  },
  loader: {
    marginTop: ds.spacing.md,
  },
  retryButton: {
    marginTop: ds.spacing.sm,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    backgroundColor: ds.colors.brand.primary,
    borderRadius: ds.radius.sm,
  },
  retryButtonText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.surface,
    fontWeight: '600',
  },
  fallbackButton: {
    marginTop: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
  },
  fallbackButtonText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.brand.primary,
    textAlign: 'center',
  },
  biometricSwitchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    gap: ds.spacing.xs,
  },
  biometricSwitchText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.brand.primary,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ds.spacing.md,
    paddingTop: ds.spacing.md,
    borderTopWidth: 1,
    borderTopColor: ds.colors.neutral.border,
    gap: ds.spacing.xs,
  },
  securityNoticeText: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ds.spacing.md,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    backgroundColor: ds.colors.feedback.amber100,
    borderRadius: ds.radius.sm,
    gap: ds.spacing.xs,
  },
  warningText: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.feedback.amber,
    flex: 1,
  },
});
