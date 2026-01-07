/**
 * Create Loan Screen
 * 
 * Location: app/loans/create.tsx
 * Purpose: Simple form to set loan icon and name
 * 
 * After saving, navigates to loan details screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLoans } from '@/contexts/LoansContext';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import { ScreenHeader, IconPicker, IconOption } from '@/components/common';

// Loan icon options (using FontAwesome icons)
const LOAN_ICONS: IconOption[] = [
  { name: 'book', label: 'Education' },
  { name: 'briefcase', label: 'Business' },
  { name: 'home', label: 'Home' },
  { name: 'car', label: 'Vehicle' },
  { name: 'heart', label: 'Personal' },
  { name: 'shopping-bag', label: 'Shopping' },
  { name: 'plane', label: 'Travel' },
  { name: 'gift', label: 'Gift' },
  { name: 'graduation-cap', label: 'Education' },
  { name: 'diamond', label: 'Premium' },
  { name: 'star', label: 'Favorite' },
  { name: 'trophy', label: 'Goal' },
  { name: 'cutlery', label: 'Food' },
  { name: 'gamepad', label: 'Entertainment' },
  { name: 'music', label: 'Music' },
  { name: 'camera', label: 'Photography' },
  { name: 'futbol-o', label: 'Sports' },
  { name: 'wallet', label: 'General' },
];

export default function CreateLoanScreen() {
  const router = useRouter();
  const { offerId, amount } = useLocalSearchParams<{ offerId?: string; amount?: string }>();
  const { applyForLoan, offers } = useLoans();
  
  const [selectedIcon, setSelectedIcon] = useState<string>('book');
  const [loanName, setLoanName] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);

  const handleSave = async () => {
    if (!loanName.trim()) {
      Alert.alert('Error', 'Please enter a loan name');
      return;
    }

    if (!offerId) {
      Alert.alert('Error', 'Loan offer not found');
      return;
    }

    try {
      const offer = offers.find((o) => o.id === offerId);
      if (!offer) {
        Alert.alert('Error', 'Loan offer not found');
        return;
      }

      const loanAmount = parseFloat(amount || offer.maxAmount.toString());
      const repaymentPeriod = offer.maxRepaymentPeriod;

      // Apply for the loan
      const newLoan = await applyForLoan(
        offerId,
        loanAmount,
        repaymentPeriod,
        loanName.trim(),
        selectedIcon,
        loanName.trim()
      );

      // Navigate to loan details screen
      // @ts-ignore - Dynamic route
      router.replace({
        pathname: '/loans/[id]',
        params: { id: newLoan.id },
      });
    } catch (error) {
      console.error('Error creating loan:', error);
      Alert.alert('Error', 'Failed to create loan. Please try again.');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader 
        title="Create Loan" 
        onBack={handleCancel}
        backButtonStyle="circular"
      />

      <View style={styles.content}>
        {/* Icon Selection */}
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

        {/* Loan Name */}
        <View style={styles.inputGroup}>
          <Text style={defaultStyles.label}>Loan Name</Text>
          <TextInput
            style={[defaultStyles.input, { backgroundColor: Colors.white, borderRadius: 25, height: 50 }]}
            placeholder="exp. Higher Education Loan"
            placeholderTextColor={Colors.textSecondary}
            value={loanName}
            onChangeText={setLoanName}
            autoCapitalize="words"
            maxLength={50}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[defaultStyles.pillButton, styles.saveButton]}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={defaultStyles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Icon Picker Modal */}
      <IconPicker
        visible={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        icons={LOAN_ICONS}
        selectedIcon={selectedIcon}
        onSelectIcon={setSelectedIcon}
        title="Choose Icon"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconButton: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  setIconText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  inputGroup: {
    marginBottom: 32,
  },
  saveButton: {
    width: '100%',
    marginTop: 'auto',
    marginBottom: 20,
  },
});
