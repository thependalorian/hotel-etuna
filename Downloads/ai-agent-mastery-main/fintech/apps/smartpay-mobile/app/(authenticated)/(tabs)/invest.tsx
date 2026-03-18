/**
 * Invest tab – Placeholder for savings/invest (Revolut-style).
 * Location: fintech/smartpay/app/(authenticated)/(tabs)/invest.tsx
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { designSystem } from '@/constants/designSystem';

const ds = designSystem;

export default function InvestScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Invest</Text>
        <Text style={styles.subtitle}>Savings and investment options coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ds.colors.neutral.background },
  container: { flex: 1, paddingHorizontal: ds.spacing.lg, paddingTop: ds.spacing.lg },
  title: { ...ds.typography.textStyles.h1, color: ds.colors.neutral.text, marginBottom: ds.spacing.xs },
  subtitle: { ...ds.typography.textStyles.bodySmall, color: ds.colors.neutral.textSecondary },
});
