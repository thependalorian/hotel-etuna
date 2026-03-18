/**
 * CountryCodeSelector - Standalone country flag + code picker
 * Location: fintech/smartpay/components/auth/specialty/CountryCodeSelector.tsx
 * Can be used separately or integrated with phone inputs
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { designSystem } from '@/constants/designSystem';

export interface Country {
  code: string;
  dialCode: string;
  flag: string;
  name: string;
}

// African countries prioritized
const COUNTRIES: Country[] = [
  { code: 'NA', dialCode: '+264', flag: '🇳🇦', name: 'Namibia' },
  { code: 'ZA', dialCode: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: 'BW', dialCode: '+267', flag: '🇧🇼', name: 'Botswana' },
  { code: 'ZW', dialCode: '+263', flag: '🇿🇼', name: 'Zimbabwe' },
  { code: 'ZM', dialCode: '+260', flag: '🇿🇲', name: 'Zambia' },
  { code: 'AO', dialCode: '+244', flag: '🇦🇴', name: 'Angola' },
  { code: 'MZ', dialCode: '+258', flag: '🇲🇿', name: 'Mozambique' },
  { code: 'NG', dialCode: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: 'KE', dialCode: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: 'GH', dialCode: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: 'UG', dialCode: '+256', flag: '🇺🇬', name: 'Uganda' },
  { code: 'TZ', dialCode: '+255', flag: '🇹🇿', name: 'Tanzania' },
  { code: 'ET', dialCode: '+251', flag: '🇪🇹', name: 'Ethiopia' },
  { code: 'EG', dialCode: '+20', flag: '🇪🇬', name: 'Egypt' },
  { code: 'MA', dialCode: '+212', flag: '🇲🇦', name: 'Morocco' },
  { code: 'US', dialCode: '+1', flag: '🇺🇸', name: 'United States' },
  { code: 'GB', dialCode: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'CA', dialCode: '+1', flag: '🇨🇦', name: 'Canada' },
  { code: 'AU', dialCode: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: 'IN', dialCode: '+91', flag: '🇮🇳', name: 'India' },
];

export interface CountryCodeSelectorProps {
  value: Country;
  onChange: (country: Country) => void;
  disabled?: boolean;
  testID?: string;
}

export function CountryCodeSelector({
  value,
  onChange,
  disabled = false,
  testID = 'country-code-selector',
}: CountryCodeSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = searchQuery
    ? COUNTRIES.filter(
        (country) =>
          country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          country.dialCode.includes(searchQuery) ||
          country.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : COUNTRIES;

  const handleSelect = (country: Country) => {
    onChange(country);
    setModalVisible(false);
    setSearchQuery('');
  };

  return (
    <>
      <Pressable
        style={styles.selector}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
        testID={testID}
        accessibilityLabel={`Selected country: ${value.name}`}
        accessibilityHint="Tap to change country"
      >
        <Text style={styles.flag}>{value.flag}</Text>
        <Text style={styles.dialCode}>{value.dialCode}</Text>
        <Text style={styles.arrow}>▼</Text>
      </Pressable>

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
                accessibilityLabel="Close"
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search countries..."
                placeholderTextColor={designSystem.colors.neutral.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            <ScrollView style={styles.countriesList}>
              {filteredCountries.map((country) => (
                <Pressable
                  key={country.code}
                  style={({ pressed }) => [
                    styles.countryItem,
                    pressed && styles.countryItemPressed,
                    value.code === country.code && styles.countryItemSelected,
                  ]}
                  onPress={() => handleSelect(country)}
                  testID={`country-${country.code}`}
                >
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <Text style={styles.countryName}>{country.name}</Text>
                  <Text style={styles.countryDialCode}>{country.dialCode}</Text>
                  {value.code === country.code && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const ds = designSystem;
const { colors, spacing, radius, typography, shadows } = ds;
const { brand, neutral } = colors;

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: neutral.border,
    borderRadius: radius.md,
    backgroundColor: neutral.surface,
    ...shadows.sm,
  },
  flag: {
    fontSize: 24,
  },
  dialCode: {
    fontSize: 16,
    fontWeight: '600',
    color: neutral.text,
  },
  arrow: {
    fontSize: 10,
    color: neutral.textSecondary,
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
  searchContainer: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: neutral.border,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: neutral.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    backgroundColor: neutral.background,
    color: neutral.text,
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
  checkmark: {
    fontSize: 20,
    color: brand.primary,
    fontWeight: 'bold',
  },
});

/**
 * USAGE EXAMPLES:
 * 
 * // Basic usage
 * const [country, setCountry] = useState(COUNTRIES[0]);
 * 
 * <CountryCodeSelector
 *   value={country}
 *   onChange={setCountry}
 * />
 * 
 * // In a form
 * <View style={styles.row}>
 *   <CountryCodeSelector
 *     value={selectedCountry}
 *     onChange={setSelectedCountry}
 *   />
 *   <TextInput
 *     style={styles.phoneInput}
 *     placeholder="Phone number"
 *     keyboardType="phone-pad"
 *   />
 * </View>
 * 
 * ACCESSING COUNTRIES LIST:
 * 
 * import { COUNTRIES } from '@/components/auth/specialty/CountryCodeSelector';
 * 
 * // Find country by code
 * const findCountryByCode = (code: string) => {
 *   return COUNTRIES.find(c => c.code === code);
 * };
 * 
 * // Find country by dial code
 * const findCountryByDialCode = (dialCode: string) => {
 *   return COUNTRIES.find(c => c.dialCode === dialCode);
 * };
 */

// Export countries list for reuse
export { COUNTRIES };
