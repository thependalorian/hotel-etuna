/**
 * KYC Intro Screen - Smartpay
 * 
 * Explainer screen for KYC verification:
 * - Current tier display (Basic/Standard/Premium)
 * - Target tier benefits
 * - Requirements list
 * - Primary CTA: "Start Verification"
 * 
 * KYC Tiers (PRD §4.7):
 * - Basic: N$5,000 max balance, N$500 per tx (no KYC required)
 * - Standard: N$25,000 max, N$5,000 per tx (ID + selfie)
 * - Premium: N$50,000 max, N$25,000 per tx (Full KYC)
 * 
 * Location: app/(authenticated)/kyc/intro.tsx
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

type KycTier = 'basic' | 'standard' | 'premium';

type TierInfo = {
  name: string;
  color: string;
  maxBalance: string;
  maxTransaction: string;
  dailyLimit: string;
  monthlyLimit: string;
  requirements: string[];
};

const TIER_INFO: Record<KycTier, TierInfo> = {
  basic: {
    name: 'Basic',
    color: ds.colors.neutral.textSecondary,
    maxBalance: 'N$ 5,000',
    maxTransaction: 'N$ 500',
    dailyLimit: 'N$ 1,000',
    monthlyLimit: 'N$ 5,000',
    requirements: ['Phone number verification', 'Basic profile information'],
  },
  standard: {
    name: 'Standard',
    color: ds.colors.brand.primary,
    maxBalance: 'N$ 25,000',
    maxTransaction: 'N$ 5,000',
    dailyLimit: 'N$ 10,000',
    monthlyLimit: 'N$ 25,000',
    requirements: [
      'Valid Namibian ID or Passport',
      'Selfie verification',
      'Proof of address',
    ],
  },
  premium: {
    name: 'Premium',
    color: '#FFB800',
    maxBalance: 'N$ 50,000',
    maxTransaction: 'N$ 25,000',
    dailyLimit: 'N$ 50,000',
    monthlyLimit: 'N$ 100,000',
    requirements: [
      'All Standard tier requirements',
      'Proof of income',
      'Enhanced background verification',
      'In-person verification (optional)',
    ],
  },
};

export default function KycIntroScreen() {
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

  const getCurrentTier = (): KycTier => {
    const tier = (fullProfile?.kycTier || profile?.status || 'basic').toLowerCase();
    if (tier === 'premium') return 'premium';
    if (tier === 'standard') return 'standard';
    return 'basic';
  };

  const getNextTier = (current: KycTier): KycTier | null => {
    if (current === 'basic') return 'standard';
    if (current === 'standard') return 'premium';
    return null;
  };

  const currentTier = getCurrentTier();
  const nextTier = getNextTier(currentTier);
  const currentInfo = TIER_INFO[currentTier];
  const nextInfo = nextTier ? TIER_INFO[nextTier] : null;

  const handleStartVerification = () => {
    if (nextTier) {
      router.push('/(authenticated)/kyc');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={24} color={ds.colors.neutral.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>KYC Verification</Text>
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
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Current Tier Display */}
        <View style={styles.currentTierCard}>
          <View style={styles.tierHeader}>
            <Ionicons name="shield-checkmark" size={32} color={currentInfo.color} />
            <View style={styles.tierHeaderText}>
              <Text style={styles.tierLabel}>Current Tier</Text>
              <View style={[styles.tierBadge, { backgroundColor: currentInfo.color }]}>
                <Text style={styles.tierBadgeText}>{currentInfo.name}</Text>
              </View>
            </View>
          </View>

          <View style={styles.limitsGrid}>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>Max Balance</Text>
              <Text style={styles.limitValue}>{currentInfo.maxBalance}</Text>
            </View>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>Per Transaction</Text>
              <Text style={styles.limitValue}>{currentInfo.maxTransaction}</Text>
            </View>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>Daily Limit</Text>
              <Text style={styles.limitValue}>{currentInfo.dailyLimit}</Text>
            </View>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>Monthly Limit</Text>
              <Text style={styles.limitValue}>{currentInfo.monthlyLimit}</Text>
            </View>
          </View>
        </View>

        {/* Upgrade Section */}
        {nextInfo && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upgrade to {nextInfo.name}</Text>
              <Text style={styles.sectionSubtitle}>Unlock higher limits and more features</Text>
            </View>

            {/* Target Tier Benefits */}
            <View style={styles.benefitsCard}>
              <Text style={styles.benefitsTitle}>Benefits</Text>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={ds.colors.semantic.success} />
                <Text style={styles.benefitText}>Max balance: {nextInfo.maxBalance}</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={ds.colors.semantic.success} />
                <Text style={styles.benefitText}>Per transaction: {nextInfo.maxTransaction}</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={ds.colors.semantic.success} />
                <Text style={styles.benefitText}>Daily limit: {nextInfo.dailyLimit}</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={ds.colors.semantic.success} />
                <Text style={styles.benefitText}>Monthly limit: {nextInfo.monthlyLimit}</Text>
              </View>
            </View>

            {/* Requirements List */}
            <View style={styles.requirementsCard}>
              <Text style={styles.requirementsTitle}>Requirements</Text>
              {nextInfo.requirements.map((req, idx) => (
                <View key={idx} style={styles.requirementItem}>
                  <View style={styles.requirementBullet}>
                    <Text style={styles.requirementBulletText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.requirementText}>{req}</Text>
                </View>
              ))}
            </View>

            {/* Primary CTA */}
            <TouchableOpacity
              style={styles.startBtn}
              onPress={handleStartVerification}
              accessibilityLabel="Start verification"
            >
              <Text style={styles.startBtnText}>Start Verification</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </>
        )}

        {/* Already at max tier */}
        {!nextInfo && (
          <View style={styles.maxTierCard}>
            <Ionicons name="trophy" size={48} color="#FFB800" />
            <Text style={styles.maxTierTitle}>You're at the highest tier!</Text>
            <Text style={styles.maxTierSubtitle}>
              Enjoy unlimited access to all Smartpay features.
            </Text>
          </View>
        )}
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
  
  // Current Tier Card
  currentTierCard: {
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.lg,
    padding: ds.spacing.lg,
    marginBottom: ds.spacing.xl,
    ...ds.shadows.md,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ds.spacing.lg,
    gap: ds.spacing.md,
  },
  tierHeaderText: {
    flex: 1,
  },
  tierLabel: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.textSecondary,
    marginBottom: ds.spacing.xs,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: ds.spacing.md,
    paddingVertical: 6,
    borderRadius: ds.radius.sm,
  },
  tierBadgeText: {
    ...ds.typography.textStyles.body,
    fontWeight: '700',
    color: '#fff',
  },
  
  // Limits Grid
  limitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.spacing.md,
  },
  limitItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: ds.colors.neutral.muted,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
  },
  limitLabel: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
    marginBottom: ds.spacing.xs,
  },
  limitValue: {
    ...ds.typography.textStyles.body,
    fontWeight: '600',
    color: ds.colors.neutral.text,
  },
  
  // Section Header
  sectionHeader: {
    marginBottom: ds.spacing.lg,
  },
  sectionTitle: {
    ...ds.typography.textStyles.h3,
    color: ds.colors.neutral.text,
    marginBottom: ds.spacing.xs,
  },
  sectionSubtitle: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.textSecondary,
  },
  
  // Benefits Card
  benefitsCard: {
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.lg,
    padding: ds.spacing.lg,
    marginBottom: ds.spacing.lg,
    ...ds.shadows.sm,
  },
  benefitsTitle: {
    ...ds.typography.textStyles.body,
    fontWeight: '600',
    color: ds.colors.neutral.text,
    marginBottom: ds.spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ds.spacing.sm,
    gap: ds.spacing.sm,
  },
  benefitText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
  },
  
  // Requirements Card
  requirementsCard: {
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.lg,
    padding: ds.spacing.lg,
    marginBottom: ds.spacing.xl,
    ...ds.shadows.sm,
  },
  requirementsTitle: {
    ...ds.typography.textStyles.body,
    fontWeight: '600',
    color: ds.colors.neutral.text,
    marginBottom: ds.spacing.md,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: ds.spacing.md,
    gap: ds.spacing.sm,
  },
  requirementBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ds.colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requirementBulletText: {
    ...ds.typography.textStyles.caption,
    fontWeight: '700',
    color: '#fff',
  },
  requirementText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    flex: 1,
  },
  
  // Start Button (Primary CTA - 56px)
  startBtn: {
    flexDirection: 'row',
    backgroundColor: ds.colors.brand.primary,
    borderRadius: ds.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    gap: ds.spacing.sm,
  },
  startBtnText: {
    ...ds.typography.textStyles.button,
    color: '#fff',
  },
  
  // Max Tier Card
  maxTierCard: {
    alignItems: 'center',
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.lg,
    padding: ds.spacing.xxl,
    marginTop: ds.spacing.xl,
    ...ds.shadows.sm,
  },
  maxTierTitle: {
    ...ds.typography.textStyles.h3,
    color: ds.colors.neutral.text,
    marginTop: ds.spacing.lg,
    marginBottom: ds.spacing.xs,
    textAlign: 'center',
  },
  maxTierSubtitle: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.textSecondary,
    textAlign: 'center',
  },
});
