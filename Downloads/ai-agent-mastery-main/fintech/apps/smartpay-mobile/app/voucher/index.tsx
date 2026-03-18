import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/constants/designSystem';
import { TextInput } from '@/components/ui';

export default function VoucherScreen() {
  const [voucherCode, setVoucherCode] = useState('');

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={designSystem.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Redeem Voucher</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.section}>
            <Text style={styles.description}>
              Enter your government voucher code to add funds to your SmartPay wallet.
            </Text>

            <TextInput
              label="Voucher Code"
              placeholder="Enter 12-digit code"
              value={voucherCode}
              onChangeText={setVoucherCode}
              keyboardType="number-pad"
              maxLength={12}
              clearable
            />

            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Redeem Voucher</Text>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={24} color={designSystem.colors.info} />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>How it works</Text>
                <Text style={styles.infoDescription}>
                  Government vouchers can be redeemed instantly. Funds will be added to your main wallet.
                </Text>
              </View>
            </View>
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
  description: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.textSecondary,
    marginBottom: designSystem.spacing.xl,
  },
  button: {
    height: designSystem.components?.button?.height ?? 48,
    backgroundColor: designSystem.colors.primary,
    borderRadius: designSystem.components?.button?.borderRadius ?? 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: designSystem.spacing.md,
    ...designSystem.shadows.md,
  },
  buttonText: {
    ...designSystem.typography.textStyles.body,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.md,
    marginTop: designSystem.spacing.xl,
    gap: 12,
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
});
