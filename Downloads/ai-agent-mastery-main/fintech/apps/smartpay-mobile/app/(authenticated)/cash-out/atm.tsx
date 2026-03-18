/**
 * Cash Out ATM - ATM withdrawal flow
 * 
 * Features:
 * - Scan ATM QR or enter ATM code
 * - Amount selection
 * - Confirmation (includes N$10 fee)
 * - 2FA Modal
 * - Show ATM code for collection
 * 
 * Location: app/(authenticated)/cash-out/atm.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { AmountInput } from '@/components/shared/AmountInput';
import { TwoFAModal } from '@/components/modals/TwoFAModal';
import { designSystem as DS } from '@/constants/designSystem';
import { getWallets } from '@/services/wallets';

const ATM_FEE = 10;

export default function CashOutATMScreen() {
  const [step, setStep] = useState<'input' | 'amount' | 'confirm'>('input');
  const [inputMethod, setInputMethod] = useState<'scan' | 'code'>('scan');
  const [atmCode, setAtmCode] = useState('');
  const [atmData, setAtmData] = useState<{ name: string; id: string } | null>(null);
  const [amount, setAmount] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [show2FA, setShow2FA] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const wallets = await getWallets();
      if (wallets.length > 0) {
        setSelectedWallet(wallets[0]);
      }
    } catch (error) {
      console.error('Failed to load wallets:', error);
    }
  };

  const handleScanQR = () => {
    // Simulate QR scan
    const mockData = {
      name: 'ATM #' + Math.floor(Math.random() * 1000),
      id: `atm-${Date.now()}`,
    };
    setAtmData(mockData);
    setStep('amount');
  };

  const handleCodeSubmit = () => {
    if (!atmCode.trim()) {
      Alert.alert('Required', 'Please enter an ATM code');
      return;
    }
    const mockData = {
      name: `ATM #${atmCode}`,
      id: `atm-${atmCode}`,
    };
    setAtmData(mockData);
    setStep('amount');
  };

  const handleContinueToConfirm = () => {
    const numericAmount = parseFloat(amount) / 100;
    if (numericAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    const total = numericAmount + ATM_FEE;
    if (!selectedWallet || total > selectedWallet.balance) {
      Alert.alert('Insufficient Funds', 'You do not have enough balance including the N$10 ATM fee');
      return;
    }
    setStep('confirm');
  };

  const handleConfirm = () => {
    setShow2FA(true);
  };

  const handleVerify = async (pin: string) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setShow2FA(false);
      const collectionCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      router.replace({
        pathname: '/cash-out/success',
        params: {
          amount: (parseFloat(amount) / 100).toFixed(2),
          method: 'ATM Withdrawal',
          recipient: atmData?.name || '',
          code: collectionCode,
        },
      });
    } catch (error) {
      throw new Error('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const numericAmount = parseFloat(amount) / 100;
  const total = numericAmount + ATM_FEE;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader
        title="Cash Out at ATM"
        showBackButton
        onBackPress={() => router.back()}
      />

      {step === 'input' && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.methodSelector}>
            <TouchableOpacity
              style={[styles.methodTab, inputMethod === 'scan' && styles.methodTabActive]}
              onPress={() => setInputMethod('scan')}
              accessibilityLabel="Scan QR"
              accessibilityRole="tab"
            >
              <Text style={[
                styles.methodTabText,
                inputMethod === 'scan' && styles.methodTabTextActive,
              ]}>
                Scan QR
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.methodTab, inputMethod === 'code' && styles.methodTabActive]}
              onPress={() => setInputMethod('code')}
              accessibilityLabel="Enter Code"
              accessibilityRole="tab"
            >
              <Text style={[
                styles.methodTabText,
                inputMethod === 'code' && styles.methodTabTextActive,
              ]}>
                Enter Code
              </Text>
            </TouchableOpacity>
          </View>

          {inputMethod === 'scan' ? (
            <View style={styles.scanContent}>
              <View style={styles.instructionsCard}>
                <View style={styles.qrIconCircle}>
                  <Ionicons name="qr-code-outline" size={48} color={DS.colors.brand.primary} />
                </View>
                <Text style={styles.instructionsTitle}>Scan ATM QR Code</Text>
                <Text style={styles.instructionsText}>
                  Scan the QR code displayed on the ATM screen
                </Text>
              </View>

              <Button
                title="Scan QR Code"
                onPress={handleScanQR}
                icon="scan-outline"
              />
            </View>
          ) : (
            <View style={styles.codeContent}>
              <Text style={styles.label}>Enter ATM Code</Text>
              <Text style={styles.hint}>
                Enter the code displayed on the ATM screen
              </Text>
              <TextInput
                style={styles.codeInput}
                placeholder="ATM-XXXX"
                placeholderTextColor={DS.colors.textPlaceholder}
                value={atmCode}
                onChangeText={setAtmCode}
                autoCapitalize="characters"
                maxLength={8}
                accessibilityLabel="ATM code"
              />
              <Button
                title="Continue"
                onPress={handleCodeSubmit}
                disabled={!atmCode.trim()}
              />
            </View>
          )}
        </ScrollView>
      )}

      {step === 'amount' && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.recipientCard}>
            <Ionicons name="card" size={24} color={DS.colors.brand.primary} />
            <View style={styles.recipientInfo}>
              <Text style={styles.recipientLabel}>Withdraw from</Text>
              <Text style={styles.recipientName}>{atmData?.name}</Text>
            </View>
          </View>

          <AmountInput
            amount={amount}
            onAmountChange={setAmount}
            maxAmount={selectedWallet ? selectedWallet.balance - ATM_FEE : 0}
          />

          <View style={styles.feeNotice}>
            <Ionicons name="information-circle-outline" size={20} color={DS.colors.warning} />
            <Text style={styles.feeNoticeText}>
              N${ATM_FEE.toFixed(2)} ATM fee will be added
            </Text>
          </View>

          {selectedWallet && (
            <View style={styles.walletInfo}>
              <Text style={styles.walletLabel}>From</Text>
              <Text style={styles.walletName}>
                {selectedWallet.name} (N${selectedWallet.balance.toFixed(2)})
              </Text>
            </View>
          )}

          <View style={styles.bottomButton}>
            <Button
              title="Continue"
              onPress={handleContinueToConfirm}
              disabled={!amount || parseFloat(amount) === 0}
            />
          </View>
        </ScrollView>
      )}

      {step === 'confirm' && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Confirm ATM Withdrawal</Text>
            
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>ATM</Text>
              <Text style={styles.confirmValue}>{atmData?.name}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Amount</Text>
              <Text style={styles.confirmValue}>N$ {numericAmount.toFixed(2)}</Text>
            </View>

            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>ATM Fee</Text>
              <Text style={styles.confirmValue}>N$ {ATM_FEE.toFixed(2)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabelBold}>Total</Text>
              <Text style={styles.confirmValueBold}>N$ {total.toFixed(2)}</Text>
            </View>

            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>From</Text>
              <Text style={styles.confirmValue}>{selectedWallet?.name}</Text>
            </View>
          </View>

          <View style={styles.bottomButton}>
            <Button
              title="Confirm Withdrawal"
              onPress={handleConfirm}
            />
          </View>
        </ScrollView>
      )}

      <TwoFAModal
        visible={show2FA}
        onClose={() => setShow2FA(false)}
        onVerify={handleVerify}
        transaction={{
          amount: total,
          recipient: atmData?.name || '',
        }}
        allowBiometric
      />
    </SafeAreaView>
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
    paddingBottom: 100,
  },
  methodSelector: {
    flexDirection: 'row',
    gap: DS.spacing.sm,
    marginBottom: DS.spacing.lg,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.md,
    padding: 4,
  },
  methodTab: {
    flex: 1,
    paddingVertical: DS.spacing.sm,
    alignItems: 'center',
    borderRadius: DS.radius.sm,
  },
  methodTabActive: {
    backgroundColor: DS.colors.background,
  },
  methodTabText: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.medium,
    color: DS.colors.textSecondary,
  },
  methodTabTextActive: {
    color: DS.colors.text,
  },
  scanContent: {
    gap: DS.spacing.xl,
  },
  instructionsCard: {
    alignItems: 'center',
    paddingVertical: DS.spacing.xl,
  },
  qrIconCircle: {
    width: 96,
    height: 96,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.brand.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DS.spacing.lg,
  },
  instructionsTitle: {
    fontSize: DS.typography.fontSize['2xl'],
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: DS.spacing.sm,
  },
  instructionsText: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: DS.spacing.lg,
  },
  codeContent: {
    gap: DS.spacing.md,
  },
  label: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
  },
  hint: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
    marginTop: -DS.spacing.sm,
  },
  codeInput: {
    height: DS.components.input.height,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.colors.border,
    paddingHorizontal: DS.spacing.md,
    fontSize: DS.typography.fontSize.lg,
    color: DS.colors.text,
    backgroundColor: DS.colors.background,
    fontWeight: DS.typography.fontWeight.semibold,
    textAlign: 'center',
  },
  recipientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.md,
    padding: DS.spacing.md,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.md,
    marginBottom: DS.spacing.lg,
  },
  recipientInfo: {
    flex: 1,
  },
  recipientLabel: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
    marginBottom: 2,
  },
  recipientName: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
  },
  feeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    padding: DS.spacing.md,
    backgroundColor: DS.colors.feedback.amber100,
    borderRadius: DS.radius.md,
    marginTop: DS.spacing.md,
  },
  feeNoticeText: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.warning,
    fontWeight: DS.typography.fontWeight.medium,
    flex: 1,
  },
  walletInfo: {
    marginTop: DS.spacing.md,
    padding: DS.spacing.md,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.md,
  },
  walletLabel: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
    marginBottom: 4,
  },
  walletName: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.medium,
    color: DS.colors.text,
  },
  confirmCard: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    padding: DS.spacing.lg,
    gap: DS.spacing.md,
  },
  confirmTitle: {
    fontSize: DS.typography.fontSize.xl,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: DS.spacing.sm,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmLabel: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.textSecondary,
  },
  confirmValue: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.medium,
    color: DS.colors.text,
  },
  confirmLabelBold: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
  },
  confirmValueBold: {
    fontSize: DS.typography.fontSize.xl,
    fontWeight: DS.typography.fontWeight.bold,
    color: DS.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: DS.colors.border,
  },
  bottomButton: {
    marginTop: DS.spacing.xl,
  },
});
