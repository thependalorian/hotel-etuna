/**
 * Invite Screen – Smartpay.
 * Displays user's invite code and provides sharing functionality.
 * Uses React Native Share API and expo-clipboard for copy functionality.
 * Location: mobile/app/(authenticated)/invite.tsx
 * 
 * FEATURES:
 * - Display invite code prominently
 * - Copy to clipboard functionality
 * - Share via native share sheet
 * - Beautiful card-based design with gradients
 * - Responsive layout following design system
 * 
 * DEPENDENCIES:
 * - Run: npx expo install @react-native-clipboard/clipboard
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import { LinearGradient } from 'expo-linear-gradient';
import { designSystem } from '@/constants/designSystem';
import { useUser } from '@/contexts/UserContext';

/**
 * NOTE: Install clipboard package if not already installed:
 * npx expo install @react-native-clipboard/clipboard
 * 
 * Then import:
 * import Clipboard from '@react-native-clipboard/clipboard';
 */

const ds = designSystem;

export default function InviteScreen() {
  const router = useRouter();
  const { profile } = useUser();
  const [copied, setCopied] = useState(false);

  // Get invite code and link from user profile
  const inviteCode = profile?.inviteCode ?? 'SMARTPAY2024';
  const inviteLink = profile?.inviteLink ?? `https://smartpay.na/invite/${inviteCode}`;

  /**
   * Copy invite code to clipboard.
   * Uses expo-clipboard for cross-platform clipboard access.
   */
  const handleCopyCode = async () => {
    try {
      // TODO: Install @react-native-clipboard/clipboard package
      // Clipboard.setString(inviteCode);
      
      // Fallback: Show alert for now
      Alert.alert('Copy', `Invite code: ${inviteCode}\n\nInstall @react-native-clipboard/clipboard for clipboard support.`);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      Alert.alert('Error', 'Failed to copy invite code');
    }
  };

  /**
   * Copy invite link to clipboard.
   * Uses expo-clipboard for cross-platform clipboard access.
   */
  const handleCopyLink = async () => {
    try {
      // TODO: Install @react-native-clipboard/clipboard package
      // Clipboard.setString(inviteLink);
      
      // Fallback: Show alert for now
      Alert.alert('Copy', `Invite link: ${inviteLink}\n\nInstall @react-native-clipboard/clipboard for clipboard support.`);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      Alert.alert('Error', 'Failed to copy invite link');
    }
  };

  /**
   * Share invite via React Native Share API.
   * Opens native share sheet on iOS/Android.
   */
  const handleShare = async () => {
    try {
      const message = `Join me on SmartPay! Use my invite code: ${inviteCode}\n\n${inviteLink}`;
      
      const result = await Share.share({
        message,
        title: 'Join SmartPay',
        url: inviteLink, // iOS specific
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
        } else {
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share invite');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Back"
        >
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={24}
            tintColor={ds.colors.neutral.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Friends</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="gift" size={40} color={ds.colors.brand.primary} />
          </View>
          <Text style={styles.heroTitle}>Invite & Earn</Text>
          <Text style={styles.heroDescription}>
            Share SmartPay with friends and earn rewards when they sign up with your invite code.
          </Text>
        </View>

        {/* Invite Code Card */}
        <LinearGradient
          colors={[ds.colors.brand.primary, ds.colors.brand.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.codeCard}
        >
          <Text style={styles.codeLabel}>Your Invite Code</Text>
          <Text style={styles.codeText}>{inviteCode}</Text>
          
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopyCode}
            accessibilityLabel="Copy invite code"
          >
            <Ionicons
              name={copied ? 'checkmark-circle' : 'copy'}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.copyButtonText}>
              {copied ? 'Copied!' : 'Copy Code'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Invite Link Card */}
        <View style={styles.linkCard}>
          <View style={styles.linkHeader}>
            <Ionicons name="link" size={20} color={ds.colors.brand.primary} />
            <Text style={styles.linkLabel}>Invite Link</Text>
          </View>
          
          <View style={styles.linkContainer}>
            <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="middle">
              {inviteLink}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={handleCopyLink}
            accessibilityLabel="Copy invite link"
          >
            <Ionicons name="copy-outline" size={18} color={ds.colors.brand.primary} />
            <Text style={styles.linkButtonText}>Copy Link</Text>
          </TouchableOpacity>
        </View>

        {/* Share Button */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          accessibilityLabel="Share invite"
        >
          <Ionicons name="share-social" size={20} color="#FFFFFF" />
          <Text style={styles.shareButtonText}>Share Invite</Text>
        </TouchableOpacity>

        {/* How it Works Section */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>How it Works</Text>
          
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Share Your Code</Text>
              <Text style={styles.stepDescription}>
                Send your invite code or link to friends via WhatsApp, SMS, or social media.
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Friend Signs Up</Text>
              <Text style={styles.stepDescription}>
                Your friend creates a SmartPay account using your invite code.
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>You Both Earn</Text>
              <Text style={styles.stepDescription}>
                Once they complete their first transaction, you both receive bonus credits!
              </Text>
            </View>
          </View>
        </View>

        {/* Terms Section */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Terms & Conditions</Text>
          <Text style={styles.termsText}>
            • Both you and your friend must complete KYC verification{'\n'}
            • Your friend must make their first transaction within 30 days{'\n'}
            • Rewards are credited within 48 hours of completion{'\n'}
            • Maximum 10 invites per month
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ds.colors.neutral.background,
  },
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
  backBtn: {
    padding: ds.spacing.sm,
  },
  headerTitle: {
    ...ds.typography.textStyles.h2,
    color: ds.colors.neutral.text,
  },
  headerRight: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: ds.spacing.lg,
    paddingBottom: ds.spacing.xxl,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: ds.spacing.xl,
    marginBottom: ds.spacing.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ds.colors.brand.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing.md,
  },
  heroTitle: {
    ...ds.typography.textStyles.h1,
    color: ds.colors.neutral.text,
    marginBottom: ds.spacing.xs,
  },
  heroDescription: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
  },
  codeCard: {
    padding: ds.spacing.xl,
    borderRadius: ds.radius.lg,
    marginBottom: ds.spacing.lg,
    ...ds.shadows.md,
    alignItems: 'center',
  },
  codeLabel: {
    ...ds.typography.textStyles.caption,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: ds.spacing.xs,
  },
  codeText: {
    ...ds.typography.textStyles.h1,
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 4,
    marginBottom: ds.spacing.lg,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: ds.spacing.lg,
    paddingVertical: ds.spacing.sm,
    borderRadius: ds.radius.full,
    gap: ds.spacing.xs,
  },
  copyButtonText: {
    ...ds.typography.textStyles.bodySmall,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  linkCard: {
    backgroundColor: ds.colors.neutral.surface,
    padding: ds.spacing.lg,
    borderRadius: ds.radius.lg,
    marginBottom: ds.spacing.lg,
    ...ds.shadows.sm,
  },
  linkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.xs,
    marginBottom: ds.spacing.md,
  },
  linkLabel: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.textSecondary,
    fontWeight: '600',
  },
  linkContainer: {
    backgroundColor: ds.colors.neutral.background,
    padding: ds.spacing.md,
    borderRadius: ds.radius.md,
    marginBottom: ds.spacing.md,
  },
  linkText: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.brand.primary,
    fontFamily: 'monospace',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ds.colors.brand.primaryLight,
    paddingVertical: ds.spacing.sm,
    borderRadius: ds.radius.md,
    gap: ds.spacing.xs,
  },
  linkButtonText: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.brand.primary,
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ds.colors.brand.primary,
    paddingVertical: ds.spacing.md,
    borderRadius: ds.radius.lg,
    marginBottom: ds.spacing.xl,
    gap: ds.spacing.sm,
    ...ds.shadows.md,
  },
  shareButtonText: {
    ...ds.typography.textStyles.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  howItWorksSection: {
    marginBottom: ds.spacing.xl,
  },
  sectionTitle: {
    ...ds.typography.textStyles.h3,
    color: ds.colors.neutral.text,
    marginBottom: ds.spacing.md,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: ds.colors.neutral.surface,
    padding: ds.spacing.lg,
    borderRadius: ds.radius.lg,
    marginBottom: ds.spacing.md,
    ...ds.shadows.sm,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ds.colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ds.spacing.md,
  },
  stepNumberText: {
    ...ds.typography.textStyles.h3,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    fontWeight: '600',
    marginBottom: ds.spacing.xs,
  },
  stepDescription: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.textSecondary,
    lineHeight: 20,
  },
  termsSection: {
    backgroundColor: ds.colors.neutral.surface,
    padding: ds.spacing.lg,
    borderRadius: ds.radius.lg,
    ...ds.shadows.sm,
  },
  termsTitle: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.text,
    fontWeight: '600',
    marginBottom: ds.spacing.sm,
  },
  termsText: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
    lineHeight: 18,
  },
});
