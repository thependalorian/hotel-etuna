/**
 * AddCardForm Component
 * 
 * Location: components/cards/AddCardForm.tsx
 * Purpose: Form to link external debit/credit cards to Buffr account
 * 
 * Based on Add Card.svg design
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
import { useCards, Card } from '@/contexts/CardsContext';
import PillButton from '@/components/common/PillButton';

interface AddCardFormProps {
  onCardAdded?: (card: Card) => void;
  onCancel?: () => void;
}

export default function AddCardForm({ onCardAdded, onCancel }: AddCardFormProps) {
  const { addCard, loading } = useCards();
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [cardType, setCardType] = useState<'debit' | 'credit'>('debit');

  const formatCardNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    // Add spaces every 4 digits
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handleCardNumberChange = (text: string) => {
    setCardNumber(formatCardNumber(text));
  };

  const handleExpiryChange = (text: string) => {
    setExpiryDate(formatExpiryDate(text));
  };

  const handleCvvChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    setCvv(cleaned);
  };

  const handleSubmit = async () => {
    if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate card number length
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanedCardNumber.length < 13 || cleanedCardNumber.length > 19) {
      Alert.alert('Error', 'Please enter a valid card number');
      return;
    }

    // Validate expiry date
    const [month, year] = expiryDate.split('/');
    if (!month || !year || parseInt(month) < 1 || parseInt(month) > 12) {
      Alert.alert('Error', 'Please enter a valid expiry date (MM/YY)');
      return;
    }

    try {
      const newCard = await addCard({
        cardNumber: cleanedCardNumber,
        expiryDate,
        cvv,
        cardholderName,
        cardType,
        isDefault: false,
        isVerified: false,
        isActive: true,
      });

      Alert.alert('Success', 'Card added successfully', [
        {
          text: 'OK',
          onPress: () => onCardAdded?.(newCard),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add card');
    }
  };

  return (
    <ScrollView style={defaultStyles.container} contentContainerStyle={styles.content}>
      <Text style={defaultStyles.headerMedium}>Add Card</Text>
      <Text style={defaultStyles.descriptionText}>
        Link a debit or credit card to fund your Buffr Card
      </Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={defaultStyles.label}>Card Number</Text>
          <TextInput
            style={[styles.pillInput, styles.cardInput]}
            placeholder="1234 5678 9012 3456"
            placeholderTextColor={Colors.textSecondary}
            value={cardNumber}
            onChangeText={handleCardNumberChange}
            keyboardType="numeric"
            maxLength={19}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={defaultStyles.label}>Expiry Date</Text>
            <TextInput
              style={[styles.pillInput, styles.expiryInput]}
              placeholder="MM/YY"
              placeholderTextColor={Colors.textSecondary}
              value={expiryDate}
              onChangeText={handleExpiryChange}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={defaultStyles.label}>CVV</Text>
            <TextInput
              style={[styles.pillInput, styles.cvvInput]}
              placeholder="123"
              placeholderTextColor={Colors.textSecondary}
              value={cvv}
              onChangeText={handleCvvChange}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={defaultStyles.label}>Cardholder Name</Text>
          <TextInput
            style={styles.pillInput}
            placeholder="John Doe"
            placeholderTextColor={Colors.textSecondary}
            value={cardholderName}
            onChangeText={setCardholderName}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={defaultStyles.label}>Card Type</Text>
          <View style={styles.cardTypeRow}>
            <TouchableOpacity
              style={[
                styles.cardTypeButton,
                cardType === 'debit' && styles.cardTypeButtonActive,
              ]}
              onPress={() => setCardType('debit')}
            >
              <Text
                style={[
                  styles.cardTypeText,
                  cardType === 'debit' && styles.cardTypeTextActive,
                ]}
              >
                Debit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.cardTypeButton,
                cardType === 'credit' && styles.cardTypeButtonActive,
              ]}
              onPress={() => setCardType('credit')}
            >
              <Text
                style={[
                  styles.cardTypeText,
                  cardType === 'credit' && styles.cardTypeTextActive,
                ]}
              >
                Credit
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
            label="Add Card"
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  cardInput: {
    fontSize: 18,
    letterSpacing: 2,
  },
  expiryInput: {
    textAlign: 'center',
  },
  cvvInput: {
    textAlign: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
  },
  cardTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardTypeButton: {
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
  cardTypeButtonActive: {
    backgroundColor: Colors.primaryMuted + '20',
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  cardTypeText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  cardTypeTextActive: {
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
