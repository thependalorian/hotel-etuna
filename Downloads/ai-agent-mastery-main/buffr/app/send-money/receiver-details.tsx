/**
 * Receiver Details Screen - Enter Amount & Payment Details
 * 
 * Location: app/send-money/receiver-details.tsx
 * Purpose: Enter payment amount, select payment source, add note, and pay
 * 
 * Based on actual design: Receiver Details screen
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';
import { ScreenHeader, ContactDetailCard, PayFromSelector, PaymentSource, NoteInputModal, PillButton } from '@/components/common';
import { useUser } from '@/contexts/UserContext';
import { useWallets } from '@/contexts/WalletsContext';
import { useCards } from '@/contexts/CardsContext';

export default function ReceiverDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    contactId?: string;
    contactName?: string;
    contactPhone?: string;
    amount?: string;
    walletId?: string;
  }>();
  
  const { user } = useUser();
  const { wallets } = useWallets();
  const { cards, getDefaultCard } = useCards();
  
  const [amount, setAmount] = useState(params.amount || '');
  
  // Update amount if provided from QR scan
  React.useEffect(() => {
    if (params.amount) {
      setAmount(params.amount);
    }
  }, [params.amount]);
  const [note, setNote] = useState('');
  const [selectedPaymentSource, setSelectedPaymentSource] = useState<PaymentSource | null>(null);
  const [showPayFromSelector, setShowPayFromSelector] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Initialize with default payment source (Buffr Account)
  React.useEffect(() => {
    if (!selectedPaymentSource && user) {
      setSelectedPaymentSource({
        id: 'buffr-account',
        name: 'Buffr Account',
        displayName: 'Buffr Account',
        type: 'buffr',
        balance: user.buffrCardBalance,
        currency: user.currency || 'N$',
      });
    }
  }, [user, selectedPaymentSource]);

  // Get payment source display info
  const getPaymentSourceDisplay = () => {
    if (!selectedPaymentSource) {
      return {
        name: 'Buffr Ac',
        icon: 'credit-card',
        balance: user?.buffrCardBalance,
      };
    }

    return {
      name: selectedPaymentSource.displayName || selectedPaymentSource.name,
      icon: selectedPaymentSource.type === 'wallet' && selectedPaymentSource.icon
        ? selectedPaymentSource.icon
        : selectedPaymentSource.type === 'card'
        ? 'credit-card'
        : selectedPaymentSource.type === 'bank'
        ? 'bank'
        : 'credit-card',
      balance: selectedPaymentSource.balance,
      last4: selectedPaymentSource.last4,
    };
  };

  const paymentSourceDisplay = getPaymentSourceDisplay();

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
    // TODO: Save to favorites
  };

  const handleSourceSelect = () => {
    setShowPayFromSelector(true);
  };

  const handlePaymentSourceSelected = (source: PaymentSource) => {
    setSelectedPaymentSource(source);
  };

  const handleAmountChange = (text: string) => {
    // Only allow numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    setAmount(cleaned);
  };

  const handlePay = () => {
    const amountNum = parseFloat(amount);
    
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Check balance based on payment source
    if (selectedPaymentSource?.balance !== undefined && amountNum > selectedPaymentSource.balance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    // TODO: Navigate to payment confirmation screen
    console.log('Pay:', {
      amount: amountNum,
      note,
      source: selectedPaymentSource,
      recipient: params.contactName,
    });
    
    Alert.alert('Success', `Payment of N$ ${amountNum} initiated`);
  };

  const quickAmounts = [100, 500, 1000];

  const contactData = {
    name: params.contactName || 'Unknown',
    phoneNumber: params.contactPhone || '',
    avatar: undefined,
  };

  return (
    <View style={defaultStyles.containerFull}>
      <ScreenHeader
        title="Receiver Details"
        showBackButton
        onBack={() => router.back()}
        rightAction={
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoriteToggle}
            activeOpacity={0.7}
          >
            <FontAwesome
              name={isFavorite ? 'heart' : 'heart-o'}
              size={20}
              color={isFavorite ? Colors.error : Colors.text}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Recipient Information */}
        <View style={styles.recipientSection}>
          <ContactDetailCard contact={contactData} avatarSize={80} />
          
          {/* Contact Details */}
          <View style={styles.contactDetails}>
            <View style={styles.contactDetailRow}>
              <Text style={styles.contactDetailLabel}>Email:</Text>
              <Text style={styles.contactDetailValue}>
                {params.contactName?.toLowerCase().replace(/\s/g, '')}@bfr
              </Text>
            </View>
            <View style={styles.contactDetailDivider} />
            <View style={styles.contactDetailRow}>
              <Text style={styles.contactDetailValue}>
                {params.contactPhone || ''}
              </Text>
            </View>
            <Text style={styles.bankingName}>
              Banking name: {params.contactName?.split(' ')[0]} Amadhila
            </Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.paymentSection}>
          {/* Pay From */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Pay from</Text>
            <TouchableOpacity
              style={styles.payFromButton}
              onPress={handleSourceSelect}
              activeOpacity={0.7}
            >
              <View style={[styles.payFromIcon, { backgroundColor: selectedPaymentSource?.color || Colors.primaryMuted }]}>
                {selectedPaymentSource?.type === 'wallet' && selectedPaymentSource?.icon ? (
                  <FontAwesome
                    name={selectedPaymentSource.icon as any}
                    size={20}
                    color={Colors.white}
                  />
                ) : selectedPaymentSource?.type === 'buffr' ? (
                  <Text style={styles.payFromIconText}>U</Text>
                ) : selectedPaymentSource?.type === 'bank' ? (
                  <Text style={styles.payFromIconText}>
                    {selectedPaymentSource.name.charAt(0)}
                  </Text>
                ) : (
                  <FontAwesome
                    name={paymentSourceDisplay.icon as any}
                    size={20}
                    color={Colors.primary}
                  />
                )}
              </View>
              <View style={styles.payFromContent}>
                <Text style={styles.payFromName}>{paymentSourceDisplay.name}</Text>
                {paymentSourceDisplay.balance !== undefined && (
                  <Text style={styles.payFromBalance}>
                    N$ {paymentSourceDisplay.balance.toLocaleString()}
                  </Text>
                )}
                {paymentSourceDisplay.last4 && (
                  <Text style={styles.payFromLast4}>•••• {paymentSourceDisplay.last4}</Text>
                )}
              </View>
              <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Pay From Selector Modal */}
          <PayFromSelector
            visible={showPayFromSelector}
            onClose={() => setShowPayFromSelector(false)}
            selectedSourceId={selectedPaymentSource?.id}
            onSelectSource={handlePaymentSourceSelected}
            title="Pay From"
            subtitle="Choose profile to make the payment from."
            onAddNew={() => {
              // Navigate to add card or add bank account
              router.push('/add-card');
            }}
          />

          {/* Note */}
          <View style={styles.fieldGroup}>
            <TouchableOpacity
              style={styles.noteButton}
              onPress={() => setShowNoteModal(true)}
              activeOpacity={0.7}
            >
              <FontAwesome name="pencil" size={16} color={Colors.primary} />
              <Text style={styles.noteButtonText}>
                {note ? note.substring(0, 30) + (note.length > 30 ? '...' : '') : 'Note'}
              </Text>
              {note && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setNote('');
                  }}
                  style={styles.clearNoteButton}
                >
                  <FontAwesome name="times-circle" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>

          {/* Note Input Modal */}
          <NoteInputModal
            visible={showNoteModal}
            onClose={() => setShowNoteModal(false)}
            onSave={(newNote) => setNote(newNote)}
            initialNote={note}
            title="Add Note"
            placeholder="Enter a note for this payment..."
            maxLength={200}
          />

          {/* Amount Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Amount</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>N$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor={Colors.textSecondary}
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="decimal-pad"
              />
              {amount.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setAmount('')}
                >
                  <FontAwesome name="times-circle" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Quick Amount Buttons */}
            <View style={styles.quickAmounts}>
              {quickAmounts.map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={styles.quickAmountButton}
                  onPress={() => setAmount(quickAmount.toString())}
                >
                  <Text style={styles.quickAmountText}>N$ {quickAmount}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.payButtonContainer}>
        <PillButton
          label="Pay"
          variant="primary"
          onPress={handlePay}
          disabled={!amount || parseFloat(amount) <= 0}
          style={styles.payButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipientSection: {
    marginBottom: 24,
  },
  contactDetails: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactDetailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  contactDetailValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  contactDetailDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  bankingName: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  paymentSection: {
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  payFromButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 25, // Pill-shaped to match wallet forms
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 50, // Fixed height for pill shape
    gap: 12,
  },
  payFromIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payFromIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  payFromContent: {
    flex: 1,
  },
  payFromName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  payFromBalance: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  payFromLast4: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  noteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 25, // Pill-shaped
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 50, // Fixed height for pill shape
    gap: 8,
    justifyContent: 'space-between',
  },
  noteButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
    flex: 1,
  },
  clearNoteButton: {
    padding: 4,
    marginLeft: 4,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 25, // Pill-shaped
    paddingHorizontal: 18,
    height: 50, // Fixed height for pill shape
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  quickAmountButton: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderRadius: 25, // Pill-shaped
    borderWidth: 1,
    borderColor: Colors.border,
    height: 50, // Fixed height for pill shape
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  payButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  payButton: {
    width: '100%',
  },
  payButtonDisabled: {
    opacity: 0.5,
  },
});
