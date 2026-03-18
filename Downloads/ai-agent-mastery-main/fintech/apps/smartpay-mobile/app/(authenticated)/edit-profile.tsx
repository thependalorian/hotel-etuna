/**
 * Edit profile screen – Smartpay.
 * Editable: first name, last name. Read-only: email, phone. Save updates backend and UserContext.
 * Pattern from buffr-g2p edit-profile (dirty state, Save disabled until changed).
 * Location: app/(authenticated)/edit-profile.tsx
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { designSystem } from '@/constants/designSystem';
import { useUser } from '@/contexts/UserContext';
import { fetchProfile, updateProfile } from '@/services/profile';

const ds = designSystem;

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, setProfile } = useUser();
  const [firstName, setFirstName] = useState(profile?.firstName ?? '');
  const [lastName, setLastName] = useState(profile?.lastName ?? '');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.firstName !== undefined) setFirstName(profile.firstName);
    if (profile?.lastName !== undefined) setLastName(profile.lastName);
  }, [profile?.firstName, profile?.lastName]);

  useEffect(() => {
    let cancelled = false;
    fetchProfile()
      .then((data) => {
        if (cancelled || !data) return;
        setFirstName(data.firstName ?? '');
        setLastName(data.lastName ?? '');
        setEmail(data.email ?? '');
        setPhone(data.phone ?? '');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const initialFirst = profile?.firstName ?? '';
  const initialLast = profile?.lastName ?? '';
  const hasChanges =
    firstName.trim() !== initialFirst ||
    lastName.trim() !== initialLast;
  const canSave = hasChanges && firstName.trim().length > 0 && !saving;

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
      });
      router.back();
    } else {
      setError('Update failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
            <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={24} tintColor={ds.colors.neutral.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit profile</Text>
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
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={24} tintColor={ds.colors.neutral.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit profile</Text>
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
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>First name</Text>
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
            <Text style={styles.label}>Last name</Text>
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
          {(email || phone) && (
            <View style={styles.readOnlySection}>
              <Text style={styles.sectionLabel}>Contact (read-only)</Text>
              {email ? (
                <View style={styles.readOnlyRow}>
                  <Text style={styles.readOnlyLabel}>Email</Text>
                  <Text style={styles.readOnlyValue}>{email}</Text>
                </View>
              ) : null}
              {phone ? (
                <View style={styles.readOnlyRow}>
                  <Text style={styles.readOnlyLabel}>Phone</Text>
                  <Text style={styles.readOnlyValue}>{phone}</Text>
                </View>
              ) : null}
            </View>
          )}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            accessibilityLabel="Save"
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
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
  fieldGroup: { marginBottom: ds.spacing.lg },
  label: { ...ds.typography.textStyles.bodySmall, color: ds.colors.neutral.textSecondary, marginBottom: ds.spacing.xs },
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
  readOnlySection: {
    marginTop: ds.spacing.md,
    marginBottom: ds.spacing.lg,
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    borderWidth: 1,
    borderColor: ds.colors.neutral.border,
  },
  sectionLabel: { ...ds.typography.textStyles.caption, color: ds.colors.neutral.textSecondary, marginBottom: ds.spacing.sm },
  readOnlyRow: { marginBottom: ds.spacing.xs },
  readOnlyLabel: { ...ds.typography.textStyles.caption, color: ds.colors.neutral.textTertiary },
  readOnlyValue: { ...ds.typography.textStyles.bodySmall, color: ds.colors.neutral.text },
  errorText: { ...ds.typography.textStyles.caption, color: ds.colors.semantic.error, marginBottom: ds.spacing.md },
  saveBtn: {
    backgroundColor: ds.colors.brand.primary,
    borderRadius: ds.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { ...ds.typography.textStyles.button, color: '#fff' },
});
