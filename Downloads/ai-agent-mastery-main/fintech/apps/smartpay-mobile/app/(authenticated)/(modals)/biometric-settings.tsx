/**
 * Biometric Settings – Configure biometric authentication
 * Allows users to enable/disable, view device capability, and re-enroll biometric authentication.
 * Location: app/(authenticated)/(modals)/biometric-settings.tsx
 * 
 * FEATURES:
 * - Enable/disable biometric authentication toggle
 * - Display device biometric capability (Face ID, Touch ID, Fingerprint)
 * - Re-enrollment option
 * - Security information
 * - Setup instructions for unenrolled biometrics
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { designSystem } from '@/constants/designSystem';
import {
  checkBiometricAvailability,
  isBiometricEnabled,
  enableBiometric,
  disableBiometric,
  reEnrollBiometric,
  getBiometricTypeName,
  BiometricType,
  type BiometricAvailability,
} from '@/services/biometrics';

const ds = designSystem;

/**
 * Get icon name for biometric type
 */
function getBiometricIcon(type: BiometricType): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'face':
      return 'scan';
    case 'fingerprint':
      return 'finger-print';
    case 'iris':
      return 'eye';
    default:
      return 'lock-closed';
  }
}

/**
 * Get setup instructions for biometric enrollment
 */
function getSetupInstructions(): string {
  if (Platform.OS === 'ios') {
    return 'To use biometric authentication, please set up Face ID or Touch ID in Settings → Face ID & Passcode (or Touch ID & Passcode).';
  } else {
    return 'To use biometric authentication, please set up Fingerprint in Settings → Security → Fingerprint.';
  }
}

