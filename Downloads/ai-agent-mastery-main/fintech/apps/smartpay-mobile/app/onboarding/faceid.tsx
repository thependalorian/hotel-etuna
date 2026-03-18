/**
 * Onboarding Face ID/Biometric Screen - Smartpay
 * Figma Node: 45:681
 * 
 * Flow: welcome → phone → otp → name → photo → pin → faceid → complete
 * Step 7 of 8
 * 
 * Features:
 * - Biometric icon (Face ID/Fingerprint per device)
 * - Primary CTA: "Enable"
 * - Secondary: "Skip"
 * - Test LocalAuthentication.authenticateAsync()
 * - Optional step
 * 
 * Location: mobile/app/onboarding/faceid.tsx
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '@/components/layout';
import { designSystem } from '@/constants/designSystem';

type BiometricType = 'faceid' | 'fingerprint' | 'none';

export default function OnboardingFaceIdScreen() {
  const [biometricType, setBiometricType] = useState<BiometricType>('none');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        setIsEnrolled(enrolled);
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('faceid');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('fingerprint');
        } else {
          setBiometricType('none');
        }
      } catch {
        setBiometricType('none');
      }
    })();
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage:
          biometricType === 'faceid'
            ? 'Set up Face ID for SmartPay'
            : 'Set up Fingerprint for SmartPay',
        disableDeviceFallback: false,
      });
      if (result.success) {
        router.push('/onboarding/complete');
      }
    } catch {
      // User cancelled or error – still allow to continue
      router.push('/onboarding/complete');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/onboarding/complete');
  };

  const label = biometricType === 'faceid' ? 'Face ID' : biometricType === 'fingerprint' ? 'Fingerprint' : 'Biometric';
  const iconName = biometricType === 'faceid' ? 'scan-outline' : biometricType === 'fingerprint' ? 'finger-print-outline' : 'lock-closed-outline';

  return (
    <OnboardingLayout
      currentStep={7}
      totalSteps={8}
      screenTitle="Enable Authentication"
      screenSubtitle={`Use ${label} to quickly and securely access your Smartpay account and confirm transactions`}
      onBack={() => router.back()}
      showSkip
      onSkip={handleSkip}
    >
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name={iconName as any} size={48} color={designSystem.colors.primary} />
        </View>
      </View>
      <View style={styles.benefits}>
        <BenefitRow text="Quick access to your account" />
        <BenefitRow text="Secure transactions" />
        <BenefitRow text="Unlock app without entering PIN" />
      </View>
      {biometricType !== 'none' && isEnrolled ? (
        <>
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleEnable}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={`Enable ${label}`}
          >
            <Text style={styles.primaryButtonText}>Enable</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.skipButton} 
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel="Skip for now"
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.unavailableText}>
            {!isEnrolled
              ? `${label} is not set up on this device. Set it up in your device settings, or skip.`
              : 'Biometric authentication is not available on this device.'}
          </Text>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel="Continue"
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        </>
      )}
    </OnboardingLayout>
  );
}

function BenefitRow({ text }: { text: string }) {
  return (
    <View style={styles.benefitRow}>
      <Ionicons name="checkmark-circle" size={20} color={designSystem.colors.success} />
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    marginVertical: designSystem.spacing.xl ?? 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: (designSystem.colors.primary ?? '#2563eb') + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefits: {
    backgroundColor: designSystem.colors.surfaceVariant,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: designSystem.spacing.xl ?? 24,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    ...designSystem.typography.textStyles?.body,
    color: designSystem.colors.text,
  },
  primaryButton: {
    height: designSystem.components?.button?.height ?? 56,
    backgroundColor: designSystem.colors.primary,
    borderRadius: designSystem.components?.button?.borderRadius ?? 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...designSystem.shadows?.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    ...designSystem.typography.textStyles?.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  skipButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: designSystem.spacing.md ?? 16,
  },
  skipButtonText: {
    ...designSystem.typography.textStyles?.body,
    color: designSystem.colors.textSecondary,
    fontWeight: '600',
  },
  unavailableText: {
    ...designSystem.typography.textStyles?.body,
    color: designSystem.colors.textSecondary,
    textAlign: 'center',
    marginBottom: designSystem.spacing.lg ?? 20,
  },
});
