/**
 * Profile Screen (Me) - Smartpay
 * Figma: 725:8543
 * 
 * iOS Settings-style profile with:
 * - Profile card (avatar 72px, name, SmartpayID with copy, phone)
 * - Sectioned menu list (KYC Status, Account Settings, Social, Support, Account)
 * - Sign out with confirmation
 * 
 * Pattern: buffr-g2p Me tab + iOS Settings aesthetic
 * Location: app/(authenticated)/profile/index.tsx
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageSourcePropType,
  Alert,
  Clipboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { designSystem as ds } from '@/constants/designSystem';
import { useUser } from '@/contexts/UserContext';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { fetchProfile, type UserProfileFromApi } from '@/services/profile';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

type MenuItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  badge?: string;
  danger?: boolean;
};

type MenuSection = {
  section: string;
  items: MenuItem[];
};

const PROFILE_SECTIONS: MenuSection[] = [
  {
    section: 'Account Status',
    items: [
      {
        id: 'kyc',
        label: 'KYC Status',
        icon: 'shield-checkmark-outline',
        route: '/(authenticated)/kyc/intro',
        badge: 'Basic',
      },
      {
        id: 'pol',
        label: 'Proof of Life',
        icon: 'heart-circle-outline',
        route: '/(authenticated)/proof-of-life/intro',
      },
    ],
  },
  {
    section: 'Account Settings',
    items: [
      {
        id: 'edit',
        label: 'Edit Profile',
        icon: 'person-outline',
        route: '/(authenticated)/profile/edit-profile',
      },
      {
        id: 'settings',
        label: 'Security & Privacy',
        icon: 'lock-closed-outline',
        route: '/(authenticated)/profile/settings',
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: 'notifications-outline',
        route: '/(authenticated)/profile/notifications',
      },
    ],
  },
  {
    section: 'Social',
    items: [
      {
        id: 'invite',
        label: 'Invite to Smartpay',
        icon: 'gift-outline',
        route: '/(authenticated)/invite',
      },
    ],
  },
  {
    section: 'Support',
    items: [
      {
        id: 'help',
        label: 'Help Center',
        icon: 'help-circle-outline',
        route: '/(authenticated)/help',
      },
      {
        id: 'about',
        label: 'About Smartpay',
        icon: 'information-circle-outline',
        route: '/(authenticated)/about',
      },
    ],
  },
];

function getAvatarSource(avatarUrl: string | undefined): ImageSourcePropType | null {
  if (!avatarUrl) return null;
  if (avatarUrl === '/avatars/pendo-avatar.png') {
    return require('@/assets/images/pendo-avatar.png');
  }
  return { uri: avatarUrl.startsWith('http') ? avatarUrl : `${API_BASE}${avatarUrl}` };
}

function getKycTierBadge(tier?: string): { label: string; color: string } {
  switch (tier?.toLowerCase()) {
    case 'standard':
      return { label: 'Standard', color: ds.colors.brand.primary };
    case 'premium':
      return { label: 'Premium', color: '#FFB800' };
    default:
      return { label: 'Basic', color: ds.colors.neutral.textSecondary };
  }
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, setProfile, clearUser, smartpayId } = useUser();
  const { signOut } = useSupabaseAuth();
  const [fullProfile, setFullProfile] = useState<UserProfileFromApi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchProfile()
      .then((data) => {
        if (!cancelled && data) {
          setFullProfile(data);
          setProfile({
            id: data.userId || 'unknown',
            firstName: data.firstName ?? '',
            lastName: data.lastName ?? '',
            avatarUrl: data.avatarUrl ?? undefined,
            phone: data.phone ?? undefined,
            proofOfLifeDueDate: data.proofOfLife?.requiredBy != null ? String(data.proofOfLife.requiredBy) : undefined,
            lastProofOfLife: data.proofOfLife?.lastVerified != null ? String(data.proofOfLife.lastVerified) : undefined,
            status: data.kycTier,
          });
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [setProfile]);

  const handleCopySmartpayId = () => {
    if (smartpayId) {
      Clipboard.setString(smartpayId);
      Alert.alert('Copied', 'SmartpayID copied to clipboard');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            clearUser();
            router.replace('/(auth)');
          },
        },
      ]
    );
  };

  const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'User';
  const initials = (profile?.firstName?.[0] ?? 'U').toUpperCase() + (profile?.lastName?.[0] ?? '').toUpperCase();
  const avatarSource = getAvatarSource(profile?.avatarUrl ?? fullProfile?.avatarUrl ?? undefined);
  const kycBadge = getKycTierBadge(fullProfile?.kycTier ?? profile?.status);
  const pol = fullProfile?.proofOfLife;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* AppHeader */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={ds.colors.neutral.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Card - 72px avatar, name, SmartpayID, phone */}
        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.avatarWrap}
            activeOpacity={0.8}
            onPress={() => router.push('/(authenticated)/profile/edit-profile')}
            accessibilityLabel="Profile picture"
          >
            {avatarSource ? (
              <Image source={avatarSource} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.displayName}>{displayName}</Text>

          {/* SmartpayID with copy button */}
          {smartpayId && (
            <TouchableOpacity
              style={styles.smartpayIdRow}
              onPress={handleCopySmartpayId}
              accessibilityLabel="Copy SmartpayID"
            >
              <Text style={styles.smartpayIdLabel}>SmartpayID: </Text>
              <Text style={styles.smartpayIdValue}>{smartpayId}</Text>
              <Ionicons name="copy-outline" size={20} color={ds.colors.brand.primary} style={styles.copyIcon} />
            </TouchableOpacity>
          )}

          {/* Phone number */}
          {(fullProfile?.phone || profile?.phone) && (
            <Text style={styles.contact}>{fullProfile?.phone || profile?.phone}</Text>
          )}

          {/* Proof of Life hint */}
          {pol && pol.status !== 'current' && (
            <View style={styles.polHintCard}>
              <Ionicons name="warning-outline" size={16} color={ds.colors.warning} />
              <Text style={styles.polHint}>
                {pol.status === 'overdue' && 'Proof of life overdue'}
                {pol.status === 'due_soon' && `Due in ${pol.daysUntilRequired} days`}
                {pol.status === 'required' && 'Proof of life required'}
              </Text>
            </View>
          )}
        </View>

        {loading ? (
          <Text style={styles.loading}>Loading…</Text>
        ) : (
          <>
            {/* KYC Status Card (if available) */}
            {fullProfile?.kycTier && (
              <TouchableOpacity
                style={styles.kycStatusCard}
                onPress={() => router.push('/(authenticated)/kyc/intro')}
                activeOpacity={0.8}
              >
                <View style={styles.kycHeader}>
                  <View style={styles.kycTitleRow}>
                    <Ionicons name="shield-checkmark" size={20} color={ds.colors.brand.primary} />
                    <Text style={styles.kycTitle}>KYC Tier</Text>
                  </View>
                  <View style={[styles.tierBadge, { backgroundColor: kycBadge.color }]}>
                    <Text style={styles.tierBadgeText}>{kycBadge.label}</Text>
                  </View>
                </View>
                <Text style={styles.kycSubtitle}>Tap to upgrade your account limits</Text>
                <Ionicons name="chevron-forward" size={20} color={ds.colors.neutral.textTertiary} style={styles.kycChevron} />
              </TouchableOpacity>
            )}

            {/* Sectioned Menu List (iOS Settings style) */}
            {PROFILE_SECTIONS.map((sec) => (
              <View key={sec.section} style={styles.section}>
                <Text style={styles.sectionTitle}>{sec.section}</Text>
                <View style={styles.sectionCard}>
                  {sec.items.map((item, idx) => (
                    <React.Fragment key={item.id}>
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push(item.route as any)}
                        accessibilityLabel={item.label}
                        activeOpacity={0.6}
                      >
                        <View style={styles.menuItemLeft}>
                          <View style={[styles.menuIconBox, item.danger && styles.menuIconBoxDanger]}>
                            <Ionicons
                              name={item.icon}
                              size={20}
                              color={item.danger ? ds.colors.semantic.error : ds.colors.brand.primary}
                            />
                          </View>
                          <Text style={[styles.menuItemText, item.danger && styles.dangerText]}>{item.label}</Text>
                        </View>
                        <View style={styles.menuItemRight}>
                          {item.badge && (
                            <View style={styles.badge}>
                              <Text style={styles.badgeText}>{item.badge}</Text>
                            </View>
                          )}
                          <Ionicons name="chevron-forward" size={20} color={ds.colors.neutral.textTertiary} />
                        </View>
                      </TouchableOpacity>
                      {idx < sec.items.length - 1 && <View style={styles.menuDivider} />}
                    </React.Fragment>
                  ))}
                </View>
              </View>
            ))}

            {/* Sign Out Section */}
            <View style={styles.section}>
              <View style={styles.sectionCard}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleSignOut}
                  accessibilityLabel="Sign out"
                  activeOpacity={0.6}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.menuIconBox, styles.menuIconBoxDanger]}>
                      <Ionicons name="log-out-outline" size={20} color={ds.colors.semantic.error} />
                    </View>
                    <Text style={[styles.menuItemText, styles.dangerText]}>Sign Out</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={ds.colors.neutral.textTertiary} />
                </TouchableOpacity>
              </View>
            </View>
          </>
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
  container: { paddingHorizontal: ds.spacing.md, paddingBottom: ds.spacing.xxl },
  
  // Profile card
  profileCard: {
    alignItems: 'center',
    paddingVertical: ds.spacing.xl,
    marginTop: ds.spacing.md,
    marginBottom: ds.spacing.lg,
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.lg,
    ...ds.shadows.sm,
  },
  avatarWrap: { marginBottom: ds.spacing.md },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ds.colors.brand.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 28, fontWeight: '700', color: ds.colors.brand.primary },
  displayName: { ...ds.typography.textStyles.h3, color: ds.colors.neutral.text, marginBottom: ds.spacing.xs, fontWeight: '600' },
  
  // SmartpayID row
  smartpayIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ds.spacing.xs,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.xs,
    backgroundColor: ds.colors.brand50,
    borderRadius: ds.radius.md,
  },
  smartpayIdLabel: { ...ds.typography.textStyles.bodySmall, color: ds.colors.neutral.textSecondary },
  smartpayIdValue: { ...ds.typography.textStyles.bodySmall, color: ds.colors.brand.primary, fontWeight: '600' },
  copyIcon: { marginLeft: ds.spacing.xs },
  
  contact: { ...ds.typography.textStyles.bodySmall, color: ds.colors.neutral.textSecondary, marginTop: ds.spacing.xs },
  
  // Proof of Life hint
  polHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ds.spacing.md,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    backgroundColor: ds.colors.feedback.amber100,
    borderRadius: ds.radius.md,
    gap: ds.spacing.xs,
  },
  polHint: { ...ds.typography.textStyles.caption, color: ds.colors.warning },
  
  loading: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
    textAlign: 'center',
    marginTop: ds.spacing.lg,
  },
  
  // KYC Status Card
  kycStatusCard: {
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.lg,
    padding: ds.spacing.md,
    marginBottom: ds.spacing.lg,
    ...ds.shadows.sm,
    position: 'relative',
  },
  kycHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.spacing.xs,
  },
  kycTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.xs,
  },
  kycTitle: { ...ds.typography.textStyles.body, fontWeight: '600', color: ds.colors.neutral.text },
  tierBadge: {
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: 4,
    borderRadius: ds.radius.sm,
  },
  tierBadgeText: { ...ds.typography.textStyles.caption, fontWeight: '600', color: '#fff' },
  kycSubtitle: { ...ds.typography.textStyles.bodySmall, color: ds.colors.neutral.textSecondary, marginTop: ds.spacing.xs },
  kycChevron: { position: 'absolute', right: ds.spacing.md, top: ds.spacing.md },
  
  // Sections
  section: { marginBottom: ds.spacing.lg },
  sectionTitle: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: ds.spacing.sm,
    paddingHorizontal: ds.spacing.xs,
  },
  sectionCard: {
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.lg,
    overflow: 'hidden',
    ...ds.shadows.sm,
  },
  
  // Menu items (56px height)
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: ds.spacing.md,
    minHeight: 56,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: ds.colors.brand.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ds.spacing.sm,
  },
  menuIconBoxDanger: { backgroundColor: ds.colors.feedback.red100 },
  menuItemText: { ...ds.typography.textStyles.body, color: ds.colors.neutral.text },
  dangerText: { color: ds.colors.semantic.error },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.xs,
  },
  badge: {
    paddingHorizontal: ds.spacing.sm,
    paddingVertical: 4,
    backgroundColor: ds.colors.neutral.muted,
    borderRadius: ds.radius.sm,
  },
  badgeText: { ...ds.typography.textStyles.caption, color: ds.colors.neutral.textSecondary },
  menuDivider: {
    height: 1,
    backgroundColor: ds.colors.neutral.border,
    marginLeft: 56,
  },
});
