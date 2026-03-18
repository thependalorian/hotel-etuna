/**
 * OnboardingLayout - Smartpay Copilot
 * 
 * Onboarding screen wrapper with:
 * - Progress indicator (dots)
 * - Back button
 * - Skip button (optional)
 * - Gradient background
 * - Keyboard avoidance
 * 
 * Props:
 * - currentStep: Current step number (1-indexed)
 * - totalSteps: Total number of steps
 * - children: Screen content
 * - onBack: Back button callback
 * - onSkip: Skip button callback (optional)
 * - showSkip: Show skip button
 * 
 * Location: components/layout/OnboardingLayout.tsx
 */
import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { designSystem as DS } from '@/constants/designSystem';

interface OnboardingLayoutProps {
  currentStep: number;
  totalSteps: number;
  children: ReactNode;
  onBack?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  screenTitle?: string;
  screenSubtitle?: string;
  scrollable?: boolean;
}

export function OnboardingLayout({
  currentStep,
  totalSteps,
  children,
  onBack,
  onSkip,
  showSkip = false,
  screenTitle,
  screenSubtitle,
  scrollable = true,
}: OnboardingLayoutProps) {
  return (
    <LinearGradient
      colors={DS.colors.backgroundGradient?.onboarding?.colors ?? ['#005D6E', '#004552']}
      locations={DS.colors.backgroundGradient?.onboarding?.locations ?? [0, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.topBar}>
            {onBack ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                accessibilityLabel="Go back"
                accessibilityRole="button"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-back" size={24} color={DS.colors.background} />
              </TouchableOpacity>
            ) : (
              <View style={styles.backButtonPlaceholder} />
            )}
            
            <View style={styles.progressContainer}>
              {Array.from({ length: totalSteps }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index + 1 === currentStep && styles.progressDotActive,
                    index + 1 < currentStep && styles.progressDotCompleted,
                  ]}
                />
              ))}
            </View>
            
            {showSkip && onSkip ? (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={onSkip}
                accessibilityLabel="Skip"
                accessibilityRole="button"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.skipButtonPlaceholder} />
            )}
          </View>

          <View style={styles.contentContainer}>
            {screenTitle && (
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{screenTitle}</Text>
                {screenSubtitle && (
                  <Text style={styles.subtitle}>{screenSubtitle}</Text>
                )}
              </View>
            )}

            {scrollable ? (
              <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>
            ) : (
              <View style={styles.content}>{children}</View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DS.spacing[4],
    paddingVertical: DS.spacing[4],
    minHeight: DS.components.header.height,
  },
  backButton: {
    width: DS.components.header.iconSize,
    height: DS.components.header.iconSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonPlaceholder: {
    width: DS.components.header.iconSize,
    height: DS.components.header.iconSize,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing[2],
    flex: 1,
    justifyContent: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    width: 24,
    backgroundColor: DS.colors.background,
  },
  progressDotCompleted: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  skipButton: {
    paddingHorizontal: DS.spacing[3],
    paddingVertical: DS.spacing[2],
  },
  skipButtonPlaceholder: {
    width: DS.components.header.iconSize,
    height: DS.components.header.iconSize,
  },
  skipText: {
    fontSize: DS.typography.fontSize.sm,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.background,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: DS.colors.surface,
    borderTopLeftRadius: DS.borderRadius.xl,
    borderTopRightRadius: DS.borderRadius.xl,
    overflow: 'hidden',
  },
  titleContainer: {
    paddingHorizontal: DS.spacing.smartpay.horizontalPadding,
    paddingTop: DS.spacing.xl,
    paddingBottom: DS.spacing.lg,
  },
  title: {
    ...DS.typography.textStyles.titleLg,
    color: DS.colors.text,
    marginBottom: DS.spacing.xs,
  },
  subtitle: {
    ...DS.typography.textStyles.body,
    color: DS.colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DS.spacing.smartpay.horizontalPadding,
    paddingBottom: DS.spacing['2xl'],
  },
  content: {
    flex: 1,
    paddingHorizontal: DS.spacing.smartpay.horizontalPadding,
    paddingBottom: DS.spacing['2xl'],
  },
});
