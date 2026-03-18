/**
 * Transfers tab – Send money, request, history (Revolut-style).
 * Location: fintech/smartpay/app/(authenticated)/(tabs)/transfers.tsx
 */
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { designSystem } from '@/constants/designSystem';

const ds = designSystem;

export default function TransfersScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Transfers</Text>
        <Text style={styles.subtitle}>Send money, request, or view history.</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/(authenticated)/(tabs)/copilot')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Send with Copilot</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>Say "Send N$50 to John" in the Copilot tab.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ds.colors.neutral.background },
  container: { flex: 1, paddingHorizontal: ds.spacing.lg, paddingTop: ds.spacing.lg },
  title: { ...ds.typography.textStyles.h1, color: ds.colors.neutral.text, marginBottom: ds.spacing.xs },
  subtitle: { ...ds.typography.textStyles.bodySmall, color: ds.colors.neutral.textSecondary, marginBottom: ds.spacing.xl },
  card: {
    padding: ds.spacing.lg,
    borderRadius: ds.radius.lg,
    borderWidth: 1,
    borderColor: ds.colors.neutral.border,
    backgroundColor: ds.colors.neutral.surface,
    ...ds.shadows.sm,
  },
  primaryBtn: {
    paddingVertical: ds.spacing.md,
    paddingHorizontal: ds.spacing.lg,
    borderRadius: ds.radius.md,
    backgroundColor: ds.colors.brand.primary,
    alignItems: 'center',
    ...ds.shadows.sm,
  },
  primaryBtnText: { ...ds.typography.textStyles.button, color: '#fff' },
  hint: { ...ds.typography.textStyles.caption, color: ds.colors.neutral.textSecondary, marginTop: ds.spacing.md, fontStyle: 'italic' },
});
