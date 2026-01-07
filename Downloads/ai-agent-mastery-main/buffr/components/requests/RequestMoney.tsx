/**
 * RequestMoney Component
 * 
 * Location: components/requests/RequestMoney.tsx
 * Purpose: Request money from contacts
 * 
 * Based on After Making Request.svg design
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

interface RequestMoneyProps {
  onRequestSent?: (data: RequestData) => void;
}

interface RequestData {
  amount: number;
  recipientId: string;
  recipientName: string;
  note?: string;
}

export default function RequestMoney({ onRequestSent }: RequestMoneyProps) {
  const [amount, setAmount] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [note, setNote] = useState('');

  // Mock contacts - replace with actual data
  const contacts = [
    { id: '1', name: 'John Doe', phone: '+264 81 123 4567' },
    { id: '2', name: 'Jane Smith', phone: '+264 81 234 5678' },
  ];

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!selectedRecipient) {
      Alert.alert('Error', 'Please select a recipient');
      return;
    }

    const recipient = contacts.find((c) => c.id === selectedRecipient);
    if (!recipient) return;

    onRequestSent?.({
      amount: numAmount,
      recipientId: selectedRecipient,
      recipientName: recipient.name,
      note: note.trim() || undefined,
    });
  };

  return (
    <ScrollView style={defaultStyles.containerFull} contentContainerStyle={styles.content}>
      <Text style={defaultStyles.headerMedium}>Request Money</Text>
      <Text style={defaultStyles.descriptionText}>
        Request payment from a contact
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

      {/* Recipient Selection */}
      <View style={styles.recipientSection}>
        <Text style={defaultStyles.label}>Request From</Text>
        <ScrollView style={styles.contactsList}>
          {contacts.map((contact) => (
            <TouchableOpacity
              key={contact.id}
              style={[
                styles.contactItem,
                selectedRecipient === contact.id && styles.contactItemSelected,
              ]}
              onPress={() => setSelectedRecipient(contact.id)}
            >
              <View style={styles.contactAvatar}>
                <FontAwesome name="user" size={20} color={Colors.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>
              {selectedRecipient === contact.id && (
                <FontAwesome name="check-circle" size={24} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Note (Optional) */}
      <View style={styles.noteSection}>
        <Text style={defaultStyles.label}>Note (Optional)</Text>
        <TextInput
          style={[defaultStyles.input, styles.noteInput]}
          placeholder="Add a note for this request"
          placeholderTextColor={Colors.textSecondary}
          value={note}
          onChangeText={setNote}
          maxLength={100}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={defaultStyles.pillButton} onPress={handleSubmit}>
        <Text style={defaultStyles.buttonText}>Send Request</Text>
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
  recipientSection: {
    marginBottom: 24,
  },
  contactsList: {
    maxHeight: 200,
    marginTop: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 12,
  },
  contactItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted + '20',
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
    gap: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  contactPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  noteSection: {
    marginBottom: 32,
  },
  noteInput: {
    marginTop: 8,
  },
});
