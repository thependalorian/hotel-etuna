/**
 * Profile screen – Smartpay.
 * Full user profile: avatar (or initials), name, contact, sectioned menu (KYC, proof-of-life, settings), sign out.
 * Pattern from buffr-g2p/mobile (Me tab, PROFILE_LINKS, clearUser). PRD §4.8, §4.4.8, §4.7.
 * Location: app/(authenticated)/profile.tsx
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/constants/designSystem';
import { useUser } from '@/contexts/UserContext';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { fetchProfile, type UserProfileFromApi } from '@/services/profile';

const ds = designSystem;
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

type ProfileLink = { id: string; label: string; icon: keyof typeof Ionicons.glyphMap; route: string; danger?: boolean };

const PROFILE_SECTIONS: Array<{ section: string; items: ProfileLink[] }> = [
  {
    section: 'Security',
    items: [
      { id: 'kyc', label: 'Verify identity (KYC)', icon: 'shield-checkmark', route: '/(authenticated)/kyc' },
      { id: 'pol', label: 'Proof of life', icon: 'heart-circle', route: '/(authenticated)/(tabs)/copilot' },
      { id: 'biometric', label: 'Biometric authentication', icon: 'finger-print', route: '/(authenticated)/(modals)/biometric-settings' },
    ],
  },
  {
    section: 'Invite',
    items: [
      { id: 'invite', label: 'Invite to Smartpay', icon: 'gift', route: '/(authenticated)/invite' },
    ],
  },
  {
    section: 'Settings',
    items: [
      { id: 'account', label: 'Account settings', icon: 'settings', route: '/(authenticated)/(modals)/account' },
      { id: 'edit', label: 'Edit profile', icon: 'person', route: '/(authenticated)/edit-profile' },
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

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, setProfile, clearUser } = useUser();
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
            proofOfLifeDueDate: data.proofOfLife?.requiredBy != null ? String(data.proofOfLife.requiredBy) : undefined,
            lastProofOfLife: data.proofOfLife?.lastVerified != null ? String(data.proofOfLife.lastVerified) : undefined,
            status: data.kycTier,
          });
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [setProfile]);

  const handleSignOut = async () => {
    await signOut();
    clearUser();
    router.replace('/(auth)');
  };

  const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'User';
  const initials = (profile?.firstName?.[0] ?? 'U').toUpperCase() + (profile?.lastName?.[0] ?? '').toUpperCase();
  const avatarSource = getAvatarSource(profile?.avatarUrl ?? fullProfile?.avatarUrl ?? undefined);
  const pol = fullProfile?.proofOfLife;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={24} tintColor={ds.colors.neutral.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Me</Text>
        <TouchableOpacity onPress={() => router.push('/(authenticated)/(modals)/account')} style={styles.headerRight} accessibilityLabel="Settings">
          <Ionicons name="settings-outline" size={22} color={ds.colors.neutral.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile card – avatar/initials, name, contact (buffr-g2p pattern) */}
        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.avatarWrap} activeOpacity={0.8} onPress={() => router.push('/(authenticated)/edit-profile')} accessibilityLabel="Profile picture">
            {avatarSource ? (
              <Image source={avatarSource} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.displayName}>{displayName}</Text>
          {(fullProfile?.email || fullProfile?.phone) && (
            <View style={styles.contactRow}>
              {fullProfile?.email ? <Text style={styles.contact}>{fullProfile.email}</Text> : null}
              {fullProfile?.phone ? <Text style={styles.contact}>{fullProfile.phone}</Text> : null}
            </View>
          )}
          {pol && pol.status !== 'current' && (
            <Text style={styles.polHint}>
              {pol.status === 'overdue' && 'Proof of life overdue – verify in Copilot'}
              {pol.status === 'due_soon' && `Proof of life due in ${pol.daysUntilRequired} days`}
              {pol.status === 'required' && 'Proof of life required'}
            </Text>
          )}
        </View>

        {loading ? (
          <Text style={styles.loading}>Loading…</Text>
        ) : (
          <>
            {/* Sectioned menu (buffr-g2p PROFILE_LINKS style) */}
            {PROFILE_SECTIONS.map((sec) => (
              <View key={sec.section} style={styles.section}>
                <Text style={styles.sectionTitle}>{sec.section}</Text>
                {sec.items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.menuItem}
                    onPress={() => router.push(item.route as never)}
                    accessibilityLabel={item.label}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={[styles.menuIconBox, item.danger && styles.menuIconBoxDanger]}>
                        <Ionicons name={item.icon} size={18} color={item.danger ? ds.colors.semantic.error : ds.colors.brand.primary} />
                      </View>
                      <Text style={[styles.menuItemText, item.danger && styles.dangerText]}>{item.label}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={ds.colors.neutral.textTertiary} />
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {/* Sign out – buffr-g2p style menu item with danger */}
            <View style={styles.section}>
              <TouchableOpacity style={styles.menuItem} onPress={handleSignOut} accessibilityLabel="Sign out">
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconBox, styles.menuIconBoxDanger]}>
                    <Ionicons name="log-out-outline" size={18} color={ds.colors.semantic.error} />
                  </View>
                  <Text style={[styles.menuItemText, styles.dangerText]}>Sign out</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={ds.colors.neutral.textTertiary} />
              </TouchableOpacity>
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
  headerRight: { padding: ds.spacing.sm },
  scroll: { flex: 1 },
  container: { paddingHorizontal: ds.spacing.lg, paddingBottom: ds.spacing.xxl },
  profileCard: {
    alignItems: 'center',
    paddingVertical: ds.spacing.xl,
    marginTop: ds.spacing.lg,
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.lg,
    marginBottom: ds.spacing.xl,
    ...ds.shadows.sm,
  },
  avatarWrap: { marginBottom: ds.spacing.sm },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ds.colors.brand.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { ...ds.typography.textStyles.h2, color: ds.colors.brand.primary, fontWeight: '700' },
  loading: { ...ds.typography.textStyles.caption, color: ds.colors.neutral.textSecondary, textAlign: 'center', marginTop: ds.spacing.lg },
  displayName: { ...ds.typography.textStyles.h3, color: ds.colors.neutral.text, marginBottom: ds.spacing.xs },
  contactRow: { marginBottom: ds.spacing.xs },
  contact: { ...ds.typography.textStyles.bodySmall, color: ds.colors.neutral.textSecondary, textAlign: 'center' },
  polHint: { ...ds.typography.textStyles.caption, color: ds.colors.warning, textAlign: 'center', marginTop: ds.spacing.xs },
  section: { marginBottom: ds.spacing.lg },
  sectionTitle: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: ds.spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.md,
    paddingVertical: 14,
    paddingHorizontal: ds.spacing.md,
    marginBottom: ds.spacing.xs,
    ...ds.shadows.sm,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: ds.colors.brand.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIconBoxDanger: { backgroundColor: ds.colors.feedback.red100 },
  menuItemText: { ...ds.typography.textStyles.body, color: ds.colors.neutral.text },
  dangerText: { color: ds.colors.semantic.error },
});
