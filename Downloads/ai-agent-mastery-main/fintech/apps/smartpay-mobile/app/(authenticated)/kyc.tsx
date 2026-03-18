/**
 * KYC screen – Submit Customer Due Diligence (CDD) per Namibia FIA/FIC.
 * Full name, ID number, ID type, date of birth, address. Aligns with docs/NAMIBIA_KYC_REQUIREMENTS.md.
 * Location: fintech/smartpay/app/(authenticated)/kyc.tsx
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/constants/designSystem';
import { getKycStatus, submitKyc, KycStatus } from '@/services/kyc';

const ds = designSystem;

export default function KycScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [idType, setIdType] = useState<'national_id' | 'passport'>('national_id');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    getKycStatus().then((s) => {
      setStatus(s ?? null);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async () => {
    if (!fullName.trim() || !idNumber.trim() || !dateOfBirth.trim()) {
      Alert.alert('Missing fields', 'Please enter full name, ID number, and date of birth.');
      return;
    }
    const dob = dateOfBirth.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      Alert.alert('Invalid date', 'Use date of birth in YYYY-MM-DD format.');
      return;
    }
    setSubmitting(true);
    const result = await submitKyc({
      fullName: fullName.trim(),
      idNumber: idNumber.trim(),
      idType,
      dateOfBirth: dob,
      address: address.trim() || undefined,
    });
    setSubmitting(false);
    if (result.success) {
      setStatus((prev) =>
        prev ? { ...prev, kycTier: 'standard', kycVerified: false, pendingSubmission: true } : null
      );
      Alert.alert(
        'Submitted',
        'Your identity information has been submitted. We will review it to unlock higher limits.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      Alert.alert('Error', result.error ?? 'Submission failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={ds.colors.brand.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={ds.colors.neutral.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Verify your identity</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {status && (
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>KYC tier</Text>
              <Text style={styles.statusValue}>{status.kycTier}</Text>
              {status.kycVerified && (
                <Text style={styles.verified}>Verified</Text>
              )}
              {status.pendingSubmission && (
                <Text style={styles.pending}>Submission under review</Text>
              )}
            </View>
          )}

          <Text style={styles.intro}>
            To unlock higher transaction limits and full features, we need to verify your identity (per Namibia FIA/FIC requirements).
          </Text>

          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="As on ID document"
            placeholderTextColor={ds.colors.neutral.textSecondary}
            autoCapitalize="words"
          />

          <Text style={styles.label}>ID type</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.chip, idType === 'national_id' && styles.chipActive]}
              onPress={() => setIdType('national_id')}
            >
              <Text style={[styles.chipText, idType === 'national_id' && styles.chipTextActive]}>
                National ID
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, idType === 'passport' && styles.chipActive]}
              onPress={() => setIdType('passport')}
            >
              <Text style={[styles.chipText, idType === 'passport' && styles.chipTextActive]}>
                Passport
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>ID number</Text>
          <TextInput
            style={styles.input}
            value={idNumber}
            onChangeText={setIdNumber}
            placeholder="Document number"
            placeholderTextColor={ds.colors.neutral.textSecondary}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Date of birth (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="e.g. 1990-01-15"
            placeholderTextColor={ds.colors.neutral.textSecondary}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.label}>Address (optional)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={address}
            onChangeText={setAddress}
            placeholder="Residential address"
            placeholderTextColor={ds.colors.neutral.textSecondary}
            multiline
            numberOfLines={2}
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Submit for verification</Text>
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
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral.border,
    backgroundColor: ds.colors.neutral.surface,
  },
  backBtn: { padding: ds.spacing.xs, marginRight: ds.spacing.sm },
  title: { ...ds.typography.textStyles.h2, color: ds.colors.neutral.text },
  scroll: { flex: 1 },
  scrollContent: { padding: ds.spacing.lg, paddingBottom: ds.spacing.xxl },
  statusCard: {
    backgroundColor: ds.colors.neutral.surface,
    padding: ds.spacing.lg,
    borderRadius: ds.radius.md,
    marginBottom: ds.spacing.lg,
    ...ds.shadows.sm,
  },
  statusLabel: { ...ds.typography.textStyles.caption, marginBottom: 4 },
  statusValue: { ...ds.typography.textStyles.h3, color: ds.colors.neutral.text, textTransform: 'capitalize' },
  verified: { ...ds.typography.textStyles.caption, color: ds.colors.success, marginTop: 4 },
  pending: { ...ds.typography.textStyles.caption, color: ds.colors.warning, marginTop: 4 },
  intro: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.textSecondary,
    marginBottom: ds.spacing.lg,
  },
  label: {
    ...ds.typography.textStyles.bodySmall,
    fontWeight: '600',
    color: ds.colors.neutral.text,
    marginBottom: ds.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: ds.colors.neutral.border,
    borderRadius: ds.radius.sm,
    padding: ds.spacing.md,
    fontSize: 16,
    backgroundColor: ds.colors.neutral.surface,
    marginBottom: ds.spacing.md,
  },
  inputMultiline: { minHeight: 72 },
  row: { flexDirection: 'row', gap: ds.spacing.sm, marginBottom: ds.spacing.md },
  chip: {
    paddingVertical: ds.spacing.sm,
    paddingHorizontal: ds.spacing.md,
    borderRadius: ds.radius.full,
    borderWidth: 1,
    borderColor: ds.colors.neutral.border,
    backgroundColor: ds.colors.neutral.surface,
  },
  chipActive: { borderColor: ds.colors.brand.primary, backgroundColor: ds.colors.brand.primaryLight },
  chipText: { ...ds.typography.textStyles.bodySmall, color: ds.colors.neutral.textSecondary },
  chipTextActive: { color: ds.colors.brand.primary, fontWeight: '600' },
  submitBtn: {
    backgroundColor: ds.colors.brand.primary,
    paddingVertical: 16,
    borderRadius: ds.radius.md,
    alignItems: 'center',
    marginTop: ds.spacing.lg,
    ...ds.shadows.md,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { ...ds.typography.textStyles.button, color: '#fff' },
});
