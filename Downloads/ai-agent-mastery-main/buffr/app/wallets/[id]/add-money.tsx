/**
 * Add Money to Wallet Screen
 * 
 * Location: app/wallets/[id]/add-money.tsx
 * Purpose: Add funds to a wallet
 * 
 * Based on Add Amount (Wallet).svg and Add Money.svg
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useWallets } from '@/contexts/WalletsContext';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { PayFromSelector, PaymentSource, PillButton, SectionHeader, ErrorState } from '@/components/common';

export default function AddMoneyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getWalletById, addMoneyToWallet, refreshWallets } = useWallets();

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank');

  const wallet = useMemo(() => {
    return id ? getWalletById(id) : null;
  }, [id, getWalletById]);

  useEffect(() => {
    if (id && !wallet) {
      refreshWallets();
    }
  }, [id, wallet, refreshWallets]);

  const quickAmounts = [100, 500, 1000];

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleAddMoney = async () => {
    const amountNum = parseFloat(amount);
    
    if (!amountNum || amountNum < 10) {
      Alert.alert('Error', 'Minimum amount is N$ 10');
      return;
    }
    
    if (amountNum > 50000) {
      Alert.alert('Error', 'Maximum amount is N$ 50,000');
      return;
    }

    try {
      await addMoneyToWallet(id!, amountNum, paymentMethod);
      Alert.alert('Success', `N$ ${amountNum.toLocaleString()} added to ${wallet?.name}`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add money. Please try again.');
    }
  };

  if (!wallet) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <ErrorState
          title="Wallet not found"
          message="The wallet you're looking for doesn't exist or has been deleted."
        />
      </View>
    );
  }

  const fee = 0; // No fee for now
  const total = parseFloat(amount) || 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Money to Wallet</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Amount Input */}
      <View style={styles.section}>
        <SectionHeader title="Enter Amount" />
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>{wallet.currency || 'N$'}</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={Colors.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            autoFocus
          />
        </View>

        {/* Quick Amount Buttons */}
        <View style={styles.quickAmounts}>
          {quickAmounts.map((value) => (
            <TouchableOpacity
              key={value}
              style={styles.quickAmountButton}
              onPress={() => handleQuickAmount(value)}
            >
              <Text style={styles.quickAmountText}>{wallet.currency || 'N$'} {value}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Payment Method */}
      <View style={styles.section}>
        <SectionHeader title="Payment Method" />
        <TouchableOpacity
          style={styles.paymentMethodCard}
          onPress={() => setPaymentMethod('bank')}
        >
          <View style={styles.paymentMethodContent}>
            <FontAwesome name="bank" size={24} color={Colors.primary} />
            <View style={styles.paymentMethodInfo}>
              <Text style={styles.paymentMethodName}>Bank Account</Text>
              <Text style={styles.paymentMethodDetails}>•••• 1234</Text>
            </View>
            <View style={[styles.radioButton, paymentMethod === 'bank' && styles.radioButtonActive]}>
              {paymentMethod === 'bank' && <View style={styles.radioButtonInner} />}
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.paymentMethodCard}
          onPress={() => setPaymentMethod('card')}
        >
          <View style={styles.paymentMethodContent}>
            <FontAwesome name="credit-card" size={24} color={Colors.primary} />
            <View style={styles.paymentMethodInfo}>
              <Text style={styles.paymentMethodName}>Card</Text>
              <Text style={styles.paymentMethodDetails}>•••• 5678</Text>
            </View>
            <View style={[styles.radioButton, paymentMethod === 'card' && styles.radioButtonActive]}>
              {paymentMethod === 'card' && <View style={styles.radioButtonInner} />}
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Fee:</Text>
          <Text style={styles.summaryValue}>{wallet.currency || 'N$'} {fee.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total:</Text>
          <Text style={styles.summaryTotal}>{wallet.currency || 'N$'} {total.toLocaleString()}</Text>
        </View>
      </View>

      {/* Add Money Button */}
      <PillButton
        label="Add Money"
        variant="primary"
        onPress={handleAddMoney}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  placeholder: {
    width: 44,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  paymentMethodCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  paymentMethodInfo: {
    flex: 1,
    gap: 4,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  paymentMethodDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonActive: {
    borderColor: Colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
});
