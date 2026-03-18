/**
 * Proof of Life Intro Screen - Smartpay
 * 
 * Service tile in grid routes here
 * - Explainer: Quarterly verification requirement
 * - Next verification date
 * - "Verify Now" CTA
 * - "Learn More" link
 * 
 * Pattern: buffr-g2p service intro + PRD §4.4.8
 * Location: app/(authenticated)/proof-of-life/intro.tsx
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { designSystem as ds } from '@/constants/designSystem';
import { useUser } from '@/contexts/UserContext';
import { fetchProfile, type UserProfileFromApi } from '@/services/profile';

type ProofOfLifeStatus = 'current' | 'due_soon' | 'required' | 'overdue';

export default function ProofOfLifeIntroScreen() {
  const router = useRouter();
  const { profile } = useUser();
  const [fullProfile, setFullProfile] = useState<UserProfileFromApi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchProfile()
      .then((data) => {
        if (!cancelled && data) {
          setFullProfile(data);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const pol = fullProfile?.proofOfLife;
  const status: ProofOfLifeStatus = pol?.status ?? 'current';
  const daysUntilRequired = pol?.daysUntilRequired ?? 0;
  const lastVerified = pol?.lastVerified;
  const requiredBy = pol?.requiredBy;

  const getStatusInfo = () => {
    switch (status) {
      case 'overdue':
        return {
          color: ds.colors.semantic.error,
          icon: 'alert-circle' as const,
          title: 'Verification Overdue',
          message: 'Your proof of life verification is overdue. Please verify now to continue using Smartpay.',
          ctaText: 'Verify Now',
          urgent: true,
        };
      case 'required':
        return {
          color: ds.colors.warning,
          icon: 'warning' as const,
          title: 'Verification Required',
          message: 'Your quarterly proof of life verification is required.',
          ctaText: 'Verify Now',
          urgent: true,
        };
      case 'due_soon':
        return {
          color: ds.colors.warning,
          icon: 'time' as const,
          title: 'Verification Due Soon',
          message: `Your next verification is due in ${daysUntilRequired} days.`,
          ctaText: 'Verify Now',
          urgent: false,
        };
      default:
        return {
          color: ds.colors.semantic.success,
          icon: 'checkmark-circle' as const,
          title: 'Verification Current',
          message: 'Your proof of life verification is up to date.',
          ctaText: 'Verify Again',
          urgent: false,
        };
    }
  };

  const handleVerifyNow = () => {
    router.push('/(authenticated)/(tabs)/copilot');
  };

  const handleLearnMore = () => {
    router.push('/(authenticated)/proof-of-life/learn-more' as any);
  };

  const statusInfo = getStatusInfo();

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={24} color={ds.colors.neutral.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Proof of Life</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={ds.colors.brand.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* AppHeader */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={ds.colors.neutral.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Proof of Life</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={[styles.statusCard, statusInfo.urgent && styles.statusCardUrgent]}>
          <View style={[styles.statusIconWrap, { backgroundColor: statusInfo.color + '20' }]}>
            <Ionicons name={statusInfo.icon} size={48} color={statusInfo.color} />
          </View>
          <Text style={styles.statusTitle}>{statusInfo.title}</Text>
          <Text style={styles.statusMessage}>{statusInfo.message}</Text>
        </View>

        {/* Verification Dates */}
        <View style={styles.datesCard}>
          {lastVerified && (
            <View style={styles.dateItem}>
              <Ionicons name="checkmark-circle-outline" size={24} color={ds.colors.semantic.success} />
              <View style={styles.dateTextWrap}>
                <Text style={styles.dateLabel}>Last Verified</Text>
                <Text style={styles.dateValue}>{new Date(lastVerified).toLocaleDateString()}</Text>
              </View>
            </View>
          )}
          {requiredBy && (
            <View style={styles.dateItem}>
              <Ionicons name="calendar-outline" size={24} color={ds.colors.brand.primary} />
              <View style={styles.dateTextWrap}>
                <Text style={styles.dateLabel}>Next Verification</Text>
                <Text style={styles.dateValue}>{new Date(requiredBy).toLocaleDateString()}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Explainer Section */}
        <View style={styles.explainerCard}>
          <Text style={styles.explainerTitle}>What is Proof of Life?</Text>
          <Text style={styles.explainerText}>
            Proof of Life is a quarterly verification process required by Namibian financial regulations. 
            It ensures account security and prevents fraud by confirming that you are the legitimate account holder.
          </Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.explainerSubtitle}>How it works</Text>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Open the Copilot tab and say "I want to verify proof of life"</Text>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Follow the AI assistant's instructions for verification</Text>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Complete the verification process (takes about 2 minutes)</Text>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqCard}>
          <Text style={styles.faqTitle}>Common Questions</Text>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How often do I need to verify?</Text>
            <Text style={styles.faqAnswer}>Once every 90 days (quarterly)</Text>
          </View>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What happens if I miss the deadline?</Text>
            <Text style={styles.faqAnswer}>
              Your account will be temporarily restricted until you complete verification.
            </Text>
          </View>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Is my data secure?</Text>
            <Text style={styles.faqAnswer}>
              Yes. All verification data is encrypted and complies with Namibian privacy laws.
            </Text>
          </View>
        </View>

        {/* Primary CTA: Verify Now */}
        <TouchableOpacity
          style={[styles.verifyBtn, statusInfo.urgent && styles.verifyBtnUrgent]}
          onPress={handleVerifyNow}
          accessibilityLabel={statusInfo.ctaText}
        >
          <Text style={styles.verifyBtnText}>{statusInfo.ctaText}</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Learn More Link */}
        <TouchableOpacity
          style={styles.learnMoreBtn}
          onPress={handleLearnMore}
          accessibilityLabel="Learn more"
        >
          <Text style={styles.learnMoreText}>Learn More About Proof of Life</Text>
          <Ionicons name="information-circle-outline" size={20} color={ds.colors.brand.primary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ds.colors.neutral.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    backgroundColor: ds.colors.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral.border,
  },
  backBtn: { padding: ds.spacing.sm },
  headerTitle: { ...ds.typography.textStyles.h2, color: ds.colors.neutral.text },
  headerRight: { width: 40 },
  scroll: { flex: 1 },
  container: { padding: ds.spacing.md, paddingBottom: ds.spacing.xxl },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Status Card
  statusCard: {
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.lg,
    padding: ds.spacing.xl,
    marginBottom: ds.spacing.lg,
    alignItems: 'center',
    ...ds.shadows.md,
  },
  statusCardUrgent: {
    borderWidth: 2,
    borderColor: ds.colors.semantic.error,
  },
  statusIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ds.spacing.md,
  },
  statusTitle: {
    ...ds.typography.textStyles.h3,
    color: ds.colors.neutral.text,
    marginBottom: ds.spacing.sm,
    textAlign: 'center',
  },
  statusMessage: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.textSecondary,
    textAlign: 'center',
  },
  
  // Dates Card
  datesCard: {
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.lg,
    padding: ds.spacing.lg,
    marginBottom: ds.spacing.lg,
    ...ds.shadows.sm,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ds.spacing.md,
    gap: ds.spacing.md,
  },
  dateTextWrap: {
    flex: 1,
  },
  dateLabel: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.textSecondary,
    marginBottom: 2,
  },
  dateValue: {
    ...ds.typography.textStyles.body,
    fontWeight: '600',
    color: ds.colors.neutral.text,
  },
  
  // Explainer Card
  explainerCard: {
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.lg,
    padding: ds.spacing.lg,
    marginBottom: ds.spacing.lg,
    ...ds.shadows.sm,
  },
  explainerTitle: {
    ...ds.typography.textStyles.body,
    fontWeight: '600',
    color: ds.colors.neutral.text,
    marginBottom: ds.spacing.sm,
  },
  explainerText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.textSecondary,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: ds.colors.neutral.border,
    marginVertical: ds.spacing.lg,
  },
  explainerSubtitle: {
    ...ds.typography.textStyles.bodySmall,
    fontWeight: '600',
    color: ds.colors.neutral.text,
    marginBottom: ds.spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: ds.spacing.md,
    gap: ds.spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ds.colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    ...ds.typography.textStyles.caption,
    fontWeight: '700',
    color: '#fff',
  },
  stepText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    flex: 1,
    lineHeight: 24,
  },
  
  // FAQ Card
  faqCard: {
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.lg,
    padding: ds.spacing.lg,
    marginBottom: ds.spacing.xl,
    ...ds.shadows.sm,
  },
  faqTitle: {
    ...ds.typography.textStyles.body,
    fontWeight: '600',
    color: ds.colors.neutral.text,
    marginBottom: ds.spacing.md,
  },
  faqItem: {
    marginBottom: ds.spacing.md,
  },
  faqQuestion: {
    ...ds.typography.textStyles.bodySmall,
    fontWeight: '600',
    color: ds.colors.neutral.text,
    marginBottom: ds.spacing.xs,
  },
  faqAnswer: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.textSecondary,
    lineHeight: 20,
  },
  
  // Verify Button (Primary CTA - 56px)
  verifyBtn: {
    flexDirection: 'row',
    backgroundColor: ds.colors.brand.primary,
    borderRadius: ds.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    gap: ds.spacing.sm,
    marginBottom: ds.spacing.md,
  },
  verifyBtnUrgent: {
    backgroundColor: ds.colors.semantic.error,
  },
  verifyBtnText: {
    ...ds.typography.textStyles.button,
    color: '#fff',
  },
  
  // Learn More Link
  learnMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ds.spacing.md,
    gap: ds.spacing.xs,
  },
  learnMoreText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.brand.primary,
    fontWeight: '500',
  },
});
