/**
 * Onboarding Complete Screen - Smartpay
 * Figma Node: 45:818
 * 
 * Flow: welcome → phone → otp → name → photo → pin → faceid → complete
 * Step 8 of 8 (Final)
 * 
 * Features:
 * - Success badge (96×96 checkmark, green, spring animation)
 * - Profile card (avatar + name)
 * - SmartpayID display: "SP-12345678" with copy button
 * - Features list (Send money, Receive payments, Pay with QR)
 * - Copy: "Complete KYC in Profile to activate your wallet"
 * - Primary CTA: "Get Started" → /(tabs)/home
 * 
 * Location: mobile/app/onboarding/complete.tsx
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Animated, Clipboard } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '@/components/layout';
import { designSystem } from '@/constants/designSystem';
import { useUser } from '@/contexts/UserContext';

const ONBOARDING_KEY = 'smartpay_onboarding_complete';

export default function CompleteScreen() {
  const { profile, smartpayId } = useUser();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Figma spec: Spring animation for checkmark (96×96)
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: designSystem.animations.springBounce.bounciness,
      speed: designSystem.animations.springBounce.speed,
    }).start();
  }, []);

  const handleGetStarted = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)/home');
  };

  const handleCopySmartpayId = () => {
    if (displayId && displayId !== '—') {
      Clipboard.setString(displayId);
      // In production, show a Toast notification
    }
  };

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim() || 'User';
  const displayId = smartpayId ?? (profile?.id ? `SP-${String(profile.id).slice(-8).toUpperCase()}` : '—');
  const avatarUri = profile?.photoUri || profile?.avatarUrl;
  const initials = [profile?.firstName?.[0], profile?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  return (
    <OnboardingLayout 
      currentStep={8} 
      totalSteps={8}
      scrollable={false}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Figma: 96×96 checkmark with spring animation */}
        <Animated.View style={[styles.successBadgeContainer, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.successBadge}>
            <Ionicons name="checkmark" size={48} color="#fff" />
          </View>
        </Animated.View>

        {/* Profile card with avatar + name */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {avatarUri && avatarUri !== 'default' ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </View>
          <Text style={styles.userName}>{fullName}</Text>
          
          {/* SmartpayID display: "SP-12345678" with copy button */}
          <View style={styles.smartpayIdBox}>
            <Text style={styles.smartpayIdLabel}>SmartpayID</Text>
            <TouchableOpacity 
              style={styles.smartpayIdValue}
              onPress={handleCopySmartpayId}
              accessibilityRole="button"
              accessibilityLabel="Copy SmartpayID"
            >
              <Text style={styles.smartpayIdText} selectable>{displayId}</Text>
              <Ionicons name="copy-outline" size={20} color={designSystem.colors.brand.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Features list */}
        <View style={styles.features}>
          <Text style={styles.featuresTitle}>You can now</Text>
          <FeatureRow icon="paper-plane-outline" iconColor={designSystem.colors.primary} title="Send money" sub="Instantly to any Smartpay user" />
          <FeatureRow icon="arrow-down-circle-outline" iconColor={designSystem.colors.success} title="Receive payments" sub="Share your SmartpayID or QR code" />
          <FeatureRow icon="qr-code-outline" iconColor={designSystem.colors.brand.primary} title="Pay with QR" sub="Scan NAMQR codes at merchants" />
        </View>

        {/* KYC note */}
        <View style={styles.kycNote}>
          <Ionicons name="information-circle-outline" size={20} color={designSystem.colors.info} />
          <Text style={styles.kycText}>Complete KYC in Profile to activate your wallet</Text>
        </View>

        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={handleGetStarted}
          accessibilityRole="button"
          accessibilityLabel="Get Started"
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
      </ScrollView>
    </OnboardingLayout>
  );
}

function FeatureRow({
  icon,
  iconColor,
  title,
  sub,
}: {
  icon: string;
  iconColor: string;
  title: string;
  sub: string;
}) {
  return (
    <View style={styles.featureRow}>
      <View style={[styles.featureIcon, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureSub}>{sub}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: designSystem.spacing.smartpay.horizontalPadding,
    paddingVertical: designSystem.spacing.lg,
    paddingBottom: designSystem.spacing['2xl'],
    alignItems: 'center',
  },
  successBadgeContainer: {
    alignItems: 'center',
    marginBottom: designSystem.spacing.lg,
  },
  successBadge: {
    width: 96,  // Figma spec: 96×96
    height: 96,
    borderRadius: 48,
    backgroundColor: designSystem.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...designSystem.shadows.lg,
  },
  profileCard: {
    width: '100%',
    backgroundColor: designSystem.colors.background,
    borderRadius: designSystem.radius.xl,
    padding: designSystem.spacing.lg,
    alignItems: 'center',
    marginBottom: designSystem.spacing.lg,
    borderWidth: 1,
    borderColor: designSystem.colors.border,
    ...designSystem.shadows.md,
  },
  avatarWrap: {
    marginBottom: designSystem.spacing.md,
  },
  avatar: {
    width: 80,  // Figma spec: 80×80
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: designSystem.colors.border,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: designSystem.colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  userName: {
    ...designSystem.typography.textStyles.sectionHeader,
    color: designSystem.colors.text,
    marginBottom: designSystem.spacing.md,
  },
  smartpayIdBox: {
    alignItems: 'center',
    width: '100%',
  },
  smartpayIdLabel: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: designSystem.spacing.xs,
  },
  smartpayIdValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designSystem.spacing[2],
    backgroundColor: designSystem.colors.brand50,
    paddingVertical: designSystem.spacing[2],
    paddingHorizontal: designSystem.spacing[4],
    borderRadius: designSystem.radius.md,
    borderWidth: 1,
    borderColor: designSystem.colors.brandLight,
  },
  smartpayIdText: {
    ...designSystem.typography.textStyles.subheading,
    color: designSystem.colors.text,
    fontWeight: '700',
  },
  features: {
    width: '100%',
    backgroundColor: designSystem.colors.surfaceVariant,
    borderRadius: designSystem.radius.lg,
    padding: designSystem.spacing[4],
    gap: designSystem.spacing[3],
    marginBottom: designSystem.spacing[4],
  },
  featuresTitle: {
    ...designSystem.typography.textStyles.caption,
    fontWeight: '600',
    color: designSystem.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: designSystem.spacing[1],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designSystem.spacing[3],
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: designSystem.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: { 
    flex: 1,
  },
  featureTitle: {
    ...designSystem.typography.textStyles.body,
    fontWeight: '600',
    color: designSystem.colors.text,
  },
  featureSub: {
    ...designSystem.typography.textStyles.bodySecondary,
    color: designSystem.colors.textSecondary,
    marginTop: 2,
  },
  kycNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designSystem.spacing[2],
    backgroundColor: designSystem.colors.infoBg,
    padding: designSystem.spacing[3],
    borderRadius: designSystem.radius.md,
    marginBottom: designSystem.spacing.lg,
  },
  kycText: {
    flex: 1,
    ...designSystem.typography.textStyles.bodySecondary,
    color: designSystem.colors.text,
    fontWeight: '500',
  },
  primaryButton: {
    width: '100%',
    height: designSystem.components.button.height.lg,
    backgroundColor: designSystem.colors.primary,
    borderRadius: designSystem.components.button.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    ...designSystem.shadows.md,
  },
  primaryButtonText: {
    ...designSystem.typography.textStyles.button,
    color: '#FFFFFF',
  },
});
