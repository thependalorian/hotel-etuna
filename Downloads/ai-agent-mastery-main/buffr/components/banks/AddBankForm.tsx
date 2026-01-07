/**
 * AddBankForm Component
 * 
 * Location: components/banks/AddBankForm.tsx
 * Purpose: Form to link external bank accounts to Buffr account
 * 
 * Based on Add Card form pattern with pill-shaped inputs
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
import { useBanks, Bank } from '@/contexts/BanksContext';
import { PillButton, FormInputGroup, SectionHeader } from '@/components/common';

interface AddBankFormProps {
  onBankAdded?: (bank: Bank) => void;
  onCancel?: () => void;
}

export default function AddBankForm({ onBankAdded, onCancel }: AddBankFormProps) {
  const { addBank, loading } = useBanks();
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState<'checking' | 'savings'>('checking');
  const [branchCode, setBranchCode] = useState('');

  const formatAccountNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    return cleaned;
  };

  const handleAccountNumberChange = (text: string) => {
    setAccountNumber(formatAccountNumber(text));
  };

  const handleBranchCodeChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    setBranchCode(cleaned);
  };

  const handleSubmit = async () => {
    if (!accountNumber || !accountHolderName || !bankName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate account number length
    if (accountNumber.length < 8 || accountNumber.length > 20) {
      Alert.alert('Error', 'Please enter a valid account number');
      return;
    }

    try {
      const newBank = await addBank({
        accountNumber,
        accountHolderName,
        bankName,
        accountType,
        branchCode: branchCode || undefined,
        isDefault: false,
        isVerified: false,
        isActive: true,
      });

      Alert.alert('Success', 'Bank account added successfully', [
        {
          text: 'OK',
          onPress: () => onBankAdded?.(newBank),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add bank account');
    }
  };

  return (
    <ScrollView style={defaultStyles.container} contentContainerStyle={styles.content}>
      <Text style={defaultStyles.headerMedium}>Add Bank Account</Text>
      <Text style={defaultStyles.descriptionText}>
        Link a bank account to fund your Buffr account
      </Text>

      <View style={styles.form}>
        <FormInputGroup
          label="Bank Name"
          placeholder="Bank Windhoek"
          value={bankName}
          onChangeText={setBankName}
          autoCapitalize="words"
        />

        <FormInputGroup
          label="Account Number"
          placeholder="1234567890"
          value={accountNumber}
          onChangeText={handleAccountNumberChange}
          keyboardType="numeric"
          maxLength={20}
        />

        <FormInputGroup
          label="Account Holder Name"
          placeholder="John Doe"
          value={accountHolderName}
          onChangeText={setAccountHolderName}
          autoCapitalize="words"
        />

        <FormInputGroup
          label="Branch Code (Optional)"
          placeholder="001"
          value={branchCode}
          onChangeText={handleBranchCodeChange}
          keyboardType="numeric"
          maxLength={10}
        />

        <View style={styles.inputGroup}>
          <Text style={defaultStyles.label}>Account Type</Text>
          <View style={styles.accountTypeRow}>
            <TouchableOpacity
              style={[
                styles.accountTypeButton,
                accountType === 'checking' && styles.accountTypeButtonActive,
              ]}
              onPress={() => setAccountType('checking')}
            >
              <Text
                style={[
                  styles.accountTypeText,
                  accountType === 'checking' && styles.accountTypeTextActive,
                ]}
              >
                Checking
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.accountTypeButton,
                accountType === 'savings' && styles.accountTypeButtonActive,
              ]}
              onPress={() => setAccountType('savings')}
            >
              <Text
                style={[
                  styles.accountTypeText,
                  accountType === 'savings' && styles.accountTypeTextActive,
                ]}
              >
                Savings
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[defaultStyles.buttonOutline, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={defaultStyles.buttonOutlineText}>Cancel</Text>
          </TouchableOpacity>

          <PillButton
            label="Add Bank Account"
            variant="primary"
            onPress={handleSubmit}
            disabled={loading}
            loading={loading}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  form: {
    marginTop: 24,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
  },
  accountTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  accountTypeButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 25, // Pill-shaped
    backgroundColor: Colors.white,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    height: 50, // Fixed height for pill shape
    justifyContent: 'center',
  },
  accountTypeButtonActive: {
    backgroundColor: Colors.primaryMuted + '20',
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  accountTypeText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  accountTypeTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  pillInput: {
    height: 50, // Fixed height for pill shape
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 25, // Pill-shaped
    paddingHorizontal: 18,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.white,
  },
});
