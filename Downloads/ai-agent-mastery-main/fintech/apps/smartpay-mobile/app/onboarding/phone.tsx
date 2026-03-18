/**
 * Onboarding Phone Screen - Smartpay
 * Figma Node: 44:461
 * 
 * Flow: welcome → phone → otp → name → photo → pin → faceid → complete
 * Step 2 of 8
 * 
 * Features:
 * - TextInput with +264 prefix
 * - Inline error handling
 * - Loading state
 * - Test user simulation via EXPO_PUBLIC_TEST_USER_PHONE
 * - API: POST /api/v1/auth/send-otp
 * 
 * Location: mobile/app/onboarding/phone.tsx
 */
import React, { useState } from 'react';
import { Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { OnboardingLayout } from '@/components/layout';
import { TextInput } from '@/components/ui';
import { designSystem } from '@/constants/designSystem';
import { requestOtp } from '@/services/auth';
import { useUser } from '@/contexts/UserContext';
import type { UserProfile } from '@/contexts/UserContext';

const testPhoneLocalPart = ((): string => {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return '';
  const raw = process.env.EXPO_PUBLIC_TEST_USER_PHONE ?? process.env.TEST_USER_PHONE ?? '';
  const digits = raw.replace(/\D/g, '').slice(-8);
  return digits.length >= 8 ? digits : '';
})();

export default function PhoneScreen() {
  const { profile, setProfile } = useUser();
  const [phoneNumber, setPhoneNumber] = useState(() => testPhoneLocalPart);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 7) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fullPhone = `+264${digits}`;
      const result = await requestOtp(fullPhone);

      if (result.success) {
        const next: UserProfile = {
          id: profile?.id ?? 'dev-user-1',
          firstName: profile?.firstName ?? '',
          lastName: profile?.lastName ?? '',
          ...profile,
          phone: fullPhone,
        };
        setProfile(next);

        if (__DEV__ && result.devCode) {
          Alert.alert('Dev Mode', `OTP Code: ${result.devCode}`, [
            { text: 'OK', onPress: () => router.push({ pathname: '/onboarding/otp', params: { phone: fullPhone } }) },
          ]);
        } else {
          router.push({ pathname: '/onboarding/otp', params: { phone: fullPhone } });
        }
      } else {
        setError(result.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={8}
      screenTitle="Tell us your mobile number"
      screenSubtitle="We'll send you a verification code"
      onBack={() => router.back()}
    >
      <TextInput
        prefix="+264"
        prefixIcon="call-outline"
        placeholder="81 234 5678"
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        error={error ?? undefined}
        clearable
        required
      />

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleContinue}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Verify Number"
      >
        <Text style={styles.buttonText}>
          {loading ? 'Sending...' : 'Verify Number'}
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
});
