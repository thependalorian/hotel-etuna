/**
 * Edit Profile Screen - Smartpay
 * 
 * Editable fields:
 * - Avatar (80×80 with "Change Photo")
 * - First Name
 * - Last Name
 * - Email (optional)
 * 
 * Read-only: Phone number
 * 
 * API: PATCH /api/v1/mobile/user/profile
 * Pattern: buffr-g2p edit-profile with loading/success/error states
 * Location: app/(authenticated)/profile/edit-profile.tsx
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { designSystem as ds } from '@/constants/designSystem';
import { useUser } from '@/contexts/UserContext';
import { fetchProfile, updateProfile } from '@/services/profile';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, setProfile } = useUser();
  const [firstName, setFirstName] = useState(profile?.firstName ?? '');
  const [lastName, setLastName] = useState(profile?.lastName ?? '');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | undefined>(profile?.avatarUrl);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.firstName !== undefined) setFirstName(profile.firstName);
    if (profile?.lastName !== undefined) setLastName(profile.lastName);
    if (profile?.avatarUrl !== undefined) setAvatarUri(profile.avatarUrl);
  }, [profile?.firstName, profile?.lastName, profile?.avatarUrl]);

  useEffect(() => {
    let cancelled = false;
    fetchProfile()
      .then((data) => {
        if (cancelled || !data) return;
        setFirstName(data.firstName ?? '');
        setLastName(data.lastName ?? '');
        setEmail(data.email ?? '');
        setPhone(data.phone ?? '');
        if (data.avatarUrl) setAvatarUri(data.avatarUrl);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const initialFirst = profile?.firstName ?? '';
  const initialLast = profile?.lastName ?? '';
  const initialAvatar = profile?.avatarUrl;
  const hasChanges =
    firstName.trim() !== initialFirst ||
    lastName.trim() !== initialLast ||
    avatarUri !== initialAvatar;
  const canSave = hasChanges && firstName.trim().length > 0 && !saving;

  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to change your photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!hasChanges || saving) return;
    setSaving(true);
    setError(null);
    
    const result = await updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
    
    setSaving(false);
    if (result?.updated && profile) {
      setProfile({
        ...profile,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        avatarUrl: avatarUri,
      });
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      setError('Update failed. Please try again.');
    }
  };

  const getAvatarSource = () => {
    if (!avatarUri) return null;
    if (avatarUri === '/avatars/pendo-avatar.png') {
      return require('@/assets/images/pendo-avatar.png');
    }
    return { uri: avatarUri.startsWith('http') ? avatarUri : `${API_BASE}${avatarUri}` };
  };

  const initials = (firstName?.[0] ?? 'U').toUpperCase() + (lastName?.[0] ?? '').toUpperCase();
  const avatarSource = getAvatarSource();

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={24} color={ds.colors.neutral.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={ds.colors.neutral.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Editor */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              {avatarSource ? (
                <Image source={avatarSource} style={styles.avatar} resizeMode="cover" />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.changePhotoBtn}
              onPress={handleChangePhoto}
              accessibilityLabel="Change photo"
            >
              <Ionicons name="camera" size={16} color={ds.colors.brand.primary} />
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Text Inputs */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor={ds.colors.neutral.textTertiary}
              autoCapitalize="words"
              editable={!saving}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor={ds.colors.neutral.textTertiary}
              autoCapitalize="words"
              editable={!saving}
            />
          </View>

          {/* Read-only Phone */}
          {phone && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Phone (read-only)</Text>
              <View style={[styles.input, styles.inputDisabled]}>
                <Text style={styles.inputDisabledText}>{phone}</Text>
              </View>
            </View>
          )}

          {/* Optional Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email (optional)</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              placeholderTextColor={ds.colors.neutral.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!saving}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Primary CTA: Save Changes */}
          <TouchableOpacity
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            accessibilityLabel="Save changes"
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ds.colors.neutral.background },
  flex: { flex: 1 },
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
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    marginBottom: ds.spacing.xl,
  },
  avatarWrap: { marginBottom: ds.spacing.md },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ds.colors.brand.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 32, fontWeight: '700', color: ds.colors.brand.primary },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    backgroundColor: ds.colors.brand.primaryMuted,
    borderRadius: ds.radius.md,
    gap: ds.spacing.xs,
  },
  changePhotoText: { ...ds.typography.textStyles.bodySmall, color: ds.colors.brand.primary, fontWeight: '600' },
  
  // Form Fields
  fieldGroup: { marginBottom: ds.spacing.lg },
  label: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.textSecondary,
    marginBottom: ds.spacing.xs,
    fontWeight: '500',
  },
  input: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.md,
    paddingVertical: 14,
    paddingHorizontal: ds.spacing.md,
    borderWidth: 1,
    borderColor: ds.colors.neutral.border,
  },
  inputDisabled: {
    backgroundColor: ds.colors.neutral.muted,
    justifyContent: 'center',
  },
  inputDisabledText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.textTertiary,
  },
  errorText: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.semantic.error,
    marginBottom: ds.spacing.md,
    textAlign: 'center',
  },
  
  // Save Button (Primary CTA - 56px)
  saveBtn: {
    backgroundColor: ds.colors.brand.primary,
    borderRadius: ds.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginTop: ds.spacing.md,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { ...ds.typography.textStyles.button, color: '#fff' },
});
