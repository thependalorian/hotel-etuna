/**
 * PayRequest Component
 * 
 * Location: components/requests/PayRequest.tsx
 * Purpose: Pay a money request from a contact
 * 
 * Based on Elias Matheus See Pay Via Request.svg design
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';

interface PayRequestProps {
  requestId: string;
  amount: number;
  requesterName: string;
  note?: string;
  onPay?: (requestId: string, amount: number) => void;
  onDecline?: (requestId: string) => void;
}

export default function PayRequest({
  requestId,
  amount,
  requesterName,
  note,
  onPay,
  onDecline,
}: PayRequestProps) {
  const [selectedSource, setSelectedSource] = useState<string>('buffr');

  const accounts = [
    { id: 'buffr', name: 'Buffr Card', balance: 1234.56 },
    { id: 'wallet1', name: 'Aquarium', balance: 0 },
  ];

  const selectedAccount = accounts.find((acc) => acc.id === selectedSource);

  const handlePay = () => {
    if (!selectedAccount || selectedAccount.balance < amount) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    Alert.alert(
      'Confirm Payment',
      `Pay N$ ${amount.toLocaleString()} to ${requesterName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay',
          onPress: () => onPay?.(requestId, amount),
        },
      ]
    );
  };

  const handleDecline = () => {
    Alert.alert('Decline Request', 'Are you sure you want to decline this request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: () => onDecline?.(requestId),
      },
    ]);
  };

  return (
    <ScrollView style={defaultStyles.containerFull} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <FontAwesome name="user-circle" size={64} color={Colors.primary} />
        <Text style={defaultStyles.headerMedium}>{requesterName}</Text>
        <Text style={styles.requestText}>is requesting</Text>
      </View>

      <View style={styles.amountSection}>
        <Text style={styles.amountLabel}>Amount</Text>
        <Text style={styles.amount}>N$ {amount.toLocaleString()}</Text>
      </View>

      {note && (
        <View style={styles.noteSection}>
          <Text style={styles.noteLabel}>Note</Text>
          <Text style={styles.noteText}>{note}</Text>
        </View>
      )}

      <View style={styles.sourceSection}>
        <Text style={defaultStyles.label}>Pay From</Text>
        <View style={styles.accountList}>
          {accounts.map((account) => (
            <TouchableOpacity
              key={account.id}
              style={[
                styles.accountCard,
                selectedSource === account.id && styles.accountCardSelected,
                account.balance < amount && styles.accountCardInsufficient,
              ]}
              onPress={() => setSelectedSource(account.id)}
              disabled={account.balance < amount}
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
              {account.balance < amount && (
                <Text style={styles.insufficientText}>Insufficient</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            defaultStyles.pillButton,
            (!selectedAccount || selectedAccount.balance < amount) &&
              styles.buttonDisabled,
          ]}
          onPress={handlePay}
          disabled={!selectedAccount || selectedAccount.balance < amount}
        >
          <Text style={defaultStyles.buttonText}>Pay Request</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={defaultStyles.buttonOutline}
          onPress={handleDecline}
        >
          <Text style={defaultStyles.buttonOutlineText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  requestText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  amount: {
    fontSize: 42,
    fontWeight: '700',
    color: Colors.text,
  },
  noteSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  noteText: {
    fontSize: 16,
    color: Colors.text,
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
  accountCardInsufficient: {
    opacity: 0.5,
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
  insufficientText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '500',
  },
  actions: {
    gap: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
