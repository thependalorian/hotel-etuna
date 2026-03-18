/**
 * Invite to Smartpay Screen
 * 
 * Features:
 * - User invite code display (large, copyable)
 * - Format: "SP-INV-ABC12XY"
 * - Share button with pre-filled message
 * - Invite link: `smartpay://invite?code=ABC12XY`
 * - Referral count (optional)
 * - QR code for invite (optional)
 * 
 * Pattern: buffr-g2p invite + iOS share sheet
 * Location: app/(authenticated)/invite/index.tsx
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Clipboard,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { designSystem as ds } from '@/constants/designSystem';
import { useUser } from '@/contexts/UserContext';

export default function InviteScreen() {
  const router = useRouter();
  const { profile } = useUser();
  const [referralCount] = useState(0);

  const inviteCode = profile?.inviteCode || 'SMART2024';
  const inviteLink = profile?.inviteLink || `smartpay://invite?code=${inviteCode}`;
  const formattedCode = `SP-INV-${inviteCode}`;
  const userName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'A friend';

  const shareMessage = `${userName} invited you to join Smartpay! 🎉\n\nGet started with mobile payments, wallets, and more.\n\nUse my invite code: ${formattedCode}\n\nDownload: ${inviteLink}`;

  const handleCopyCode = () => {
    Clipboard.setString(formattedCode);
    Alert.alert('Copied', 'Invite code copied to clipboard');
  };

  const handleCopyLink = () => {
    Clipboard.setString(inviteLink);
    Alert.alert('Copied', 'Invite link copied to clipboard');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: shareMessage,
        title: 'Join Smartpay',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* AppHeader */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={ds.colors.neutral.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite to Smartpay</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Ionicons name="gift" size={64} color={ds.colors.brand.primary} />
          <Text style={styles.heroTitle}>Share the benefits</Text>
          <Text style={styles.heroSubtitle}>
            Invite friends to Smartpay and earn rewards together
          </Text>
        </View>

        {/* Invite Code Card */}
        <View style={styles.inviteCodeCard}>
          <Text style={styles.cardLabel}>Your Invite Code</Text>
          <TouchableOpacity
            style={styles.codeBox}
            onPress={handleCopyCode}
            activeOpacity={0.7}
            accessibilityLabel="Copy invite code"
          >
            <Text style={styles.codeText}>{formattedCode}</Text>
            <View style={styles.copyBtn}>
              <Ionicons name="copy-outline" size={24} color={ds.colors.brand.primary} />
            </View>
          </TouchableOpacity>
          <Text style={styles.codeTip}>Tap to copy</Text>
        </View>

        {/* QR Code Section */}
        <View style={styles.qrSection}>
          <Text style={styles.qrLabel}>Or scan this QR code</Text>
          <View style={styles.qrBox}>
            <QRCode
              value={inviteLink}
              size={200}
              backgroundColor={ds.colors.background}
              color={ds.colors.neutral.text}
            />
          </View>
        </View>

        {/* Invite Link Card */}
        <View style={styles.linkCard}>
          <Text style={styles.cardLabel}>Invite Link</Text>
          <TouchableOpacity
            style={styles.linkBox}
            onPress={handleCopyLink}
            activeOpacity={0.7}
            accessibilityLabel="Copy invite link"
          >
            <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="middle">
              {inviteLink}
            </Text>
            <Ionicons name="copy-outline" size={20} color={ds.colors.brand.primary} />
          </TouchableOpacity>
        </View>

        {/* Referral Count (optional) */}
        {referralCount > 0 && (
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{referralCount}</Text>
              <Text style={styles.statLabel}>Friends Joined</Text>
            </View>
          </View>
        )}

        {/* Benefits List */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>What your friends get</Text>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={24} color={ds.colors.semantic.success} />
            <Text style={styles.benefitText}>Easy mobile payments</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={24} color={ds.colors.semantic.success} />
            <Text style={styles.benefitText}>Multiple wallets for savings</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={24} color={ds.colors.semantic.success} />
            <Text style={styles.benefitText}>Secure transactions</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={24} color={ds.colors.semantic.success} />
            <Text style={styles.benefitText}>24/7 AI assistant</Text>
          </View>
        </View>

        {/* Primary CTA: Share */}
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleShare}
          accessibilityLabel="Share invite"
        >
          <Ionicons name="share-social" size={20} color="#fff" />
          <Text style={styles.shareBtnText}>Share Invite</Text>
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
  container: { padding: ds.spacing.lg, paddingBottom: ds.spacing.xxl },
  
  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingVertical: ds.spacing.xl,
    marginBottom: ds.spacing.lg,
  },
  heroTitle: {
    ...ds.typography.textStyles.h2,
    color: ds.colors.neutral.text,
    marginTop: ds.spacing.md,
    marginBottom: ds.spacing.xs,
  },
  heroSubtitle: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.textSecondary,
    textAlign: 'center',
  },
  
  // Invite Code Card
  inviteCodeCard: {
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.lg,
    padding: ds.spacing.lg,
    marginBottom: ds.spacing.lg,
    alignItems: 'center',
    ...ds.shadows.md,
  },
  cardLabel: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.textSecondary,
    marginBottom: ds.spacing.md,
    fontWeight: '500',
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ds.colors.brand.primaryMuted,
    borderRadius: ds.radius.md,
    paddingVertical: ds.spacing.md,
    paddingHorizontal: ds.spacing.lg,
    marginBottom: ds.spacing.xs,
    gap: ds.spacing.md,
  },
  codeText: {
    ...ds.typography.textStyles.h2,
    color: ds.colors.brand.primary,
    fontWeight: '700',
    letterSpacing: 2,
  },
  copyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ds.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeTip: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textTertiary,
  },
  
  // QR Code Section
  qrSection: {
    alignItems: 'center',
    marginBottom: ds.spacing.lg,
  },
  qrLabel: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.textSecondary,
    marginBottom: ds.spacing.md,
  },
  qrBox: {
    backgroundColor: ds.colors.background,
    borderRadius: ds.radius.lg,
    padding: ds.spacing.lg,
    ...ds.shadows.sm,
  },
  
  // Invite Link Card
  linkCard: {
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.lg,
    padding: ds.spacing.lg,
    marginBottom: ds.spacing.lg,
    ...ds.shadows.sm,
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ds.colors.neutral.muted,
    borderRadius: ds.radius.md,
    paddingVertical: ds.spacing.sm,
    paddingHorizontal: ds.spacing.md,
    marginTop: ds.spacing.xs,
    gap: ds.spacing.sm,
  },
  linkText: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.brand.primary,
    flex: 1,
  },
  
  // Stats Card
  statsCard: {
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.lg,
    padding: ds.spacing.lg,
    marginBottom: ds.spacing.lg,
    alignItems: 'center',
    ...ds.shadows.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...ds.typography.textStyles.h1,
    color: ds.colors.brand.primary,
    fontWeight: '700',
  },
  statLabel: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.textSecondary,
    marginTop: ds.spacing.xs,
  },
  
  // Benefits Section
  benefitsSection: {
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.lg,
    padding: ds.spacing.lg,
    marginBottom: ds.spacing.xl,
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
    marginBottom: ds.spacing.md,
    gap: ds.spacing.sm,
  },
  benefitText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
  },
  
  // Share Button (Primary CTA - 56px)
  shareBtn: {
    flexDirection: 'row',
    backgroundColor: ds.colors.brand.primary,
    borderRadius: ds.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    gap: ds.spacing.sm,
  },
  shareBtnText: {
    ...ds.typography.textStyles.button,
    color: '#fff',
  },
});
