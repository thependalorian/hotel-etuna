/**
 * OnboardingFlow Component
 * 
 * Location: components/onboarding/OnboardingFlow.tsx
 * Purpose: Multi-step onboarding flow for new users
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';

interface OnboardingFlowProps {
  onComplete?: () => void;
}

const onboardingSteps = [
  {
    title: 'Welcome to Buffr',
    description: 'Your digital wallet for seamless payments',
    icon: 'credit-card',
  },
  {
    title: 'Send & Receive',
    description: 'Transfer money instantly to friends and family',
    icon: 'exchange',
  },
  {
    title: 'Manage Your Money',
    description: 'Track expenses and manage multiple wallets',
    icon: 'pie-chart',
  },
];

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handleSkip = () => {
    onComplete?.();
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <View style={styles.stepContent}>
          <FontAwesome name={currentStepData.icon as any} size={80} color={Colors.primary} />
          <Text style={styles.stepTitle}>{currentStepData.title}</Text>
          <Text style={styles.stepDescription}>{currentStepData.description}</Text>
        </View>

        <View style={styles.indicators}>
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentStep && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={defaultStyles.pillButton} onPress={handleNext}>
          <Text style={defaultStyles.buttonText}>
            {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
  stepContent: {
    alignItems: 'center',
    gap: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  indicators: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 40,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  indicatorActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
});
