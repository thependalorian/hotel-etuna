/**
 * TransferScreen Component
 * 
 * Location: components/transfers/TransferScreen.tsx
 * Purpose: Screen to transfer money between accounts
 * 
 * Based on Transfer.svg design
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

interface TransferScreenProps {
  onTransfer?: (data: TransferData) => void;
}

interface TransferData {
  from: string;
  to: string;
  amount: number;
  note?: string;
}

export default function TransferScreen({ onTransfer }: TransferScreenProps) {
  const [amount, setAmount] = useState('');
  const [selectedFrom, setSelectedFrom] = useState<string | null>(null);
  const [selectedTo, setSelectedTo] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const accounts = [
    { id: 'buffr', name: 'Buffr Card', balance: 1234.56 },
    { id: 'wallet1', name: 'Aquarium', balance: 0 },
  ];

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!selectedFrom || !selectedTo) {
      Alert.alert('Error', 'Please select both source and destination');
      return;
    }

    if (selectedFrom === selectedTo) {
      Alert.alert('Error', 'Source and destination must be different');
      return;
    }

    onTransfer?.({
      from: selectedFrom,
      to: selectedTo,
      amount: numAmount,
      note: note.trim() || undefined,
    });
  };

  return (
    <ScrollView style={defaultStyles.containerFull} contentContainerStyle={styles.content}>
      <Text style={defaultStyles.headerMedium}>Transfer Money</Text>
      <Text style={defaultStyles.descriptionText}>
        Transfer funds between your accounts
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
      </View>

      {/* From Account */}
      <View style={styles.accountSection}>
        <Text style={defaultStyles.label}>From</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountList}>
          {accounts.map((account) => (
            <TouchableOpacity
              key={account.id}
              style={[
                styles.accountCard,
                selectedFrom === account.id && styles.accountCardSelected,
              ]}
              onPress={() => setSelectedFrom(account.id)}
            >
              <Text style={styles.accountName}>{account.name}</Text>
              <Text style={styles.accountBalance}>
                N$ {account.balance.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transfer Arrow */}
      <View style={styles.arrowContainer}>
        <FontAwesome name="arrow-down" size={24} color={Colors.primary} />
      </View>

      {/* To Account */}
      <View style={styles.accountSection}>
        <Text style={defaultStyles.label}>To</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountList}>
          {accounts.map((account) => (
            <TouchableOpacity
              key={account.id}
              style={[
                styles.accountCard,
                selectedTo === account.id && styles.accountCardSelected,
              ]}
              onPress={() => setSelectedTo(account.id)}
            >
              <Text style={styles.accountName}>{account.name}</Text>
              <Text style={styles.accountBalance}>
                N$ {account.balance.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Note (Optional) */}
      <View style={styles.noteSection}>
        <Text style={defaultStyles.label}>Note (Optional)</Text>
        <TextInput
          style={[defaultStyles.input, styles.noteInput]}
          placeholder="Add a note for this transfer"
          placeholderTextColor={Colors.textSecondary}
          value={note}
          onChangeText={setNote}
          maxLength={100}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={defaultStyles.pillButton} onPress={handleSubmit}>
        <Text style={defaultStyles.buttonText}>Transfer</Text>
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
    marginBottom: 24,
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
  accountSection: {
    marginBottom: 20,
  },
  accountList: {
    marginTop: 12,
  },
  accountCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    minWidth: 140,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  accountCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted + '20',
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  noteSection: {
    marginTop: 8,
    marginBottom: 32,
  },
  noteInput: {
    marginTop: 8,
  },
});
