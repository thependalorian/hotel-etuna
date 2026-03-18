/**
 * Account Settings Screen - Smartpay
 * 
 * Sectioned list for:
 * - Security: Change PIN, Biometric settings, Two-Factor Auth
 * - Privacy: Profile visibility, Transaction history
 * - Preferences: Language, Currency display, Notifications
 * 
 * iOS Settings aesthetic with toggle switches
 * Location: app/(authenticated)/profile/settings.tsx
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { designSystem as ds } from '@/constants/designSystem';

type SettingItem = {
  id: string;
  label: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: 'navigation' | 'toggle' | 'select';
  route?: string;
  value?: boolean;
  options?: string[];
  selectedOption?: string;
};

type SettingsSection = {
  section: string;
  items: SettingItem[];
};

export default function SettingsScreen() {
  const router = useRouter();
  
  // Security settings state
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  
  // Privacy settings state
  const [profileVisible, setProfileVisible] = useState(true);
  const [transactionHistoryVisible, setTransactionHistoryVisible] = useState(false);
  
  // Preferences state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedCurrency, setSelectedCurrency] = useState('NAD');

  const handleToggleBiometric = (value: boolean) => {
    if (!value) {
      Alert.alert(
        'Disable Biometric Login',
        'You will need to use your PIN to sign in. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disable', onPress: () => setBiometricEnabled(false), style: 'destructive' },
        ]
      );
    } else {
      setBiometricEnabled(true);
    }
  };

  const handleToggleTwoFactor = (value: boolean) => {
    if (!value) {
      Alert.alert(
        'Disable Two-Factor Authentication',
        'This will reduce your account security. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disable', onPress: () => setTwoFactorEnabled(false), style: 'destructive' },
        ]
      );
    } else {
      setTwoFactorEnabled(true);
    }
  };

  const SETTINGS_SECTIONS: SettingsSection[] = [
    {
      section: 'Security',
      items: [
        {
          id: 'change-pin',
          label: 'Change PIN',
          subtitle: 'Update your security PIN',
          icon: 'key-outline',
          type: 'navigation',
          route: '/(authenticated)/security/change-pin',
        },
        {
          id: 'biometric',
          label: 'Biometric Authentication',
          subtitle: 'Use Face ID or fingerprint',
          icon: 'finger-print-outline',
          type: 'toggle',
          value: biometricEnabled,
        },
        {
          id: 'two-factor',
          label: 'Two-Factor Authentication',
          subtitle: 'Extra security for transactions',
          icon: 'shield-checkmark-outline',
          type: 'toggle',
          value: twoFactorEnabled,
        },
      ],
    },
    {
      section: 'Privacy',
      items: [
        {
          id: 'profile-visibility',
          label: 'Profile Visibility',
          subtitle: 'Allow others to find you by phone',
          icon: 'eye-outline',
          type: 'toggle',
          value: profileVisible,
        },
        {
          id: 'transaction-history',
          label: 'Share Transaction History',
          subtitle: 'Allow viewing your recent transactions',
          icon: 'time-outline',
          type: 'toggle',
          value: transactionHistoryVisible,
        },
      ],
    },
    {
      section: 'Preferences',
      items: [
        {
          id: 'language',
          label: 'Language',
          subtitle: selectedLanguage,
          icon: 'language-outline',
          type: 'select',
          route: '/(authenticated)/settings/language',
          options: ['English', 'Oshiwambo', 'Afrikaans', 'German'],
          selectedOption: selectedLanguage,
        },
        {
          id: 'currency',
          label: 'Currency Display',
          subtitle: selectedCurrency,
          icon: 'cash-outline',
          type: 'select',
          route: '/(authenticated)/settings/currency',
          options: ['NAD', 'USD', 'EUR', 'ZAR'],
          selectedOption: selectedCurrency,
        },
        {
          id: 'notifications',
          label: 'Push Notifications',
          subtitle: 'Receive alerts for transactions',
          icon: 'notifications-outline',
          type: 'toggle',
          value: notificationsEnabled,
        },
      ],
    },
  ];

  const handleToggle = (itemId: string, value: boolean) => {
    switch (itemId) {
      case 'biometric':
        handleToggleBiometric(value);
        break;
      case 'two-factor':
        handleToggleTwoFactor(value);
        break;
      case 'profile-visibility':
        setProfileVisible(value);
        break;
      case 'transaction-history':
        setTransactionHistoryVisible(value);
        break;
      case 'notifications':
        setNotificationsEnabled(value);
        break;
    }
  };

  const renderItem = (item: SettingItem, isLast: boolean) => {
    if (item.type === 'toggle') {
      return (
        <View key={item.id}>
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconBox}>
                <Ionicons name={item.icon} size={20} color={ds.colors.brand.primary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuItemText}>{item.label}</Text>
                {item.subtitle && <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>}
              </View>
            </View>
            <Switch
              value={item.value ?? false}
              onValueChange={(val) => handleToggle(item.id, val)}
              trackColor={{ false: ds.colors.neutral.muted, true: ds.colors.brand.primaryLight }}
              thumbColor={item.value ? ds.colors.brand.primary : ds.colors.neutral.textTertiary}
              ios_backgroundColor={ds.colors.neutral.muted}
            />
          </View>
          {!isLast && <View style={styles.menuDivider} />}
        </View>
      );
    }

    return (
      <View key={item.id}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => item.route && router.push(item.route as any)}
          accessibilityLabel={item.label}
          activeOpacity={0.6}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconBox}>
              <Ionicons name={item.icon} size={20} color={ds.colors.brand.primary} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuItemText}>{item.label}</Text>
              {item.subtitle && <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>}
            </View>
          </View>
          <View style={styles.menuItemRight}>
            {item.type === 'select' && (
              <Text style={styles.selectedValue}>{item.selectedOption}</Text>
            )}
            <Ionicons name="chevron-forward" size={20} color={ds.colors.neutral.textTertiary} />
          </View>
        </TouchableOpacity>
        {!isLast && <View style={styles.menuDivider} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* AppHeader */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={ds.colors.neutral.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {SETTINGS_SECTIONS.map((sec) => (
          <View key={sec.section} style={styles.section}>
            <Text style={styles.sectionTitle}>{sec.section}</Text>
            <View style={styles.sectionCard}>
              {sec.items.map((item, idx) => renderItem(item, idx === sec.items.length - 1))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ds.colors.neutral.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.sm,
    backgroundColor: ds.colors.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: ds.colors.neutral.border,
  },
  backBtn: { padding: ds.spacing.sm },
  headerTitle: { ...ds.typography.textStyles.h2, color: ds.colors.neutral.text },
  headerRight: { width: 40 },
  scroll: { flex: 1 },
  container: { paddingHorizontal: ds.spacing.md, paddingBottom: ds.spacing.xxl },
  
  // Sections
  section: { marginTop: ds.spacing.lg },
  sectionTitle: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: ds.spacing.sm,
    paddingHorizontal: ds.spacing.xs,
  },
  sectionCard: {
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.lg,
    overflow: 'hidden',
    ...ds.shadows.sm,
  },
  
  // Menu items (56px height)
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: ds.spacing.md,
    minHeight: 56,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: ds.colors.brand.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ds.spacing.sm,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuItemText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
  },
  menuItemSubtitle: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
    marginTop: 2,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.xs,
  },
  selectedValue: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.textSecondary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: ds.colors.neutral.border,
    marginLeft: 56,
  },
});
