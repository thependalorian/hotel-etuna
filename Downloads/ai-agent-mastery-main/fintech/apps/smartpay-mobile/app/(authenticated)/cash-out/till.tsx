/**
 * Cash Out Till/Agent/Merchant - QR scan flow
 * 
 * Figma Spec: Till/Agent/Merchant flow (same pattern)
 * Features:
 * - Instructions: "Scan the agent's/till's NAMQR code"
 * - "Scan QR" button → Opens QR scanner
 * - After scan:
 *   - Display agent/till name
 *   - Amount selection
 *   - Confirmation
 *   - 2FA Modal
 *   - Success screen
 * 
 * Location: app/(authenticated)/cash-out/till.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { AmountInput } from '@/components/shared/AmountInput';
import { TwoFAModal } from '@/components/modals/TwoFAModal';
import { designSystem as DS } from '@/constants/designSystem';
import { getWallets } from '@/services/wallets';

type CashOutType = 'till' | 'agent' | 'merchant';

export default function CashOutTillScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const type = (params.type as CashOutType) || 'till';
  
  const [step, setStep] = useState<'scan' | 'amount' | 'confirm'>('scan');
  const [scannedData, setScannedData] = useState<{ name: string; id: string } | null>(null);
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

  const getTitle = () => {
    switch (type) {
      case 'agent':
        return 'Cash Out at Agent';
      case 'merchant':
        return 'Cash Out at Merchant';
      default:
        return 'Cash Out at Till';
    }
  };

  const getInstructions = () => {
    switch (type) {
      case 'agent':
        return "Scan the agent's NAMQR code to proceed";
      case 'merchant':
        return "Scan the merchant's NAMQR code to proceed";
      default:
        return "Scan the till's NAMQR code to proceed";
    }
  };

  const getFee = () => {
    switch (type) {
      case 'agent':
        return 5;
      case 'merchant':
        return 0;
      default:
        return 0;
    }
  };

  const handleScanQR = () => {
    // Simulate QR scan - in real app, this would open camera
    const mockData = {
      name: type === 'agent' ? 'Agent John Doe' : type === 'merchant' ? 'Shop ABC' : 'Till #123',
      id: `${type}-${Date.now()}`,
    };
    setScannedData(mockData);
    setStep('amount');
  };

  const handleContinueToConfirm = () => {
    const numericAmount = parseFloat(amount) / 100;
    if (numericAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    if (!selectedWallet || numericAmount > selectedWallet.balance) {
      Alert.alert('Insufficient Funds', 'You do not have enough balance');
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setShow2FA(false);
      router.replace({
        pathname: '/cash-out/success',
        params: {
          amount: (parseFloat(amount) / 100).toFixed(2),
          method: getTitle(),
          recipient: scannedData?.name || '',
        },
      });
    } catch (error) {
      throw new Error('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const numericAmount = parseFloat(amount) / 100;
  const fee = getFee();
  const total = numericAmount + fee;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader
        title={getTitle()}
        showBackButton
        onBackPress={() => router.back()}
      />

      {step === 'scan' && (
        <View style={styles.scanStep}>
          <View style={styles.instructionsCard}>
            <View style={styles.qrIconCircle}>
              <Ionicons name="qr-code-outline" size={48} color={DS.colors.brand.primary} />
            </View>
            <Text style={styles.instructionsTitle}>Scan QR Code</Text>
            <Text style={styles.instructionsText}>{getInstructions()}</Text>
          </View>

          <View style={styles.scanButtonContainer}>
            <Button
              title="Scan QR Code"
              onPress={handleScanQR}
              icon="scan-outline"
            />
          </View>
        </View>
      )}

      {step === 'amount' && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.recipientCard}>
            <Ionicons
              name={type === 'agent' ? 'person' : type === 'merchant' ? 'business' : 'storefront'}
              size={24}
              color={DS.colors.brand.primary}
            />
            <View style={styles.recipientInfo}>
              <Text style={styles.recipientLabel}>Cash out at</Text>
              <Text style={styles.recipientName}>{scannedData?.name}</Text>
            </View>
          </View>

          <AmountInput
            amount={amount}
            onAmountChange={setAmount}
            maxAmount={selectedWallet?.balance || 0}
          />

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
            <Text style={styles.confirmTitle}>Confirm Cash Out</Text>
            
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>To</Text>
              <Text style={styles.confirmValue}>{scannedData?.name}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Amount</Text>
              <Text style={styles.confirmValue}>N$ {numericAmount.toFixed(2)}</Text>
            </View>

            {fee > 0 && (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Fee</Text>
                <Text style={styles.confirmValue}>N$ {fee.toFixed(2)}</Text>
              </View>
            )}

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
              title="Confirm Cash Out"
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
          recipient: scannedData?.name || '',
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
  scanStep: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.xl,
  },
  instructionsCard: {
    alignItems: 'center',
    paddingVertical: DS.spacing.xxl,
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
  scanButtonContainer: {
    marginBottom: DS.spacing.md,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.lg,
    paddingBottom: 100,
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
  walletInfo: {
    marginTop: DS.spacing.lg,
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
