/**
 * AddWalletForm Component - Multi-Step Form
 * 
 * Location: components/wallets/AddWalletForm.tsx
 * Purpose: Multi-step form to create a new wallet with pagination
 * 
 * Step 1: Wallet Icon, Name, and Auto Pay Configuration
 * Step 2: Card Design Selection
 * 
 * Based on Adding A Wallet.svg design
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
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
// @ts-ignore - DateTimePicker types may not be available
import DateTimePicker from '@react-native-community/datetimepicker';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import CardFrame from '@/components/cards/CardFrame';
import { PayFromSelector, PaymentSource, PillButton } from '@/components/common';

interface AddWalletFormProps {
  onWalletCreated?: (walletData: { 
    name: string; 
    purpose?: string;
    type?: 'personal' | 'business' | 'savings' | 'investment' | 'bills' | 'travel' | 'budget';
    cardDesign?: number;
    icon?: string;
    autoPayEnabled?: boolean;
    autoPayFrequency?: 'weekly' | 'bi-weekly' | 'monthly';
    autoPayDeductDate?: string;
    autoPayDeductTime?: string;
    autoPayAmount?: number;
    autoPayRepayments?: number;
    autoPayPaymentMethod?: string;
  }) => void;
  onCancel?: () => void;
}

// Available card frame designs (from Buffr Card Design folder)
const AVAILABLE_FRAMES = [2, 3, 6, 7, 8, 9, 12, 15, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];

// Wallet icon options (using FontAwesome icons)
const WALLET_ICONS = [
  { name: 'credit-card', label: 'Wallet' },
  { name: 'credit-card', label: 'Card' },
  { name: 'piggy-bank', label: 'Savings' },
  { name: 'briefcase', label: 'Business' },
  { name: 'plane', label: 'Travel' },
  { name: 'home', label: 'Home' },
  { name: 'car', label: 'Car' },
  { name: 'heart', label: 'Personal' },
  { name: 'gift', label: 'Gift' },
  { name: 'graduation-cap', label: 'Education' },
  { name: 'diamond', label: 'Premium' },
  { name: 'star', label: 'Favorite' },
  { name: 'trophy', label: 'Goal' },
  { name: 'shopping-bag', label: 'Shopping' },
  { name: 'cutlery', label: 'Food' },
  { name: 'gamepad', label: 'Entertainment' },
  { name: 'music', label: 'Music' },
  { name: 'camera', label: 'Photography' },
  { name: 'book', label: 'Books' },
  { name: 'futbol-o', label: 'Sports' },
];

// Payment frequency options
const PAYMENT_FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

// Number of repayments options (matching design)
const REPAYMENT_OPTIONS = [
  { value: null, label: 'Unlimited' },
  { value: 1, label: '1' },
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
];

// Payment methods are now handled by PayFromSelector component
// Removed PAYMENT_METHODS constant - now using PayFromSelector

export default function AddWalletForm({
  onWalletCreated,
  onCancel,
}: AddWalletFormProps) {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  // Step 1: Basic Info & Auto Pay
  const [walletName, setWalletName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('credit-card');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [autoPayEnabled, setAutoPayEnabled] = useState(false);
  const [autoPayFrequency, setAutoPayFrequency] = useState<'weekly' | 'bi-weekly' | 'monthly'>('monthly');
  // Initialize date and time
  const initialTime = new Date();
  initialTime.setHours(20, 0, 0, 0); // 8:00 PM
  
  const [autoPayDeductDate, setAutoPayDeductDate] = useState(new Date(2023, 8, 17)); // September 17, 2023
  const [autoPayDeductTime, setAutoPayDeductTime] = useState(initialTime);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [autoPayAmount, setAutoPayAmount] = useState('1000');
  const [autoPayRepayments, setAutoPayRepayments] = useState<number | null>(null);
  const [showRepaymentsPicker, setShowRepaymentsPicker] = useState(false);
  const [selectedPaymentSource, setSelectedPaymentSource] = useState<PaymentSource | null>(null);
  const [showPayFromSelector, setShowPayFromSelector] = useState(false);

  // Step 2: Card Design
  const [selectedCardDesign, setSelectedCardDesign] = useState<number>(2);
  const [showCardDesignPicker, setShowCardDesignPicker] = useState(false);

  // Handle Step 1 submission
  const handleStep1Next = () => {
    if (!walletName.trim()) {
      Alert.alert('Error', 'Please enter a wallet name');
      return;
    }
    setCurrentStep(2);
  };

  // Handle final submission
  const handleSubmit = () => {
    if (!walletName.trim()) {
      Alert.alert('Error', 'Please enter a wallet name');
      return;
    }

    onWalletCreated?.({
      name: walletName.trim(),
      icon: selectedIcon,
      cardDesign: selectedCardDesign,
      autoPayEnabled: autoPayEnabled,
      autoPayFrequency: autoPayEnabled ? autoPayFrequency : undefined,
      autoPayDeductDate: autoPayEnabled ? autoPayDeductDate.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      }) : undefined,
      autoPayDeductTime: autoPayEnabled ? autoPayDeductTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }) : undefined,
      autoPayAmount: autoPayEnabled ? parseFloat(autoPayAmount) : undefined,
      autoPayRepayments: autoPayEnabled ? autoPayRepayments || undefined : undefined,
      autoPayPaymentMethod: autoPayEnabled ? selectedPaymentSource?.id : undefined,
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return dateString; // In a real app, this would format the date properly
  };

  // Get selected payment method display
  // Initialize with default payment source (Nedbank)
  React.useEffect(() => {
    if (!selectedPaymentSource) {
      setSelectedPaymentSource({
        id: 'nedbank',
        type: 'bank',
        name: 'Nedbank',
        displayName: 'Nedbank X293',
        lastDigits: 'X293',
        color: '#10B981',
      });
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Pagination Indicators */}
      <View style={styles.pagination}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index + 1 === currentStep && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>

      <ScrollView style={defaultStyles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 ? (
          // STEP 1: Icon, Name, Auto Pay
          <View style={styles.stepContainer}>
            {/* Wallet Icon Selection */}
            <View style={styles.iconSection}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowIconPicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.iconCircle}>
                  <FontAwesome name={selectedIcon as any} size={40} color={Colors.primary} />
                </View>
                <Text style={styles.setIconText}>Set Icon</Text>
              </TouchableOpacity>
            </View>

            {/* Wallet Name */}
            <View style={styles.inputGroup}>
              <Text style={defaultStyles.label}>Wallet Name</Text>
            <TextInput
              style={[defaultStyles.input, { backgroundColor: Colors.white, borderRadius: 25, height: 50 }]}
              placeholder="e.g., Aquarium, Vacation Fund"
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
                  <Text style={styles.autoPayLabel}>Auto Pay</Text>
                  <Text style={styles.autoPayDescription}>
                    Automatically deduct funds from your selected payment method at the specified intervals.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    autoPayEnabled && styles.toggleActive,
                  ]}
                  onPress={() => setAutoPayEnabled(!autoPayEnabled)}
                >
                  <View style={[
                    styles.toggleThumb,
                    autoPayEnabled && styles.toggleThumbActive,
                  ]} />
                </TouchableOpacity>
              </View>

              {/* Auto Pay Fields (shown when enabled) */}
              {autoPayEnabled && (
                <View style={styles.autoPayFields}>
                  {/* Frequency Selection */}
                  <View style={styles.frequencySection}>
                    {PAYMENT_FREQUENCIES.map((freq) => (
                      <TouchableOpacity
                        key={freq.value}
                        style={[
                          styles.frequencyButton,
                          autoPayFrequency === freq.value && styles.frequencyButtonActive,
                        ]}
                        onPress={() => setAutoPayFrequency(freq.value)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.frequencyButtonText,
                            autoPayFrequency === freq.value && styles.frequencyButtonTextActive,
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit={true}
                          minimumFontScale={0.8}
                        >
                          {freq.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Deduct On: Date & Time - iOS Pill Style */}
                  <View style={styles.deductOnSection}>
                    <Text style={defaultStyles.label}>Deduct On</Text>
                    <View style={styles.deductOnPill}>
                      <TouchableOpacity 
                        style={styles.dateTimePillHalf}
                        onPress={() => setShowDatePicker(true)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dateTimeText}>
                          {autoPayDeductDate.toLocaleDateString('en-US', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.pillSeparator} />
                      <TouchableOpacity 
                        style={styles.dateTimePillHalf}
                        onPress={() => setShowTimePicker(true)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dateTimeText}>
                          {autoPayDeductTime.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Amount */}
                  <View style={styles.inputGroup}>
                    <Text style={defaultStyles.label}>Amount</Text>
                    <View style={styles.amountInputContainer}>
                      <Text style={styles.currencyLabel}>N$</Text>
                      <TextInput
                        style={styles.amountInput}
                        placeholder="1,000"
                        placeholderTextColor={Colors.textSecondary}
                        value={autoPayAmount}
                        onChangeText={setAutoPayAmount}
                        keyboardType="numeric"
                        returnKeyType="done"
                      />
                    </View>
                  </View>

                  {/* Number of Repayments */}
                  <View style={styles.inputGroup}>
                    <Text style={defaultStyles.label}>Select Number Of Repayments</Text>
                    <TouchableOpacity
                      style={[defaultStyles.input, { 
                        flexDirection: 'row', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        borderRadius: 25, // More pill-like
                        height: 50
                      }]}
                      onPress={() => setShowRepaymentsPicker(true)}
                    >
                      <Text style={[
                        styles.pickerText,
                        !autoPayRepayments && styles.pickerPlaceholder,
                      ]}>
                        {autoPayRepayments === null ? 'Unlimited' : autoPayRepayments === undefined ? 'Select' : autoPayRepayments.toString()}
                      </Text>
                      <FontAwesome name="chevron-down" size={16} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Pay From */}
                  <View style={styles.inputGroup}>
                    <Text style={defaultStyles.label}>Pay From</Text>
                    <TouchableOpacity
                      style={styles.paymentMethodButton}
                      onPress={() => setShowPayFromSelector(true)}
                      activeOpacity={0.7}
                    >
                      {selectedPaymentSource && (
                        <>
                          <View style={[styles.paymentMethodIconCircle, { backgroundColor: selectedPaymentSource.color || Colors.primary }]}>
                            {selectedPaymentSource.type === 'wallet' && selectedPaymentSource.icon ? (
                              <FontAwesome
                                name={selectedPaymentSource.icon as any}
                                size={20}
                                color={Colors.white}
                              />
                            ) : (
                              <Text style={styles.paymentMethodIconText}>
                                {selectedPaymentSource.type === 'buffr' ? 'U' : selectedPaymentSource.name.charAt(0)}
                              </Text>
                            )}
                          </View>
                          <Text style={styles.paymentMethodText}>
                            {selectedPaymentSource.displayName}
                          </Text>
                        </>
                      )}
                      <FontAwesome name="chevron-down" size={16} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Step 1 Navigation */}
            <View style={styles.buttonGroup}>
              <PillButton
                label="Next"
                variant="primary"
                onPress={handleStep1Next}
                style={{ width: '100%' }}
              />
            </View>
          </View>
        ) : (
          // STEP 2: Card Design
          <View style={styles.stepContainer}>
            <Text style={defaultStyles.headerMedium}>Choose Card Design</Text>
            <Text style={defaultStyles.descriptionText}>
              Select a design for your wallet card
            </Text>

            <View style={styles.cardDesignSection}>
              <TouchableOpacity
                style={styles.cardDesignButton}
                onPress={() => setShowCardDesignPicker(true)}
              >
                <CardFrame
                  frameNumber={selectedCardDesign}
                  cardNumber="1234 5678 9012 3456"
                  cardholderName={walletName.trim() || 'CARDHOLDER NAME'}
                  expiryDate="12/25"
                />
                <View style={styles.cardDesignOverlay}>
                  <Text style={styles.cardDesignText}>Tap to change design</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Step 2 Navigation */}
            <View style={styles.buttonGroup}>
              <PillButton
                label="Save"
                variant="primary"
                onPress={handleSubmit}
                style={{ width: '100%' }}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* iOS Date Picker Modal */}
      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableOpacity 
            style={styles.datePickerModal}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          >
            <TouchableOpacity 
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.datePickerCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>Select Date</Text>
                  <TouchableOpacity onPress={() => {
                    setShowDatePicker(false);
                  }}>
                    <Text style={styles.datePickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                {Platform.OS === 'ios' ? (
                  <DateTimePicker
                    value={autoPayDeductDate}
                    mode="date"
                    display="spinner"
                    onChange={(event: any, selectedDate?: Date) => {
                      if (selectedDate && event.type !== 'dismissed') {
                        setAutoPayDeductDate(selectedDate);
                      }
                    }}
                    minimumDate={new Date()}
                    style={{ height: 200 }}
                  />
                ) : (
                  <DateTimePicker
                    value={autoPayDeductDate}
                    mode="date"
                    display="default"
                    onChange={(event: any, selectedDate?: Date) => {
                      if (selectedDate && event.type !== 'dismissed') {
                        setAutoPayDeductDate(selectedDate);
                      }
                      setShowDatePicker(false);
                    }}
                    minimumDate={new Date()}
                  />
                )}
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* iOS Time Picker Modal */}
      {showTimePicker && (
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <TouchableOpacity 
            style={styles.datePickerModal}
            activeOpacity={1}
            onPress={() => setShowTimePicker(false)}
          >
            <TouchableOpacity 
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Text style={styles.datePickerCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>Select Time</Text>
                  <TouchableOpacity onPress={() => {
                    setShowTimePicker(false);
                  }}>
                    <Text style={styles.datePickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                {Platform.OS === 'ios' ? (
                  <DateTimePicker
                    value={autoPayDeductTime}
                    mode="time"
                    display="spinner"
                    onChange={(event: any, selectedTime?: Date) => {
                      if (selectedTime && event.type !== 'dismissed') {
                        setAutoPayDeductTime(selectedTime);
                      }
                    }}
                    is24Hour={false}
                    style={{ height: 200 }}
                  />
                ) : (
                  <DateTimePicker
                    value={autoPayDeductTime}
                    mode="time"
                    display="default"
                    onChange={(event: any, selectedTime?: Date) => {
                      if (selectedTime && event.type !== 'dismissed') {
                        setAutoPayDeductTime(selectedTime);
                      }
                      setShowTimePicker(false);
                    }}
                    is24Hour={false}
                  />
                )}
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

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
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.iconOption,
                    selectedIcon === item.name && styles.iconOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedIcon(item.name);
                    setShowIconPicker(false);
                  }}
                >
                  <FontAwesome
                    name={item.name as any}
                    size={24}
                    color={selectedIcon === item.name ? Colors.white : Colors.primary}
                  />
                  <Text
                    style={[
                      styles.iconOptionLabel,
                      selectedIcon === item.name && styles.iconOptionLabelSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.iconsList}
            />
          </View>
        </View>
      </Modal>

      {/* Repayments Picker Modal - iOS Action Sheet Style */}
      <Modal
        visible={showRepaymentsPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRepaymentsPicker(false)}
      >
        <TouchableOpacity 
          style={styles.repaymentsModalBackdrop}
          activeOpacity={1}
          onPress={() => setShowRepaymentsPicker(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{ width: '100%' }}
          >
            <View style={styles.repaymentsModalContent}>
              {/* Title */}
              <View style={styles.repaymentsModalHeader}>
                <Text style={styles.repaymentsModalTitle}>Select Number Of Repayments</Text>
              </View>

              {/* Unified Container: Options + Cancel */}
              <View style={styles.repaymentsUnifiedContainer}>
                {/* Options List */}
                <View style={styles.repaymentsOptionsContainer}>
                  {REPAYMENT_OPTIONS.map((item, index) => (
                    <React.Fragment key={item.value?.toString() || 'unlimited'}>
                      <TouchableOpacity
                        style={[
                          styles.repaymentOption,
                          autoPayRepayments === item.value && styles.repaymentOptionSelected,
                        ]}
                        onPress={() => {
                          setAutoPayRepayments(item.value);
                          setShowRepaymentsPicker(false);
                        }}
                        activeOpacity={0.6}
                      >
                        <Text
                          style={[
                            styles.repaymentOptionText,
                            autoPayRepayments === item.value && styles.repaymentOptionTextSelected,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                      {index < REPAYMENT_OPTIONS.length - 1 && (
                        <View style={styles.repaymentOptionDivider} />
                      )}
                    </React.Fragment>
                  ))}
                </View>

                {/* Visual Break */}
                <View style={styles.repaymentsBreak} />

                {/* Cancel Button - Inside Unified Container */}
                <TouchableOpacity
                  style={styles.repaymentsCancelButton}
                  onPress={() => setShowRepaymentsPicker(false)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.repaymentsCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Pay From Selector Modal */}
      <PayFromSelector
        visible={showPayFromSelector}
        onClose={() => setShowPayFromSelector(false)}
        selectedSourceId={selectedPaymentSource?.id}
        onSelectSource={(source) => {
          setSelectedPaymentSource(source);
        }}
        title="Pay From"
        subtitle="Choose profile to make the payment from."
      />

      {/* Card Design Picker Modal */}
      <Modal
        visible={showCardDesignPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCardDesignPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Card Design</Text>
              <TouchableOpacity
                onPress={() => setShowCardDesignPicker(false)}
                style={styles.closeButton}
              >
                <FontAwesome name="times" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={AVAILABLE_FRAMES}
              numColumns={2}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.frameOption,
                    selectedCardDesign === item && styles.frameOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedCardDesign(item);
                    setShowCardDesignPicker(false);
                  }}
                >
                  <CardFrame
                    frameNumber={item}
                    cardNumber="1234 5678 9012 3456"
                    cardholderName={walletName.trim() || 'CARDHOLDER'}
                    expiryDate="12/25"
                  />
                  {selectedCardDesign === item && (
                    <View style={styles.selectedBadge}>
                      <FontAwesome name="check-circle" size={24} color={Colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.framesList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  paginationDotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  stepContainer: {
    gap: 24,
  },
  iconSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  iconButton: {
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E0F2FE', // Light blue background from design (#BAE6FD or similar)
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  setIconText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  inputGroup: {
    gap: 8,
    marginBottom: 16,
  },
  autoPaySection: {
    backgroundColor: '#F8FAFC', // Light gray background from design
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 16,
  },
  autoPayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  autoPayHeaderLeft: {
    flex: 1,
    gap: 4,
    paddingRight: 12,
  },
  autoPayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  autoPayDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  toggle: {
    width: 51,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: '#E2E8F0', // Light grey when OFF
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: Colors.success, // Green when active
  },
  toggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: Colors.white,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  autoPayFields: {
    gap: 16,
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  frequencySection: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 25, // More pill-like
    borderWidth: 1.5,
    borderStyle: 'dashed', // Dashed border when not selected (iOS only, will need workaround for Android)
    borderColor: '#CBD5E1', // Light grey dashed border
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginHorizontal: 4,
  },
  frequencyButtonActive: {
    backgroundColor: Colors.primary,
    borderStyle: 'solid', // Solid border when selected
    borderColor: Colors.primary,
    borderWidth: 1.5,
    borderRadius: 25, // More pill-like
  },
  frequencyButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    flexShrink: 0,
  },
  frequencyButtonTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  deductOnSection: {
    gap: 8,
  },
  deductOnPill: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 25, // More pill-like
    borderWidth: 1,
    borderColor: Colors.border,
    height: 50, // Fixed height for pill shape
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  dateTimePillHalf: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillSeparator: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  dateTimeText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 25, // More pill-like
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 18,
    height: 50, // Fixed height for pill shape
    position: 'relative',
  },
  amountInput: {
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    height: '100%',
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  pickerText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  pickerPlaceholder: {
    color: Colors.textSecondary,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 0,
    paddingHorizontal: 18,
    borderRadius: 25, // More pill-like
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 50, // Fixed height for pill shape
    justifyContent: 'center',
  },
  paymentMethodIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20, // Circular
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  paymentMethodText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  buttonGroup: {
    flexDirection: 'row',
    marginTop: 32,
    paddingBottom: 8,
    width: '100%',
  },
  cardDesignSection: {
    marginTop: 8,
  },
  cardDesignButton: {
    marginTop: 8,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardDesignOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDesignText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    gap: 12,
  },
  iconOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.backgroundGray,
    margin: 4,
    gap: 8,
    minHeight: 100,
    justifyContent: 'center',
  },
  iconOptionSelected: {
    backgroundColor: Colors.primary,
  },
  iconOptionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
  iconOptionLabelSelected: {
    color: Colors.white,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: 56,
  },
  pickerOptionSelected: {
    backgroundColor: Colors.backgroundGray,
  },
  pickerOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  pickerOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  framesList: {
    padding: 16,
    gap: 16,
  },
  frameOption: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  frameOptionSelected: {
    borderColor: Colors.primary,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  datePickerCancel: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  datePickerDone: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  repaymentsModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Darker backdrop for better contrast
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  repaymentsModalContent: {
    backgroundColor: 'rgba(248, 248, 248, 0.95)', // Slightly grey translucent background
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 34,
    width: '100%',
    // Ensure content fits and Cancel is visible
    minHeight: 200,
    maxHeight: '85%',
    // Add blur effect (iOS style)
    overflow: 'visible',
  },
  repaymentsModalHeader: {
    paddingTop: 20,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  repaymentsModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  repaymentsUnifiedContainer: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    marginHorizontal: 8,
    marginBottom: 0,
    overflow: 'hidden',
  },
  repaymentsOptionsContainer: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  repaymentOption: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 44,
    backgroundColor: 'transparent',
    marginHorizontal: 0,
    marginVertical: 0,
  },
  repaymentOptionSelected: {
    backgroundColor: 'transparent', // No special background for selected
  },
  repaymentOptionText: {
    fontSize: 20,
    fontWeight: '400',
    color: Colors.primary,
    textAlign: 'center',
    letterSpacing: 0.38,
  },
  repaymentOptionTextSelected: {
    fontWeight: '400',
  },
  repaymentOptionDivider: {
    height: 0.5,
    backgroundColor: 'rgba(60, 60, 67, 0.29)', // iOS-style divider
    marginLeft: 0,
    marginRight: 0,
  },
  repaymentsBreak: {
    height: 8,
    backgroundColor: 'rgba(60, 60, 67, 0.12)', // iOS-style break
    marginTop: 8,
    marginBottom: 0, // No bottom margin - flush with Cancel button
    marginHorizontal: 0,
    width: '100%',
    flexShrink: 0,
    alignSelf: 'stretch',
  },
  repaymentsCancelButton: {
    backgroundColor: 'transparent', // No background, full width like other options
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    width: '100%',
    // Ensure no gaps - flush with container edges
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
  },
  repaymentsCancelText: {
    fontSize: 20,
    fontWeight: '400',
    color: Colors.primary,
    letterSpacing: 0.38,
  },
});