export default function BiometricSettingsScreen() {
  const router = useRouter();
  
  const [availability, setAvailability] = useState<BiometricAvailability | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  // Load biometric status
  useEffect(() => {
    loadBiometricStatus();
  }, []);

  const loadBiometricStatus = async () => {
    setLoading(true);
    try {
      const avail = await checkBiometricAvailability();
      const enabled = await isBiometricEnabled();
      
      setAvailability(avail);
      setIsEnabled(enabled);
    } catch (error) {
      console.error('Failed to load biometric status:', error);
      Alert.alert('Error', 'Failed to load biometric settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBiometric = async (value: boolean) => {
    if (toggling) return;
    
    setToggling(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (value) {
        // Enable biometric
        const result = await enableBiometric();
        
        if (result.success) {
          setIsEnabled(true);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert(
            'Biometric Enabled',
            `${getBiometricTypeName(availability?.biometricType || BiometricType.NONE)} authentication is now enabled for secure transactions.`
          );
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert('Failed to Enable', result.error || 'Could not enable biometric authentication');
        }
      } else {
        // Disable biometric
        Alert.alert(
          'Disable Biometric Authentication',
          'Are you sure you want to disable biometric authentication? You will need to use your PIN for all transactions.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Disable',
              style: 'destructive',
              onPress: async () => {
                await disableBiometric();
                setIsEnabled(false);
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to toggle biometric:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to update biometric settings');
    } finally {
      setToggling(false);
    }
  };

  const handleReEnroll = () => {
    Alert.alert(
      'Re-enroll Biometric',
      'This will disable and re-enable biometric authentication. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Re-enroll',
          onPress: async () => {
            setToggling(true);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            
            try {
              const result = await reEnrollBiometric();
              
              if (result.success) {
                setIsEnabled(true);
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Success', 'Biometric authentication has been re-enrolled');
              } else {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert('Failed', result.error || 'Failed to re-enroll biometric authentication');
              }
            } catch (error) {
              console.error('Failed to re-enroll:', error);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'Failed to re-enroll biometric authentication');
            } finally {
              setToggling(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const biometricTypeName = availability ? getBiometricTypeName(availability.biometricType) : 'Biometric';
  const biometricIcon = availability ? getBiometricIcon(availability.biometricType) : 'lock-closed';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={ds.colors.neutral.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Biometric Authentication</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          <>
            {/* Device Capability Card */}
            <View style={styles.capabilityCard}>
              <View style={styles.capabilityIcon}>
                <Ionicons name={biometricIcon} size={48} color={ds.colors.brand.primary} />
              </View>
              
              <Text style={styles.capabilityTitle}>
                {availability?.isAvailable ? biometricTypeName : 'Not Available'}
              </Text>
              
              {availability?.isAvailable && availability.isEnrolled ? (
                <View style={styles.statusBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={ds.colors.semantic.success} />
                  <Text style={styles.statusText}>Available & Enrolled</Text>
                </View>
              ) : availability?.isAvailable && !availability.isEnrolled ? (
                <View style={[styles.statusBadge, styles.statusBadgeWarning]}>
                  <Ionicons name="alert-circle" size={16} color={ds.colors.feedback.amber} />
                  <Text style={[styles.statusText, styles.statusTextWarning]}>Not Enrolled</Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, styles.statusBadgeError]}>
                  <Ionicons name="close-circle" size={16} color={ds.colors.semantic.error} />
                  <Text style={[styles.statusText, styles.statusTextError]}>Not Available</Text>
                </View>
              )}
              
              {availability?.supportedTypes && availability.supportedTypes.length > 1 && (
                <Text style={styles.supportedTypes}>
                  Also supports: {availability.supportedTypes
                    .filter(t => t !== availability.biometricType)
                    .map(getBiometricTypeName)
                    .join(', ')}
                </Text>
              )}
            </View>

            {/* Enable/Disable Toggle */}
            {availability?.isAvailable && availability.isEnrolled ? (
              <View style={styles.section}>
                <View style={styles.settingRow}>
                  <View style={styles.settingLeft}>
                    <View style={styles.settingIconBox}>
                      <Ionicons name={biometricIcon} size={20} color={ds.colors.brand.primary} />
                    </View>
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Enable {biometricTypeName}</Text>
                      <Text style={styles.settingDescription}>
                        Use {biometricTypeName.toLowerCase()} for quick and secure authentication
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={isEnabled}
                    onValueChange={handleToggleBiometric}
                    disabled={toggling}
                    trackColor={{
                      false: ds.colors.neutral.border,
                      true: ds.colors.brand.primary,
                    }}
                    thumbColor={ds.colors.neutral.surface}
                  />
                </View>
              </View>
            ) : null}

            {/* Re-enroll Option */}
            {availability?.isAvailable && availability.isEnrolled && isEnabled ? (
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleReEnroll}
                  disabled={toggling}
                  accessibilityLabel="Re-enroll biometric"
                >
                  <Ionicons name="refresh" size={20} color={ds.colors.brand.primary} />
                  <Text style={styles.actionButtonText}>Re-enroll {biometricTypeName}</Text>
                  <Ionicons name="chevron-forward" size={16} color={ds.colors.neutral.textTertiary} />
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Setup Instructions (if not enrolled) */}
            {availability?.isAvailable && !availability.isEnrolled ? (
              <View style={styles.instructionsCard}>
                <View style={styles.instructionsHeader}>
                  <Ionicons name="information-circle" size={24} color={ds.colors.brand.primary} />
                  <Text style={styles.instructionsTitle}>Setup Required</Text>
                </View>
                <Text style={styles.instructionsText}>{getSetupInstructions()}</Text>
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={handleOpenSettings}
                  accessibilityLabel="Open device settings"
                >
                  <Text style={styles.settingsButtonText}>Open Settings</Text>
                  <Ionicons name="open" size={16} color={ds.colors.brand.primary} />
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Not Available Info */}
            {!availability?.isAvailable ? (
              <View style={styles.infoCard}>
                <Ionicons name="information-circle" size={24} color={ds.colors.neutral.textSecondary} />
                <Text style={styles.infoText}>
                  {availability?.error || 'Biometric authentication is not available on this device.'}
                </Text>
              </View>
            ) : null}

            {/* Security Information */}
            <View style={styles.securitySection}>
              <Text style={styles.sectionTitle}>Security Information</Text>
              
              <View style={styles.securityItem}>
                <Ionicons name="shield-checkmark" size={20} color={ds.colors.brand.primary} />
                <Text style={styles.securityText}>
                  Biometric data never leaves your device and is stored securely in the device's secure enclave
                </Text>
              </View>
              
              <View style={styles.securityItem}>
                <Ionicons name="key" size={20} color={ds.colors.brand.primary} />
                <Text style={styles.securityText}>
                  You can always use your PIN as a fallback authentication method
                </Text>
              </View>
              
              <View style={styles.securityItem}>
                <Ionicons name="lock-closed" size={20} color={ds.colors.brand.primary} />
                <Text style={styles.securityText}>
                  Failed authentication attempts are tracked and your account will be locked after multiple failures
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: ds.colors.neutral.background,
  },
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
  backBtn: {
    padding: ds.spacing.sm,
  },
  headerTitle: {
    ...ds.typography.textStyles.h3,
    color: ds.colors.neutral.text,
  },
  headerRight: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: ds.spacing.lg,
    paddingVertical: ds.spacing.lg,
    paddingBottom: ds.spacing.xxl,
  },
  loadingText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.textSecondary,
    textAlign: 'center',
    marginTop: ds.spacing.xl,
  },
  capabilityCard: {
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.lg,
    padding: ds.spacing.xl,
    alignItems: 'center',
    marginBottom: ds.spacing.lg,
    ...ds.shadows.md,
  },
  capabilityIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: ds.colors.brand.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.spacing.md,
  },
  capabilityTitle: {
    ...ds.typography.textStyles.h2,
    color: ds.colors.neutral.text,
    marginBottom: ds.spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.xs,
    paddingHorizontal: ds.spacing.md,
    paddingVertical: ds.spacing.xs,
    backgroundColor: ds.colors.semantic.successLight,
    borderRadius: ds.radius.full,
  },
  statusBadgeWarning: {
    backgroundColor: ds.colors.feedback.amber100,
  },
  statusBadgeError: {
    backgroundColor: ds.colors.feedback.red100,
  },
  statusText: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.semantic.success,
    fontWeight: '600',
  },
  statusTextWarning: {
    color: ds.colors.feedback.amber,
  },
  statusTextError: {
    color: ds.colors.semantic.error,
  },
  supportedTypes: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
    marginTop: ds.spacing.sm,
  },
  section: {
    marginBottom: ds.spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    ...ds.shadows.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: ds.spacing.md,
  },
  settingIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: ds.colors.brand.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ds.spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    ...ds.typography.textStyles.body,
    color: ds.colors.neutral.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    ...ds.shadows.sm,
  },
  actionButtonText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.brand.primary,
    fontWeight: '600',
    flex: 1,
    marginLeft: ds.spacing.sm,
  },
  instructionsCard: {
    backgroundColor: ds.colors.brand.primaryLight,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    marginBottom: ds.spacing.lg,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.spacing.sm,
    marginBottom: ds.spacing.sm,
  },
  instructionsTitle: {
    ...ds.typography.textStyles.body,
    color: ds.colors.brand.primary,
    fontWeight: '600',
  },
  instructionsText: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.brand.primary,
    marginBottom: ds.spacing.md,
    lineHeight: 20,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.spacing.xs,
    paddingVertical: ds.spacing.sm,
    paddingHorizontal: ds.spacing.md,
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.sm,
  },
  settingsButtonText: {
    ...ds.typography.textStyles.body,
    color: ds.colors.brand.primary,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.spacing.sm,
    backgroundColor: ds.colors.neutral.surface,
    borderRadius: ds.radius.md,
    padding: ds.spacing.md,
    marginBottom: ds.spacing.lg,
    ...ds.shadows.sm,
  },
  infoText: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  securitySection: {
    marginTop: ds.spacing.lg,
  },
  sectionTitle: {
    ...ds.typography.textStyles.caption,
    color: ds.colors.neutral.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: ds.spacing.md,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.spacing.sm,
    marginBottom: ds.spacing.md,
  },
  securityText: {
    ...ds.typography.textStyles.bodySmall,
    color: ds.colors.neutral.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
});
