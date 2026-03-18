import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/constants/designSystem';

export default function CashOutScreen() {
  const methods = [
    { id: 'agent', label: 'Cash Out at Agent', icon: 'business', description: 'Visit a nearby agent to withdraw cash' },
    { id: 'atm', label: 'ATM Withdrawal', icon: 'card', description: 'Use your SmartPay card at any ATM' },
    { id: 'bank', label: 'Bank Transfer', icon: 'business-outline', description: 'Transfer to your bank account' },
  ];

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={designSystem.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Cash Out</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Cash Out Method</Text>
            {methods.map(method => (
              <TouchableOpacity key={method.id} style={styles.methodCard}>
                <View style={styles.methodIcon}>
                  <Ionicons name={method.icon as any} size={24} color={designSystem.colors.primary} />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodLabel}>{method.label}</Text>
                  <Text style={styles.methodDescription}>{method.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={designSystem.colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
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
  section: {
    paddingHorizontal: designSystem.spacing.smartpay.horizontalPadding,
    paddingVertical: designSystem.spacing.lg,
  },
  sectionTitle: {
    ...designSystem.typography.textStyles.titleSm,
    color: designSystem.colors.text,
    marginBottom: designSystem.spacing.md,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designSystem.colors.surface,
    padding: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.md,
    marginBottom: designSystem.spacing.md,
    ...designSystem.shadows.sm,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: designSystem.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodInfo: { flex: 1 },
  methodLabel: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  methodDescription: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.textSecondary,
  },
});
