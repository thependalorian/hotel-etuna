/**
 * Onboarding Name Screen - Smartpay
 * Figma Node: 45:712
 * 
 * Flow: welcome → phone → otp → name → photo → pin → faceid → complete
 * Step 4 of 8
 * 
 * Features:
 * - First Name and Last Name inputs
 * - Validation (required fields)
 * - Test user simulation via env vars
 * 
 * Location: mobile/app/onboarding/name.tsx
 */
import React, { useState } from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { OnboardingLayout } from '@/components/layout';
import { TextInput } from '@/components/ui';
import { designSystem } from '@/constants/designSystem';
import { useUser } from '@/contexts/UserContext';
import type { UserProfile } from '@/contexts/UserContext';

const testName = ((): { firstName: string; lastName: string } => {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return { firstName: '', lastName: '' };
  const first = process.env.EXPO_PUBLIC_TEST_USER_FIRST_NAME ?? '';
  const last = process.env.EXPO_PUBLIC_TEST_USER_LAST_NAME ?? '';
  return { firstName: first.trim(), lastName: last.trim() };
})();

export default function NameScreen() {
  const { profile, setProfile } = useUser();
  const [firstName, setFirstName] = useState(() => testName.firstName);
  const [lastName, setLastName] = useState(() => testName.lastName);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});

  const handleContinue = async () => {
    const newErrors: { firstName?: string; lastName?: string } = {};
    
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const next: UserProfile = {
      ...(profile ?? {}),
      id: profile?.id ?? 'dev-user-1',
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    };
    setProfile(next);
    router.push('/onboarding/photo');
  };

  return (
    <OnboardingLayout
      currentStep={4}
      totalSteps={8}
      screenTitle="Add user's details"
      screenSubtitle="This will appear on your Smartpay account"
      onBack={() => router.back()}
    >
      <TextInput
        label="First Name"
        placeholder="John"
        value={firstName}
        onChangeText={setFirstName}
        error={errors.firstName}
        clearable
        required
      />

      <TextInput
        label="Last Name"
        placeholder="Doe"
        value={lastName}
        onChangeText={setLastName}
        error={errors.lastName}
        clearable
        required
      />

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleContinue}
        accessibilityRole="button"
        accessibilityLabel="Continue"
      >
        <Text style={styles.buttonText}>Continue</Text>
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
  buttonText: {
    ...designSystem.typography.textStyles.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
