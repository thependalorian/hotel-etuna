/**
 * Lock screen – Re-secure after background. User re-enters PIN or re-auth.
 * Enhanced with haptic feedback and shake animation on wrong PIN.
 * PRD §4.7.2, §6.4, §6.6. Location: fintech/smartpay/app/(authenticated)/(modals)/lock.tsx
 */
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { CodeField, Cursor, useBlurOnFulfill, useClearByFocusCell } from 'react-native-confirmation-code-field';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSequence, 
  withTiming, 
  withRepeat 
} from 'react-native-reanimated';
import { clearInactivityTime } from '@/services/inactivityStorage';
import { designSystem } from '@/constants/designSystem';

const PIN_LENGTH = 6;
const INACTIVITY_KEY = 'startTime';
const SHAKE_OFFSET = 10;
const SHAKE_DURATION = 80;

export default function LockScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  const shakeOffset = useSharedValue(0);

  const ref = useBlurOnFulfill({ value: pin, cellCount: PIN_LENGTH });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({ value: pin, setValue: setPin });

  const shakeAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shakeOffset.value }],
    };
  });

  useEffect(() => {
    checkBiometricAvailability();
    promptBiometricOnMount();
  }, []);

  useEffect(() => {
    if (pin.length > 0 && pin.length <= PIN_LENGTH) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (pin.length === PIN_LENGTH) {
      handlePinUnlock();
    }
  }, [pin]);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBiometric(hasHardware && isEnrolled);
    } catch (error) {
      console.error('Biometric check error:', error);
      setHasBiometric(false);
    }
  };

  const promptBiometricOnMount = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (hasHardware && isEnrolled) {
        setTimeout(() => {
          handleBiometricUnlock();
        }, 500);
      }
    } catch (error) {
      console.error('Auto biometric error:', error);
    }
  };

  const handleBiometricUnlock = async () => {
    if (isVerifying) return;
    
    setIsVerifying(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock SmartPay',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });
      
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        handleUnlockSuccess();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Authentication failed', 'Please try again or use your PIN.');
      }
    } catch (error) {
      console.error('Biometric error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Biometric authentication failed. Please use your PIN.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePinUnlock = () => {
    if (pin.length === PIN_LENGTH) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleUnlockSuccess();
    } else {
      shakeOffset.value = withSequence(
        withTiming(-SHAKE_OFFSET, { duration: SHAKE_DURATION }),
        withRepeat(withTiming(SHAKE_OFFSET, { duration: SHAKE_DURATION }), 4, true),
        withTiming(0, { duration: SHAKE_DURATION })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid PIN', `Please enter your ${PIN_LENGTH}-digit PIN.`);
      setPin('');
    }
  };

  const handleUnlockSuccess = () => {
    setPin('');
    clearInactivityTime().then(() => router.back());
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="lock-closed" size={48} color={designSystem.colors.brand.primary} />
          <Text style={styles.title}>App Locked</Text>
          <Text style={styles.description}>
            For your security, please confirm it's you to continue.
          </Text>
        </View>

        <View style={styles.authSection}>
          {hasBiometric && (
            <>
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricUnlock}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color={designSystem.colors.brand.primary} />
                ) : (
                  <View style={styles.biometricContent}>
                    <Ionicons 
                      name='finger-print'
                      size={32} 
                      color={designSystem.colors.brand.primary} 
                    />
                    <Text style={styles.biometricText}>
                      {Platform.OS === 'ios' ? 'Use Face ID / Touch ID' : 'Use Fingerprint'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.orText}>— or enter PIN —</Text>
            </>
          )}

          <Text style={styles.pinLabel}>Enter your {PIN_LENGTH}-digit PIN</Text>
          <Animated.View style={shakeAnimatedStyle}>
            <CodeField
              ref={ref}
              {...props}
              value={pin}
              onChangeText={setPin}
              cellCount={PIN_LENGTH}
              rootStyle={styles.codeFieldRoot}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoFocus={!hasBiometric}
              renderCell={({ index, symbol, isFocused }) => (
                <View 
                  key={index} 
                  onLayout={getCellOnLayoutHandler(index)} 
                  style={[styles.cell, isFocused && styles.cellFocused]}
                >
                  <Text style={styles.cellText}>
                    {symbol ? '•' : (isFocused ? <Cursor /> : null)}
                  </Text>
                </View>
              )}
            />
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Having trouble? Contact support
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: designSystem.colors.neutral.background 
  },
  container: { 
    flex: 1, 
    padding: designSystem.spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: designSystem.spacing.xxl,
  },
  title: {
    ...designSystem.typography.textStyles.largeTitle,
    color: designSystem.colors.neutral.text,
    marginTop: designSystem.spacing.lg,
    marginBottom: designSystem.spacing.sm,
  },
  description: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.neutral.textSecondary,
    textAlign: 'center',
    paddingHorizontal: designSystem.spacing.xl,
  },
  authSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricButton: {
    width: '100%',
    padding: designSystem.spacing.lg,
    backgroundColor: designSystem.colors.neutral.surface,
    borderRadius: designSystem.radius.md,
    alignItems: 'center',
    marginBottom: designSystem.spacing.lg,
    borderWidth: 2,
    borderColor: designSystem.colors.brand.primary,
    ...designSystem.shadows.md,
  },
  biometricContent: {
    alignItems: 'center',
    gap: designSystem.spacing.sm,
  },
  biometricText: { 
    ...designSystem.typography.textStyles.button, 
    color: designSystem.colors.brand.primary,
    fontSize: 18,
  },
  orText: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.neutral.textSecondary,
    textAlign: 'center',
    marginBottom: designSystem.spacing.lg,
  },
  pinLabel: {
    ...designSystem.typography.textStyles.body,
    color: designSystem.colors.neutral.textSecondary,
    marginBottom: designSystem.spacing.md,
    textAlign: 'center',
  },
  codeFieldRoot: { 
    width: '100%',
    gap: designSystem.spacing.sm,
  },
  cell: { 
    flex: 1,
    height: 60, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: designSystem.colors.neutral.surface, 
    borderRadius: designSystem.radius.md,
    borderWidth: 2,
    borderColor: designSystem.colors.neutral.border,
    ...designSystem.shadows.sm,
  },
  cellFocused: { 
    borderWidth: 2, 
    borderColor: designSystem.colors.brand.primary,
    backgroundColor: designSystem.colors.neutral.surface,
    transform: [{ scale: 1.05 }],
  },
  cellText: { 
    color: designSystem.colors.neutral.text, 
    fontSize: 36,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: designSystem.spacing.lg,
  },
  footerText: {
    ...designSystem.typography.textStyles.caption,
    color: designSystem.colors.neutral.textSecondary,
  },
});
