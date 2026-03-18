/**
 * Onboarding OTP Screen - Smartpay
 * Figma Node: 44:509
 * 
 * Flow: welcome → phone → otp → name → photo → pin → faceid → complete
 * Step 3 of 8
 * 
 * Features:
 * - 6-digit OTP input
 * - Resend code with 60s countdown
 * - Error handling (Toast for 401)
 * - Test OTP: 123456 (dev mode)
 * - API: POST /api/v1/auth/verify-otp
 * 
 * Location: mobile/app/onboarding/otp.tsx
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { OnboardingLayout } from '@/components/layout';
import { TextInput } from '@/components/ui';
import { designSystem } from '@/constants/designSystem';
import { verifyOtp, requestOtp, getDevPrefillOtp } from '@/services/auth';
import { useUser } from '@/contexts/UserContext';

export default function OTPScreen() {
  const { phone, signin } = useLocalSearchParams<{ phone: string; signin?: string }>();
  const { setSmartpayId } = useUser();
  const [code, setCode] = useState(() =>
    phone ? (getDevPrefillOtp(phone) ?? '') : ''
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await verifyOtp(phone as string, code);

      if (result.success) {
        if (result.smartpayId) {
          await setSmartpayId(result.smartpayId);
        }
        if (signin === '1') {
          router.replace('/(authenticated)/(tabs)');
        } else {
          router.push('/onboarding/name');
        }
      } else {
        setError(result.error || 'Invalid code');
        if (result.attemptsRemaining === 0) {
          Alert.alert('Too Many Attempts', 'Please request a new code.', [
            { text: 'OK', onPress: () => router.replace('/onboarding/phone') }
          ]);
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;

    try {
      const result = await requestOtp(phone as string);
      if (result.success) {
        setResendCountdown(60);
        if (__DEV__ && result.devCode) {
          Alert.alert('Dev Mode', `OTP Code: ${result.devCode}`);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to resend code');
    }
  };

  return (
    <OnboardingLayout
      currentStep={3}
      totalSteps={8}
      screenTitle="Can you please verify"
      screenSubtitle={`Code sent to ${phone}`}
      onBack={() => router.back()}
    >
      <TextInput
        placeholder="000000"
        keyboardType="number-pad"
        value={code}
        onChangeText={setCode}
        error={error ?? undefined}
        maxLength={6}
        clearable
        required
      />

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleVerify}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Verify OTP"
      >
        <Text style={styles.buttonText}>
          {loading ? 'Verifying...' : 'Verify OTP'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.resendButton, resendCountdown > 0 && styles.resendButtonDisabled]}
        onPress={handleResend}
        disabled={resendCountdown > 0}
        accessibilityRole="button"
        accessibilityLabel={resendCountdown > 0 ? `Resend in ${resendCountdown} seconds` : 'Resend code'}
      >
        <Text style={[styles.resendText, resendCountdown > 0 && styles.resendTextDisabled]}>
          {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend code'}
        </Text>
      </TouchableOpacity>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  button: {
    height: designSystem.components?.button?.height ?? 48,
    backgroundColor: designSystem.colors.primary,
    borderRadius: designSystem.components?.button?.borderRadius ?? 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: designSystem.spacing.lg,
    ...designSystem.shadows.md,
  },
  buttonDisabled: {
    backgroundColor: designSystem.colors.textTertiary,
  },
  buttonText: {
    ...designSystem.typography.textStyles.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  resendButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: designSystem.spacing.md,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.primary,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: designSystem.colors.textSecondary,
  },
});
