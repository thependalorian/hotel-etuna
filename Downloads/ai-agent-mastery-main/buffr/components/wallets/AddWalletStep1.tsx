/**
 * Add Wallet Step 1 Component
 * 
 * Location: components/wallets/AddWalletStep1.tsx
 * Purpose: First step of wallet creation - Icon, Name, and Auto Pay setup
 * 
 * Based on Add Wallet design with icon selection, name input, and conditional autopay fields
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';

// Popular emoji icons for wallets
const WALLET_ICONS = [
  '🐟', '💰', '💳', '🏦', '💵', '💸', '🎯', '🎁',
  '✈️', '🏠', '🚗', '📚', '💎', '🎨', '🍔', '☕',
  '🎮', '🎵', '🏋️', '🌴', '🎪', '🎬', '📱', '💻',
  '🎓', '🏥', '🛍️', '🍕', '🎂', '🌮', '🍰', '🎈',
];

interface AutoPaySettings {
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  deductDate: string; // Format: DD-MMM-YYYY
  deductTime: string; // Format: HH:MMam/pm
  amount: number;
  numberOfRepayments: number | null;
  paymentMethod: string;
}

interface AddWalletStep1Props {
  onNext: (data: {
    icon: string;
    name: string;
    autoPayEnabled: boolean;
    autoPaySettings?: AutoPaySettings;
  }) => void;
  onCancel: () => void;
}

export default function AddWalletStep1({ onNext, onCancel }: AddWalletStep1Props) {
  const [selectedIcon, setSelectedIcon] = useState('🐟');
  const [walletName, setWalletName] = useState('');
  const [autoPayEnabled, setAutoPayEnabled] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  // Auto Pay settings
  const [frequency, setFrequency] = useState<'weekly' | 'bi-weekly' | 'monthly'>('monthly');
  const [deductDate, setDeductDate] = useState('17-Sep-2023');
  const [deductTime, setDeductTime] = useState('8:00pm');
  const [amount, setAmount] = useState('1000');
  const [showRepaymentsPicker, setShowRepaymentsPicker] = useState(false);
  const [numberOfRepayments, setNumberOfRepayments] = useState<number | null>(null);
  const [showPaymentMethodPicker, setShowPaymentMethodPicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Nedbank X293');

  // Repayment options
  const repaymentOptions = [
    { label: '3 months', value: 3 },
    { label: '6 months', value: 6 },
    { label: '12 months', value: 12 },
    { label: '24 months', value: 24 },
    { label: '36 months', value: 36 },
    { label: 'Indefinite', value: null },
  ];

  // Payment method options (mock data)
  const paymentMethods = [
    'Nedbank X293',
    'FNB Account',
    'Standard Bank',
    'Capitec',
    'Visa Card ****1234',
    'Mastercard ****5678',
  ];

  const handleNext = () => {
    if (!walletName.trim()) {
      return;
    }

    const step1Data = {
      icon: selectedIcon,
      name: walletName.trim(),
      autoPayEnabled,
      autoPaySettings: autoPayEnabled ? {
        frequency,
        deductDate,
        deductTime,
        amount: parseFloat(amount.replace(/[^0-9.]/g, '')) || 0,
        numberOfRepayments,
        paymentMethod,
      } : undefined,
    };

    onNext(step1Data);
  };

  const formatAmount = (value: string) => {
    // Remove all non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    if (!numericValue) return '';
    // Format with N$ prefix and thousand separators
    const number = parseFloat(numericValue);
    if (isNaN(number)) return '';
    return `N$${number.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const handleAmountChange = (text: string) => {
    // Remove N$ and commas for storage
    const numericValue = text.replace(/[^0-9.]/g, '');
    setAmount(numericValue);
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onCancel}>
          <FontAwesome name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Wallet</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Icon Selection */}
      <View style={styles.iconSection}>
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => setShowIconPicker(true)}
        >
          <Text style={styles.iconEmoji}>{selectedIcon}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.setIconButton}
          onPress={() => setShowIconPicker(true)}
        >
          <Text style={styles.setIconText}>Set Icon</Text>
        </TouchableOpacity>
      </View>

      {/* Wallet Name */}
      <View style={styles.inputGroup}>
        <Text style={defaultStyles.label}>Wallet Name</Text>
        <TextInput
          style={defaultStyles.input}
          placeholder="e.g., Aquarium"
          placeholderTextColor={Colors.textSecondary}
          value={walletName}
          onChangeText={setWalletName}
          autoCapitalize="words"
          maxLength={30}
        />
      </View>

      {/* Auto Pay Section */}
      <View style={styles.autoPaySection}>
        <View style={styles.autoPayHeader}>
          <View style={styles.autoPayHeaderLeft}>
            <Text style={styles.autoPayTitle}>Auto Pay</Text>
            <Text style={styles.autoPayDescription}>
              Fluffy servant sirius the quaffle sight.
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggle,
              autoPayEnabled && styles.toggleActive,
            ]}
            onPress={() => setAutoPayEnabled(!autoPayEnabled)}
          >
            <View
              style={[
                styles.toggleThumb,
                autoPayEnabled && styles.toggleThumbActive,
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* Auto Pay Fields - Only show when toggle is ON */}
        {autoPayEnabled && (
          <View style={styles.autoPayFields}>
            {/* Frequency Selection */}
            <View style={styles.inputGroup}>
              <Text style={defaultStyles.label}>Frequency</Text>
              <View style={styles.frequencyButtons}>
                {(['weekly', 'bi-weekly', 'monthly'] as const).map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.frequencyButton,
                      frequency === freq && styles.frequencyButtonActive,
                    ]}
                    onPress={() => setFrequency(freq)}
                  >
                    <Text
                      style={[
                        styles.frequencyButtonText,
                        frequency === freq && styles.frequencyButtonTextActive,
                      ]}
                    >
                      {freq === 'bi-weekly' ? 'Bi-weekly' : freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Deduct On - Date and Time */}
            <View style={styles.inputGroup}>
              <Text style={defaultStyles.label}>Deduct On</Text>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity style={[defaultStyles.input, styles.dateInput]}>
                  <Text style={styles.dateTimeText}>{deductDate}</Text>
                  <FontAwesome name="calendar" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={[defaultStyles.input, styles.timeInput]}>
                  <Text style={styles.dateTimeText}>{deductTime}</Text>
                  <FontAwesome name="clock-o" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={defaultStyles.label}>Amount</Text>
              <TextInput
                style={defaultStyles.input}
                placeholder="N$ 0"
                placeholderTextColor={Colors.textSecondary}
                value={formatAmount(amount)}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
              />
            </View>

            {/* Number of Repayments */}
            <View style={styles.inputGroup}>
              <Text style={defaultStyles.label}>Select Number Of Repayments</Text>
              <TouchableOpacity
                style={defaultStyles.input}
                onPress={() => setShowRepaymentsPicker(true)}
              >
                <Text style={[
                  styles.pickerText,
                  !numberOfRepayments && styles.pickerPlaceholder,
                ]}>
                  {numberOfRepayments
                    ? repaymentOptions.find(opt => opt.value === numberOfRepayments)?.label || `${numberOfRepayments} months`
                    : 'Select'}
                </Text>
                <FontAwesome name="chevron-down" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Payment Method */}
            <View style={styles.inputGroup}>
              <Text style={defaultStyles.label}>Payment Method</Text>
              <TouchableOpacity
                style={styles.paymentMethodButton}
                onPress={() => setShowPaymentMethodPicker(true)}
              >
                <View style={styles.paymentMethodContent}>
                  <View style={styles.paymentMethodIcon}>
                    <Text style={styles.paymentMethodIconText}>N</Text>
                  </View>
                  <Text style={styles.paymentMethodText}>{paymentMethod}</Text>
                </View>
                <FontAwesome name="chevron-right" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[
          styles.saveButton,
          !walletName.trim() && styles.saveButtonDisabled,
        ]}
        onPress={handleNext}
        disabled={!walletName.trim()}
      >
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>

      {/* Icon Picker Modal */}
      <Modal
        visible={showIconPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowIconPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Icon</Text>
              <TouchableOpacity
                onPress={() => setShowIconPicker(false)}
                style={styles.closeButton}
              >
                <FontAwesome name="times" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={WALLET_ICONS}
              numColumns={4}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.iconOption,
                    selectedIcon === item && styles.iconOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedIcon(item);
                    setShowIconPicker(false);
                  }}
                >
                  <Text style={styles.iconOptionEmoji}>{item}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.iconsList}
            />
          </View>
        </View>
      </Modal>

      {/* Repayments Picker Modal */}
      <Modal
        visible={showRepaymentsPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRepaymentsPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Number of Repayments</Text>
              <TouchableOpacity
                onPress={() => setShowRepaymentsPicker(false)}
                style={styles.closeButton}
              >
                <FontAwesome name="times" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={repaymentOptions}
              keyExtractor={(item) => item.value?.toString() || 'indefinite'}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    numberOfRepayments === item.value && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    setNumberOfRepayments(item.value);
                    setShowRepaymentsPicker(false);
                  }}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    numberOfRepayments === item.value && styles.pickerOptionTextSelected,
                  ]}>
                    {item.label}
                  </Text>
                  {numberOfRepayments === item.value && (
                    <FontAwesome name="check" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Payment Method Picker Modal */}
      <Modal
        visible={showPaymentMethodPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentMethodPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Method</Text>
              <TouchableOpacity
                onPress={() => setShowPaymentMethodPicker(false)}
                style={styles.closeButton}
              >
                <FontAwesome name="times" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={paymentMethods}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    paymentMethod === item && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    setPaymentMethod(item);
                    setShowPaymentMethodPicker(false);
                  }}
                >
                  <View style={styles.paymentMethodContent}>
                    <View style={styles.paymentMethodIcon}>
                      <Text style={styles.paymentMethodIconText}>
                        {item.charAt(0)}
                      </Text>
                    </View>
                    <Text style={[
                      styles.pickerOptionText,
                      paymentMethod === item && styles.pickerOptionTextSelected,
                    ]}>
                      {item}
                    </Text>
                  </View>
                  {paymentMethod === item && (
                    <FontAwesome name="check" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.white,
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  iconSection: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconEmoji: {
    fontSize: 60,
  },
  setIconButton: {
    paddingVertical: 8,
  },
  setIconText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
  inputGroup: {
    marginBottom: 24,
    gap: 8,
  },
  autoPaySection: {
    marginTop: 8,
    marginBottom: 24,
  },
  autoPayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  autoPayHeaderLeft: {
    flex: 1,
    marginRight: 16,
  },
  autoPayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  autoPayDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: Colors.success,
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  autoPayFields: {
    marginTop: 16,
    gap: 20,
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  frequencyButtonTextActive: {
    color: Colors.white,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  dateInput: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInput: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 16,
    color: Colors.text,
  },
  pickerText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  pickerPlaceholder: {
    color: Colors.textSecondary,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.dark + '80',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconsList: {
    padding: 16,
    gap: 16,
  },
  iconOption: {
    flex: 1,
    aspectRatio: 1,
    margin: 8,
    borderRadius: 16,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted + '40',
  },
  iconOptionEmoji: {
    fontSize: 40,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerOptionSelected: {
    backgroundColor: Colors.primaryMuted + '20',
  },
  pickerOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  pickerOptionTextSelected: {
    fontWeight: '600',
    color: Colors.primary,
  },
});
