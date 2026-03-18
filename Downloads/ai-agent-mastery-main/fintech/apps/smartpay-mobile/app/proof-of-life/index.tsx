import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/constants/designSystem';

export default function ProofOfLifeScreen() {
  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={designSystem.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Proof of Life</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={80} color={designSystem.colors.success} />
          </View>

          <Text style={styles.mainTitle}>Verification Required</Text>
          <Text style={styles.description}>
            Government regulations require periodic verification. Complete your verification to continue using SmartPay services.
          </Text>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color={designSystem.colors.info} />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Why is this needed?</Text>
              <Text style={styles.infoDescription}>
                Proof of Life verification ensures account security and prevents fraud.
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Start Verification</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: designSystem.colors.background },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: designSystem.spacing.smartpay.horizontalPadding,
    paddingVertical: designSystem.spacing.md,
    backgroundColor: designSystem.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: designSystem.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...designSystem.typography.textStyles.titleSm,
    color: designSystem.colors.text,
  },
  scrollView: { flex: 1 },
  content: {
    paddingHorizontal: designSystem.spacing.smartpay.horizontalPadding,
    paddingVertical: designSystem.spacing['3xl'],
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: designSystem.spacing.xl,
  },
  mainTitle: {
    ...designSystem.typography.textStyles.titleLg,
    color: designSystem.colors.text,
    textAlign: 'center',
    marginBottom: designSystem.spacing.md,
  },
  description: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.textSecondary,
    textAlign: 'center',
    marginBottom: designSystem.spacing['2xl'],
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.md,
    marginBottom: designSystem.spacing['2xl'],
    gap: 12,
    width: '100%',
  },
  infoText: { flex: 1 },
  infoTitle: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.info,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoDescription: {
    ...designSystem.typography.textStyles.bodySm,
    color: designSystem.colors.textSecondary,
  },
  button: {
    width: '100%',
    height: designSystem.components?.button?.height ?? 48,
    backgroundColor: designSystem.colors.primary,
    borderRadius: designSystem.components?.button?.borderRadius ?? 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...designSystem.shadows.md,
  },
  buttonText: {
    ...designSystem.typography.textStyles.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
