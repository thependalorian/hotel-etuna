/**
 * Onboarding Photo Screen - Smartpay
 * Figma: NEW from PRD (optional step)
 * 
 * Flow: welcome → phone → otp → name → photo → pin → faceid → complete
 * Step 5 of 8
 * 
 * Features:
 * - Avatar placeholder (80×80px per Figma)
 * - Options: "Take Photo", "Choose from Library", "Skip"
 * - Image cropping UI (1:1 ratio) - simulated
 * - Optional step
 * 
 * Location: mobile/app/onboarding/photo.tsx
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '@/components/layout';
import { designSystem } from '@/constants/designSystem';
import { useUser } from '@/contexts/UserContext';
import type { UserProfile } from '@/contexts/UserContext';

/** Simulated: set a flag so Profile/Edit profile can show a placeholder or initials. */
const PLACEHOLDER_AVATAR_URI = 'default';

export default function OnboardingPhotoScreen() {
  const { profile, setProfile } = useUser();

  const handleSkip = () => {
    router.push('/onboarding/pin');
  };

  const handleTakePhoto = () => {
    // Simulated: In production, use expo-image-picker with camera
    const next: UserProfile = {
      ...(profile ?? {}),
      id: profile?.id ?? 'dev-user-1',
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      avatarUrl: PLACEHOLDER_AVATAR_URI,
      photoUri: PLACEHOLDER_AVATAR_URI,
    };
    setProfile(next);
    router.push('/onboarding/pin');
  };

  const handleChooseLibrary = () => {
    // Simulated: In production, use expo-image-picker with library
    const next: UserProfile = {
      ...(profile ?? {}),
      id: profile?.id ?? 'dev-user-1',
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      avatarUrl: PLACEHOLDER_AVATAR_URI,
      photoUri: PLACEHOLDER_AVATAR_URI,
    };
    setProfile(next);
    router.push('/onboarding/pin');
  };

  const initials = [profile?.firstName?.[0], profile?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  return (
    <OnboardingLayout
      currentStep={5}
      totalSteps={8}
      screenTitle="Add your photo"
      screenSubtitle="Your photo helps contacts recognise you. You can change it later."
      onBack={() => router.back()}
      showSkip
      onSkip={handleSkip}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatarCircle}>
          <Text style={styles.initials}>{initials}</Text>
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.primaryButton} 
        onPress={handleTakePhoto}
        accessibilityRole="button"
        accessibilityLabel="Take Photo"
      >
        <Ionicons name="camera-outline" size={20} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.primaryButtonText}>Take Photo</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.secondaryButton} 
        onPress={handleChooseLibrary}
        accessibilityRole="button"
        accessibilityLabel="Choose from Library"
      >
        <Ionicons name="images-outline" size={20} color={designSystem.colors.primary} style={styles.buttonIcon} />
        <Text style={styles.secondaryButtonText}>Choose from Library</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.skipButton} 
        onPress={handleSkip}
        accessibilityRole="button"
        accessibilityLabel="Skip for now"
      >
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: 'center',
    marginVertical: designSystem.spacing['2xl'] ?? 24,
  },
  avatarCircle: {
    width: 80,  // Figma spec: 80×80
    height: 80,
    borderRadius: 40,
    backgroundColor: designSystem.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: designSystem.colors.primary,
  },
  initials: {
    fontSize: 28,
    color: designSystem.colors.primary,
    fontWeight: '700',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: designSystem.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: designSystem.colors.surface,
  },
  primaryButton: {
    height: designSystem.components?.button?.height ?? 56,
    backgroundColor: designSystem.colors.primary,
    borderRadius: designSystem.components?.button?.borderRadius ?? 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: designSystem.spacing.lg,
    ...designSystem.shadows?.md,
  },
  secondaryButton: {
    height: designSystem.components?.button?.heightMd ?? 48,
    backgroundColor: designSystem.colors.background,
    borderRadius: designSystem.components?.button?.borderRadius ?? 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: designSystem.spacing.md,
    borderWidth: 1,
    borderColor: designSystem.colors.border,
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    ...designSystem.typography.textStyles?.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButtonText: {
    ...designSystem.typography.textStyles?.body,
    color: designSystem.colors.primary,
    fontWeight: '600',
  },
  skipButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: designSystem.spacing.md,
  },
  skipButtonText: {
    ...designSystem.typography.textStyles?.body,
    color: designSystem.colors.textSecondary,
    fontWeight: '600',
  },
});
