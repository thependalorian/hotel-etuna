/**
 * Cash Out Bank - Bank transfer flow
 * 
 * Features:
 * - Linked accounts list (OAuth accounts)
 * - Account selection
 * - Amount input
 * - Confirmation (includes processing time: 1-2 days)
 * - 2FA Modal
 * - Success with reference number
 * 
 * Location: app/(authenticated)/cash-out/bank.tsx
 */

import React, { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/Button';
import { AmountInput } from '@/components/shared/AmountInput';
import { TwoFAModal } from '@/components/modals/TwoFAModal';
import { designSystem as DS } from '@/constants/designSystem';
import { getWallets } from '@/services/wallets';
import { getLinkedAccounts, LinkedBankAccount } from '@/services/openBanking';
import { cashOutToBank } from '@/services/cashOut';

export default function CashOutBankScreen() {
  const [step, setStep] = useState<'select' | 'amount' | 'confirm'>('select');
  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<LinkedBankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<LinkedBankAccount | null>(null);
  const [amount, setAmount] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [show2FA, setShow2FA] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load linked bank accounts from Open Banking
      const linkedAccounts = await getLinkedAccounts();
      setBankAccounts(linkedAccounts);

      // Load wallets
      const wallets = await getWallets();
      if (wallets.length > 0) {
        setSelectedWallet(wallets[0]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = (account: LinkedBankAccount) => {
    setSelectedAccount(account);
    setStep('amount');
  };

  const handleLinkAccount = () => {
    router.push('/banking/link-bank');
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
    try {
      if (!selectedAccount || !selectedWallet) {
        throw new Error('Missing account or wallet');
      }

      const numericAmount = parseFloat(amount) / 100;

      const result = await cashOutToBank({
        walletId: selectedWallet.id,
        amount: numericAmount,
        bankAccount: selectedAccount.accountNumber,
        bankCode: selectedAccount.bankName || 'UNKNOWN',
      });

      setShow2FA(false);

      if (result.success) {
        router.replace({
          pathname: '/cash-out/success',
          params: {
            amount: numericAmount.toFixed(2),
            method: 'Bank Transfer',
            recipient: selectedAccount.bankName,
            reference: result.reference || 'N/A',
            processingTime: result.processingTime || '1-2 business days',
          },
        });
      } else {
        throw new Error(result.error || 'Transfer failed');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Verification failed');
    }
  };

  const numericAmount = parseFloat(amount) / 100;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <AppHeader
          title="Bank Transfer"
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DS.colors.brand.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppHeader
        title="Bank Transfer"
        showBackButton
        onBackPress={() => router.back()}
      />

      {step === 'select' && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Select Bank Account</Text>

          {bankAccounts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={64} color={DS.colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Linked Accounts</Text>
              <Text style={styles.emptyDescription}>
                Link your bank account to transfer funds
              </Text>
              <View style={styles.emptyButton}>
                <Button
                  title="Link Bank Account"
                  onPress={handleLinkAccount}
                  icon="add"
                />
              </View>
            </View>
          ) : (
            <>
              <View style={styles.accountsList}>
                {bankAccounts.map((account) => (
                  <BankAccountCard
                    key={account.id}
                    account={account}
                    onPress={() => handleAccountSelect(account)}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={styles.linkAccountButton}
                onPress={handleLinkAccount}
                accessibilityLabel="Link another bank account"
              >
                <Ionicons name="add-circle-outline" size={24} color={DS.colors.brand.primary} />
                <Text style={styles.linkAccountText}>Link Another Account</Text>
              </TouchableOpacity>
            </>
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
            <Ionicons name="business" size={24} color={DS.colors.brand.primary} />
            <View style={styles.recipientInfo}>
              <Text style={styles.recipientLabel}>Transfer to</Text>
              <Text style={styles.recipientName}>{selectedAccount?.bankName}</Text>
              <Text style={styles.recipientSubtext}>
                {selectedAccount?.accountType} • {selectedAccount?.accountNumber}
              </Text>
            </View>
          </View>

          <AmountInput
            amount={amount}
            onAmountChange={setAmount}
            maxAmount={selectedWallet?.balance || 0}
          />

          <View style={styles.processingNotice}>
            <Ionicons name="time-outline" size={20} color={DS.colors.brand.primary} />
            <Text style={styles.processingNoticeText}>
              Processing time: 1-2 business days
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
            <Text style={styles.confirmTitle}>Confirm Transfer</Text>
            
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>To</Text>
              <View style={styles.confirmAccountInfo}>
                <Text style={styles.confirmValue}>{selectedAccount?.bankName}</Text>
                <Text style={styles.confirmSubValue}>{selectedAccount?.accountNumber}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Amount</Text>
              <Text style={styles.confirmValue}>N$ {numericAmount.toFixed(2)}</Text>
            </View>

            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Fee</Text>
              <Text style={styles.confirmValue}>N$ 0.00</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabelBold}>Total</Text>
              <Text style={styles.confirmValueBold}>N$ {numericAmount.toFixed(2)}</Text>
            </View>

            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>From</Text>
              <Text style={styles.confirmValue}>{selectedWallet?.name}</Text>
            </View>

            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Processing Time</Text>
              <Text style={styles.confirmValue}>1-2 business days</Text>
            </View>
          </View>

          <View style={styles.bottomButton}>
            <Button
              title="Confirm Transfer"
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
          amount: numericAmount,
          recipient: selectedAccount?.bankName || '',
        }}
        allowBiometric
      />
    </SafeAreaView>
  );
}

interface BankAccountCardProps {
  account: LinkedBankAccount;
  onPress: () => void;
}

function BankAccountCard({ account, onPress }: BankAccountCardProps) {
  return (
    <TouchableOpacity
      style={styles.accountCard}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`${account.bankName}, ${account.accountType} account ending in ${account.accountNumber}`}
      accessibilityRole="button"
    >
      <View style={styles.accountIcon}>
        <Ionicons name="business" size={24} color={DS.colors.brand.primary} />
      </View>
      <View style={styles.accountInfo}>
        <Text style={styles.accountName}>{account.bankName}</Text>
        <Text style={styles.accountDetails}>
          {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} • {account.accountNumber}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={DS.colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.lg,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: DS.typography.fontSize.lg,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: DS.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: DS.spacing.xxl,
  },
  emptyTitle: {
    fontSize: DS.typography.fontSize['2xl'],
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginTop: DS.spacing.md,
    marginBottom: DS.spacing.sm,
  },
  emptyDescription: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.textSecondary,
    textAlign: 'center',
    marginBottom: DS.spacing.lg,
  },
  emptyButton: {
    width: '100%',
  },
  accountsList: {
    gap: DS.spacing.sm,
    marginBottom: DS.spacing.lg,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.md,
    padding: DS.spacing.md,
    backgroundColor: DS.colors.background,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: DS.colors.border,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.brand.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.text,
    marginBottom: 2,
  },
  accountDetails: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
  },
  linkAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DS.spacing.sm,
    padding: DS.spacing.md,
    borderRadius: DS.radius.lg,
    borderWidth: 2,
    borderColor: DS.colors.brand.primary,
    borderStyle: 'dashed',
  },
  linkAccountText: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.semibold,
    color: DS.colors.brand.primary,
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
    marginBottom: 2,
  },
  recipientSubtext: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
  },
  processingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.sm,
    padding: DS.spacing.md,
    backgroundColor: DS.colors.brand.primaryMuted,
    borderRadius: DS.radius.md,
    marginTop: DS.spacing.md,
  },
  processingNoticeText: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.brand.primary,
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
    alignItems: 'flex-start',
  },
  confirmLabel: {
    fontSize: DS.typography.fontSize.base,
    color: DS.colors.textSecondary,
  },
  confirmAccountInfo: {
    alignItems: 'flex-end',
  },
  confirmValue: {
    fontSize: DS.typography.fontSize.base,
    fontWeight: DS.typography.fontWeight.medium,
    color: DS.colors.text,
  },
  confirmSubValue: {
    fontSize: DS.typography.fontSize.sm,
    color: DS.colors.textSecondary,
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
