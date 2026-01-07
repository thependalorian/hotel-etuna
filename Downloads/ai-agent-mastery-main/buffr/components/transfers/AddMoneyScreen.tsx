/**
 * AddMoneyScreen Component
 * 
 * Location: components/transfers/AddMoneyScreen.tsx
 * Purpose: Screen to add money to Buffr Card or wallets
 * 
 * Based on Add Money.svg design
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

interface AddMoneyScreenProps {
  targetWallet?: string; // 'buffr' or wallet ID
  onMoneyAdded?: (amount: number, method: string) => void;
  onSelectMethod?: () => void;
}

export default function AddMoneyScreen({
  targetWallet,
  onMoneyAdded,
  onSelectMethod,
}: AddMoneyScreenProps) {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  const handleAmountSelect = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!selectedMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    onMoneyAdded?.(numAmount, selectedMethod);
  };

  return (
    <ScrollView style={defaultStyles.containerFull} contentContainerStyle={styles.content}>
      <Text style={defaultStyles.headerMedium}>
        {targetWallet ? `Add Money to ${targetWallet}` : 'Add Money'}
      </Text>
      <Text style={defaultStyles.descriptionText}>
        Fund your {targetWallet || 'Buffr Card'} wallet
      </Text>

      {/* Amount Input */}
      <View style={styles.amountSection}>
        <Text style={defaultStyles.label}>Amount</Text>
        <View style={styles.amountInputContainer}>
          <Text style={styles.currencySymbol}>N$</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={Colors.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Quick Amount Buttons */}
        <View style={styles.quickAmounts}>
          {quickAmounts.map((quickAmount) => (
            <TouchableOpacity
              key={quickAmount}
              style={[
                styles.quickAmountButton,
                amount === quickAmount.toString() && styles.quickAmountButtonActive,
              ]}
              onPress={() => handleAmountSelect(quickAmount)}
            >
              <Text
                style={[
                  styles.quickAmountText,
                  amount === quickAmount.toString() && styles.quickAmountTextActive,
                ]}
              >
                N$ {quickAmount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Payment Method Selection */}
      <View style={styles.methodSection}>
        <Text style={defaultStyles.label}>Payment Method</Text>
        {!selectedMethod ? (
          <TouchableOpacity
            style={styles.selectMethodButton}
            onPress={onSelectMethod}
          >
            <Text style={styles.selectMethodText}>Select Payment Method</Text>
            <FontAwesome name="chevron-right" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.selectedMethod}>
            <View style={styles.methodInfo}>
              <FontAwesome name="credit-card" size={24} color={Colors.primary} />
              <Text style={styles.methodName}>{selectedMethod}</Text>
            </View>
            <TouchableOpacity onPress={onSelectMethod}>
              <Text style={styles.changeMethodText}>Change</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={defaultStyles.pillButton} onPress={handleSubmit}>
        <Text style={defaultStyles.buttonText}>Add Money</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  amountSection: {
    marginTop: 32,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  methodSection: {
    marginBottom: 32,
  },
  selectMethodButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 12,
  },
  selectMethodText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  selectedMethod: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 12,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  changeMethodText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
});
