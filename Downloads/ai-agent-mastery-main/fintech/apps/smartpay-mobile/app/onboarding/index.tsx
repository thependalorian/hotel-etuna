/**
 * Onboarding Welcome Screen - Smartpay
 * Figma Node: 23:1495
 * 
 * Flow: welcome → phone → otp → name → photo → pin → faceid → complete
 * Step 1 of 8
 * 
 * Location: mobile/app/onboarding/index.tsx
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { OnboardingLayout } from '@/components/layout';
import { designSystem } from '@/constants/designSystem';

export default function OnboardingWelcome() {
  return (
    <OnboardingLayout 
      currentStep={1} 
      totalSteps={8}
      scrollable={false}
    >
      <View style={styles.content}>
        <View style={styles.illustration}>
          <Text style={styles.emoji}>💸</Text>
        </View>

        <Text style={styles.title}>Welcome to Smartpay</Text>
        <Text style={styles.description}>
          Your secure digital wallet for sending money, paying bills, and managing your finances.
        </Text>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureText}>Instant Transfers</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🔒</Text>
            <Text style={styles.featureText}>Secure Payments</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📱</Text>
            <Text style={styles.featureText}>Easy to Use</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push('/onboarding/phone')}
          accessibilityRole="button"
          accessibilityLabel="Get Started"
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: designSystem.spacing.smartpay.horizontalPadding,
  },
  illustration: {
    alignItems: 'center',
    marginBottom: designSystem.spacing['2xl'],
  },
  emoji: {
    fontSize: 80,
  },
  title: {
    ...designSystem.typography.textStyles.heading,
    color: designSystem.colors.text,
    textAlign: 'center',
    marginBottom: designSystem.spacing.md,
  },
  description: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.textSecondary,
    textAlign: 'center',
    marginBottom: designSystem.spacing['3xl'],
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: designSystem.spacing['3xl'],
  },
  feature: {
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureText: {
    ...designSystem.typography.textStyles.bodySm,
    color: designSystem.colors.textSecondary,
    fontWeight: '600',
  },
  button: {
    height: designSystem.components?.button?.height ?? 48,
    backgroundColor: designSystem.colors.primary,
    borderRadius: designSystem.components?.button?.borderRadius ?? 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...designSystem.shadows.md,
  },
  buttonText: {
    ...designSystem.typography.textStyles.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
