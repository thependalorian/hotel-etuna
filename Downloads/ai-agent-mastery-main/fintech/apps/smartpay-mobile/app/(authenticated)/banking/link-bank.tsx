/**
 * Link Bank - Available Banks List
 * 
 * Shows list of Namibian banks for Open Banking linking
 * Figma: Frame 44:537
 * 
 * Features:
 * - List of supported banks (FNB, Bank Windhoek, Standard Bank, Nedbank, NamPost)
 * - Bank logos and colors
 * - Initiate OAuth consent flow
 * - Test mode indicator
 * 
 * Location: app/(authenticated)/banking/link-bank.tsx
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { designSystem as DS } from '@/constants/designSystem';
import {
  getAvailableBanks,
  initiateConsent,
  BankConfig,
} from '@/services/openBanking';

export default function LinkBankScreen() {
  const [loading, setLoading] = useState<string | null>(null);
  const banks = getAvailableBanks();

  const handleLinkBank = async (bank: BankConfig) => {
    try {
      setLoading(bank.id);

      const result = await initiateConsent(bank.id);

      if (result.type === 'success') {
        router.push({
          pathname: '/banking/oauth-callback',
          params: { url: result.url },
        });
      } else if (result.type === 'cancel') {
        Alert.alert('Cancelled', 'You cancelled the bank linking process');
      } else {
        Alert.alert(
          'Error',
          'Failed to initiate bank linking. Please try again.'
        );
      }
    } catch (error) {
      console.error('handleLinkBank error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader
        title="Link Bank Account"
        showBackButton
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="link" size={32} color={DS.colors.brand.primary} />
          </View>
          <Text style={styles.title}>Connect Your Bank</Text>
          <Text style={styles.description}>
            Securely link your bank account using Open Banking. Your credentials
            are never stored by SmartPay.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Your Bank</Text>

          <View style={styles.banksList}>
            {banks.map((bank) => (
              <BankCard
                key={bank.id}
                bank={bank}
                loading={loading === bank.id}
                onPress={() => handleLinkBank(bank)}
              />
            ))}
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color={DS.colors.semantic.success} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Secure & Private</Text>
            <Text style={styles.infoText}>
              • Bank-grade encryption{'\n'}
              • OAuth 2.0 authentication{'\n'}
              • Read-only access{'\n'}
              • Revoke anytime
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface BankCardProps {
  bank: BankConfig;
  loading: boolean;
  onPress: () => void;
}

function BankCard({ bank, loading, onPress }: BankCardProps) {
  return (
    <TouchableOpacity
      style={[styles.bankCard, { borderColor: bank.color }]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
      accessibilityLabel={`Link ${bank.name}`}
      accessibilityRole="button"
    >
      <View style={[styles.bankIconContainer, { backgroundColor: bank.color + '15' }]}>
        <Ionicons name="business" size={32} color={bank.color} />
      </View>

      <View style={styles.bankInfo}>
        <Text style={styles.bankName}>{bank.name}</Text>
        {bank.isTestMode && (
          <View style={styles.testBadge}>
            <Text style={styles.testBadgeText}>Test Mode</Text>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={bank.color} />
      ) : (
        <Ionicons name="chevron-forward" size={24} color={DS.colors.textTertiary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.lg,
    paddingBottom: DS.spacing.contentBottomPadding,
  },
  header: {
    alignItems: 'center',
    marginBottom: DS.spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.brand.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DS.spacing.md,
  },
  title: {
    fontSize: DS.typography.fontSize['2xl'],
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.text,
    marginBottom: DS.spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: DS.spacing.xl,
  },
  sectionTitle: {
    fontSize: DS.typography.fontSize.lg,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: DS.spacing.md,
  },
  banksList: {
    gap: DS.spacing.sm,
  },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.md,
    padding: DS.spacing.md,
    backgroundColor: DS.colors.background,
    borderRadius: DS.radius.lg,
    borderWidth: 2,
    borderColor: DS.colors.border,
  },
  bankIconContainer: {
    width: 56,
    height: 56,
    borderRadius: DS.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: 4,
  },
  testBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: DS.spacing.sm,
    paddingVertical: 2,
    backgroundColor: DS.colors.feedback.amber100,
    borderRadius: DS.radius.sm,
  },
  testBadgeText: {
    fontSize: DS.typography.fontSize.xs,
    fontWeight: DS.typography.fontWeight.medium,
    color: DS.colors.semantic.warning,
  },
  infoCard: {
    flexDirection: 'row',
    gap: DS.spacing.md,
    padding: DS.spacing.md,
    backgroundColor: DS.colors.feedback.green100,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.colors.semantic.success + '30',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
    lineHeight: 20,
  },
});
