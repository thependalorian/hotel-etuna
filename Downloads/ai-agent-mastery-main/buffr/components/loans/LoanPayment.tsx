/**
 * LoanPayment Component
 * 
 * Location: components/loans/LoanPayment.tsx
 * Purpose: Make loan payments
 * 
 * Based on Loan Payment.svg design
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';

interface LoanPaymentProps {
  loanId: string;
  outstandingBalance: number;
  minimumPayment: number;
  dueDate: string;
  onPaymentMade?: (amount: number) => void;
}

export default function LoanPayment({
  outstandingBalance,
  minimumPayment,
  dueDate,
  onPaymentMade,
}: LoanPaymentProps) {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('buffr');

  const accounts = [
    { id: 'buffr', name: 'Buffr Card', balance: 1234.56 },
    { id: 'wallet1', name: 'Aquarium', balance: 0 },
  ];

  const quickAmounts = [minimumPayment, outstandingBalance];

  const handleAmountSelect = (amount: number) => {
    setPaymentAmount(amount.toString());
  };

  const handleSubmit = () => {
    const numAmount = parseFloat(paymentAmount);
    if (!paymentAmount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (numAmount < minimumPayment) {
      Alert.alert('Error', `Minimum payment is N$ ${minimumPayment.toLocaleString()}`);
      return;
    }

    if (numAmount > outstandingBalance) {
      Alert.alert('Error', 'Payment cannot exceed outstanding balance');
      return;
    }

    const selectedAccount = accounts.find((acc) => acc.id === selectedSource);
    if (!selectedAccount || selectedAccount.balance < numAmount) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    Alert.alert(
      'Confirm Payment',
      `Pay N$ ${numAmount.toLocaleString()} towards your loan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay',
          onPress: () => onPaymentMade?.(numAmount),
        },
      ]
    );
  };

  return (
    <ScrollView style={defaultStyles.containerFull} contentContainerStyle={styles.content}>
      <Text style={defaultStyles.headerMedium}>Make Loan Payment</Text>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Outstanding Balance</Text>
        <Text style={styles.balanceAmount}>N$ {outstandingBalance.toLocaleString()}</Text>
        <Text style={styles.dueDate}>Due: {dueDate}</Text>
      </View>

      {/* Amount Input */}
      <View style={styles.amountSection}>
        <Text style={defaultStyles.label}>Payment Amount</Text>
        <View style={styles.amountInputContainer}>
          <Text style={styles.currencySymbol}>N$</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={Colors.textSecondary}
            value={paymentAmount}
            onChangeText={setPaymentAmount}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Quick Amount Buttons */}
        <View style={styles.quickAmounts}>
          <TouchableOpacity
            style={[
              styles.quickAmountButton,
              paymentAmount === minimumPayment.toString() &&
                styles.quickAmountButtonActive,
            ]}
            onPress={() => handleAmountSelect(minimumPayment)}
          >
            <Text
              style={[
                styles.quickAmountText,
                paymentAmount === minimumPayment.toString() &&
                  styles.quickAmountTextActive,
              ]}
            >
              Minimum (N$ {minimumPayment.toLocaleString()})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.quickAmountButton,
              paymentAmount === outstandingBalance.toString() &&
                styles.quickAmountButtonActive,
            ]}
            onPress={() => handleAmountSelect(outstandingBalance)}
          >
            <Text
              style={[
                styles.quickAmountText,
                paymentAmount === outstandingBalance.toString() &&
                  styles.quickAmountTextActive,
              ]}
            >
              Pay Full (N$ {outstandingBalance.toLocaleString()})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment Source */}
      <View style={styles.sourceSection}>
        <Text style={defaultStyles.label}>Pay From</Text>
        <View style={styles.accountList}>
          {accounts.map((account) => (
            <TouchableOpacity
              key={account.id}
              style={[
                styles.accountCard,
                selectedSource === account.id && styles.accountCardSelected,
              ]}
              onPress={() => setSelectedSource(account.id)}
            >
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.accountBalance}>
                  N$ {account.balance.toLocaleString()}
                </Text>
              </View>
              {selectedSource === account.id && (
                <FontAwesome name="check-circle" size={24} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={defaultStyles.pillButton} onPress={handleSubmit}>
        <Text style={defaultStyles.buttonText}>Make Payment</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 8,
  },
  dueDate: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
  },
  amountSection: {
    marginBottom: 32,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 12,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
  },
  quickAmounts: {
    gap: 12,
    marginTop: 16,
  },
  quickAmountButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: Colors.backgroundGray,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickAmountButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  quickAmountTextActive: {
    color: Colors.white,
  },
  sourceSection: {
    marginBottom: 32,
  },
  accountList: {
    gap: 12,
    marginTop: 12,
  },
  accountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  accountCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted + '20',
  },
  accountInfo: {
    flex: 1,
    gap: 4,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  accountBalance: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
