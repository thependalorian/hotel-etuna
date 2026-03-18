/**
 * PhoneInput - International phone number input with country selector
 * Location: fintech/smartpay/components/auth/inputs/PhoneInput.tsx
 * Target: African markets (Namibia-first)
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
  ScrollView,
  TextInputProps,
} from 'react-native';
import { designSystem } from '@/constants/designSystem';

export interface Country {
  code: string;
  dialCode: string;
  flag: string;
  name: string;
}

// African countries prioritized, Namibia first
const COUNTRIES: Country[] = [
  { code: 'NA', dialCode: '+264', flag: '🇳🇦', name: 'Namibia' },
  { code: 'ZA', dialCode: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: 'BW', dialCode: '+267', flag: '🇧🇼', name: 'Botswana' },
  { code: 'ZW', dialCode: '+263', flag: '🇿🇼', name: 'Zimbabwe' },
  { code: 'ZM', dialCode: '+260', flag: '🇿🇲', name: 'Zambia' },
  { code: 'NG', dialCode: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: 'KE', dialCode: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: 'GH', dialCode: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: 'UG', dialCode: '+256', flag: '🇺🇬', name: 'Uganda' },
  { code: 'TZ', dialCode: '+255', flag: '🇹🇿', name: 'Tanzania' },
  { code: 'US', dialCode: '+1', flag: '🇺🇸', name: 'United States' },
  { code: 'GB', dialCode: '+44', flag: '🇬🇧', name: 'United Kingdom' },
];

export interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onChangeCountry?: (country: Country) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  testID?: string;
  label?: string;
  required?: boolean;
  defaultCountry?: string; // Country code e.g., 'NA'
}

export function PhoneInput({
  value,
  onChangeText,
  onChangeCountry,
  error,
  disabled = false,
  placeholder = 'Enter phone number',
  autoFocus = false,
  testID = 'phone-input',
  label = 'Phone Number',
  required = false,
  defaultCountry = 'NA',
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    COUNTRIES.find((c) => c.code === defaultCountry) || COUNTRIES[0]
  );
  const [modalVisible, setModalVisible] = useState(false);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    onChangeCountry?.(country);
    setModalVisible(false);
  };

  const formatPhoneNumber = (text: string) => {
    // Remove non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    // Format based on country (Namibia example: 81 234 5678)
    if (selectedCountry.code === 'NA' && cleaned.length >= 2) {
      return cleaned
        .replace(/(\d{2})(\d{0,3})(\d{0,4})/, (_, p1, p2, p3) => {
          let formatted = p1;
          if (p2) formatted += ` ${p2}`;
          if (p3) formatted += ` ${p3}`;
          return formatted.trim();
        });
    }
    return cleaned;
  };

  const handleTextChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    onChangeText(formatted);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={[styles.inputContainer, error && styles.inputContainerError]}>
        <Pressable
          style={styles.countrySelector}
          onPress={() => !disabled && setModalVisible(true)}
          disabled={disabled}
          accessibilityLabel={`Selected country: ${selectedCountry.name}`}
          accessibilityHint="Tap to change country"
          testID={`${testID}-country-selector`}
        >
          <Text style={styles.flag}>{selectedCountry.flag}</Text>
          <Text style={styles.dialCode}>{selectedCountry.dialCode}</Text>
          <Text style={styles.arrow}>▼</Text>
        </Pressable>

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={designSystem.colors.neutral.textSecondary}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          editable={!disabled}
          autoFocus={autoFocus}
          testID={testID}
          accessibilityLabel={label}
          accessibilityHint="Enter your phone number"
          maxLength={15}
        />
      </View>

      {error && (
        <Text style={styles.error} testID={`${testID}-error`}>
          {error}
        </Text>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.modalClose}
                accessibilityLabel="Close country selector"
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>
            
            <ScrollView style={styles.countriesList}>
              {COUNTRIES.map((country) => (
                <Pressable
                  key={country.code}
                  style={({ pressed }) => [
                    styles.countryItem,
                    pressed && styles.countryItemPressed,
                    selectedCountry.code === country.code && styles.countryItemSelected,
                  ]}
                  onPress={() => handleCountrySelect(country)}
                  accessibilityLabel={`${country.name} ${country.dialCode}`}
                  testID={`country-${country.code}`}
                >
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <Text style={styles.countryName}>{country.name}</Text>
                  <Text style={styles.countryDialCode}>{country.dialCode}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const ds = designSystem;
const { colors, spacing, radius, typography, shadows } = ds;
const { brand, neutral } = colors;

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    ...typography.textStyles.caption,
    fontWeight: '600',
    color: neutral.text,
    fontSize: 14,
  },
  required: {
    color: colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: neutral.border,
    borderRadius: radius.md,
    backgroundColor: neutral.surface,
    ...shadows.sm,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRightWidth: 1,
    borderRightColor: neutral.border,
    gap: spacing.xs,
  },
  flag: {
    fontSize: 24,
  },
  dialCode: {
    fontSize: 16,
    color: neutral.text,
    fontWeight: '600',
  },
  arrow: {
    fontSize: 10,
    color: neutral.textSecondary,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: neutral.text,
  },
  error: {
    color: colors.error,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: neutral.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '80%',
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: neutral.border,
  },
  modalTitle: {
    ...typography.textStyles.h2,
    color: neutral.text,
  },
  modalClose: {
    padding: spacing.sm,
  },
  modalCloseText: {
    fontSize: 24,
    color: neutral.textSecondary,
  },
  countriesList: {
    flex: 1,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: neutral.border,
  },
  countryItemPressed: {
    backgroundColor: neutral.muted,
  },
  countryItemSelected: {
    backgroundColor: brand.primaryLight,
  },
  countryFlag: {
    fontSize: 28,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: neutral.text,
  },
  countryDialCode: {
    fontSize: 16,
    color: neutral.textSecondary,
    fontWeight: '600',
  },
});

/**
 * USAGE EXAMPLE:
 * 
 * import { PhoneInput } from '@/components/auth/inputs/PhoneInput';
 * 
 * function SignUpScreen() {
 *   const [phone, setPhone] = useState('');
 *   const [country, setCountry] = useState<Country>();
 *   
 *   return (
 *     <PhoneInput
 *       value={phone}
 *       onChangeText={setPhone}
 *       onChangeCountry={setCountry}
 *       label="Mobile Number"
 *       required
 *       error={error}
 *       defaultCountry="NA"
 *     />
 *   );
 * }
 * 
 * VALIDATION EXAMPLE:
 * 
 * const validatePhone = (phone: string, country: Country) => {
 *   const cleaned = phone.replace(/\s/g, '');
 *   
 *   // Namibia: 8-9 digits
 *   if (country.code === 'NA') {
 *     return /^\d{8,9}$/.test(cleaned);
 *   }
 *   
 *   // General validation
 *   return /^\d{7,15}$/.test(cleaned);
 * };
 * 
 * ACCESSIBILITY:
 * - Screen reader announces country selection and phone input
 * - Keyboard type set to phone-pad
 * - Auto-complete enabled for tel input
 * - Clear focus indicators on country selector
 * 
 * TESTING:
 * 
 * test('renders PhoneInput with default country', () => {
 *   const { getByTestId } = render(
 *     <PhoneInput value="" onChangeText={jest.fn()} defaultCountry="NA" />
 *   );
 *   expect(getByTestId('phone-input-country-selector')).toBeTruthy();
 * });
 * 
 * test('formats Namibian phone number correctly', () => {
 *   const handleChange = jest.fn();
 *   const { getByTestId } = render(
 *     <PhoneInput value="" onChangeText={handleChange} defaultCountry="NA" />
 *   );
 *   
 *   fireEvent.changeText(getByTestId('phone-input'), '812345678');
 *   expect(handleChange).toHaveBeenCalledWith('81 234 5678');
 * });
 */
