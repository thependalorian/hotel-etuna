import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { designSystem } from '@/constants/designSystem';
import { AppHeader } from '@/components/layout';
import { useNotificationsContext } from '@/contexts/NotificationsContext';

const NOTIFICATION_PREFS_KEY = 'smartpay_notification_preferences';

interface NotificationPreferences {
  payments: boolean;
  kyc: boolean;
  reminders: boolean;
  social: boolean;
  loans: boolean;
  marketing: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  payments: true,
  kyc: true,
  reminders: true,
  social: true,
  loans: true,
  marketing: false,
};

export default function NotificationSettingsScreen() {
  const { permissionGranted, pushToken, requestPermission } = useNotificationsContext();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(newPreferences));
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    savePreferences(newPreferences);
  };

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    
    if (!granted) {
      Alert.alert(
        'Permission Denied',
        'Please enable notifications in your device settings to receive important updates.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const notificationCategories = [
    {
      key: 'payments' as keyof NotificationPreferences,
      label: 'Payments',
      description: 'Receive notifications for payments sent and received',
      icon: 'cash' as keyof typeof Ionicons.glyphMap,
    },
    {
      key: 'kyc' as keyof NotificationPreferences,
      label: 'KYC Updates',
      description: 'Get notified about verification status changes',
      icon: 'shield-checkmark' as keyof typeof Ionicons.glyphMap,
    },
    {
      key: 'reminders' as keyof NotificationPreferences,
      label: 'Reminders',
      description: 'Important reminders for proof-of-life and deadlines',
      icon: 'time' as keyof typeof Ionicons.glyphMap,
    },
    {
      key: 'social' as keyof NotificationPreferences,
      label: 'Social',
      description: 'Group invitations and social updates',
      icon: 'people' as keyof typeof Ionicons.glyphMap,
    },
    {
      key: 'loans' as keyof NotificationPreferences,
      label: 'Loans',
      description: 'Loan status updates and payment reminders',
      icon: 'card' as keyof typeof Ionicons.glyphMap,
    },
    {
      key: 'marketing' as keyof NotificationPreferences,
      label: 'Promotions',
      description: 'Special offers and marketing communications',
      icon: 'megaphone' as keyof typeof Ionicons.glyphMap,
    },
  ];

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AppHeader
          title="Notification Settings"
          showSearch={false}
          showBackButton={true}
          onBackPress={() => router.back()}
        />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Permission Status</Text>
            <View style={styles.permissionCard}>
              <View style={styles.permissionInfo}>
                <Ionicons
                  name={permissionGranted ? 'checkmark-circle' : 'alert-circle'}
                  size={32}
                  color={permissionGranted ? designSystem.colors.success : designSystem.colors.warning}
                />
                <View style={styles.permissionText}>
                  <Text style={styles.permissionTitle}>
                    {permissionGranted ? 'Notifications Enabled' : 'Notifications Disabled'}
                  </Text>
                  <Text style={styles.permissionDescription}>
                    {permissionGranted
                      ? 'You will receive push notifications'
                      : 'Enable to receive important updates'}
                  </Text>
                  {pushToken && (
                    <Text style={styles.tokenText} numberOfLines={1}>
                      Device registered
                    </Text>
                  )}
                </View>
              </View>
              
              {!permissionGranted && (
                <TouchableOpacity style={styles.enableButton} onPress={handleEnableNotifications}>
                  <Text style={styles.enableButtonText}>Enable</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {permissionGranted && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notification Types</Text>
              <Text style={styles.sectionDescription}>
                Choose which types of notifications you want to receive
              </Text>
              
              <View style={styles.categoriesList}>
                {notificationCategories.map((category) => (
                  <View key={category.key} style={styles.categoryItem}>
                    <View style={styles.categoryLeft}>
                      <View style={styles.categoryIconContainer}>
                        <Ionicons
                          name={category.icon}
                          size={24}
                          color={designSystem.colors.brand.primary}
                        />
                      </View>
                      <View style={styles.categoryContent}>
                        <Text style={styles.categoryLabel}>{category.label}</Text>
                        <Text style={styles.categoryDescription}>{category.description}</Text>
                      </View>
                    </View>
                    <Switch
                      value={preferences[category.key]}
                      onValueChange={() => togglePreference(category.key)}
                      trackColor={{
                        false: designSystem.colors.border,
                        true: designSystem.colors.brand,
                      }}
                      thumbColor={designSystem.colors.surface}
                      ios_backgroundColor={designSystem.colors.border}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Notifications</Text>
            <Text style={styles.infoText}>
              SmartPay uses notifications to keep you informed about important account activity, 
              security updates, and time-sensitive actions. You can customize which types of 
              notifications you receive above.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: designSystem.colors.background,
  },
  safe: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: designSystem.spacing[4],
    paddingBottom: designSystem.spacing[8],
  },
  section: {
    marginTop: designSystem.spacing[6],
    gap: designSystem.spacing[3],
  },
  sectionTitle: {
    fontSize: designSystem.typography.fontSize.lg,
    fontWeight: designSystem.typography.fontWeight.semibold,
    color: designSystem.colors.text,
  },
  sectionDescription: {
    fontSize: designSystem.typography.fontSize.sm,
    color: designSystem.colors.textSecondary,
    lineHeight: 20,
  },
  permissionCard: {
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.radius.lg,
    padding: designSystem.spacing[4],
    gap: designSystem.spacing[4],
    ...Platform.select({
      ios: designSystem.shadows.sm,
      android: { elevation: 2 },
    }),
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designSystem.spacing[3],
  },
  permissionText: {
    flex: 1,
    gap: designSystem.spacing[1],
  },
  permissionTitle: {
    fontSize: designSystem.typography.fontSize.base,
    fontWeight: designSystem.typography.fontWeight.semibold,
    color: designSystem.colors.text,
  },
  permissionDescription: {
    fontSize: designSystem.typography.fontSize.sm,
    color: designSystem.colors.textSecondary,
  },
  tokenText: {
    fontSize: designSystem.typography.fontSize.xs,
    color: designSystem.colors.textTertiary,
    marginTop: designSystem.spacing[1],
  },
  enableButton: {
    backgroundColor: designSystem.colors.brand.primary,
    borderRadius: designSystem.radius.md,
    paddingVertical: designSystem.spacing[3],
    paddingHorizontal: designSystem.spacing[6],
    alignItems: 'center',
  },
  enableButtonText: {
    fontSize: designSystem.typography.fontSize.base,
    fontWeight: designSystem.typography.fontWeight.semibold,
    color: designSystem.colors.surface,
  },
  categoriesList: {
    gap: designSystem.spacing[2],
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.radius.lg,
    padding: designSystem.spacing[4],
    ...Platform.select({
      ios: designSystem.shadows.sm,
      android: { elevation: 1 },
    }),
  },
  categoryLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: designSystem.spacing[3],
    marginRight: designSystem.spacing[3],
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: designSystem.colors.brand.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryContent: {
    flex: 1,
    gap: designSystem.spacing[1],
  },
  categoryLabel: {
    fontSize: designSystem.typography.fontSize.base,
    fontWeight: designSystem.typography.fontWeight.medium,
    color: designSystem.colors.text,
  },
  categoryDescription: {
    fontSize: designSystem.typography.fontSize.xs,
    color: designSystem.colors.textSecondary,
    lineHeight: 16,
  },
  infoText: {
    fontSize: designSystem.typography.fontSize.sm,
    color: designSystem.colors.textSecondary,
    lineHeight: 20,
  },
});
