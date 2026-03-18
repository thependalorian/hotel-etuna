/**
 * PINInput - Numeric PIN input (4-6 digits) for fintech authentication
 * Location: fintech/smartpay/components/auth/inputs/PINInput.tsx
 * Common for mobile money, banking apps in African markets
 */
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { designSystem } from '@/constants/designSystem';

export interface PINInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onComplete?: (pin: string) => void;
  error?: string;
  disabled?: boolean;
  pinLength?: 4 | 5 | 6;
  autoFocus?: boolean;
  testID?: string;
  label?: string;
  helperText?: string;
  secureTextEntry?: boolean;
  enableVibration?: boolean;
}

export function PINInput({
  value,
  onChangeText,
  onComplete,
  error,
  disabled = false,
  pinLength = 4,
  autoFocus = true,
  testID = 'pin-input',
  label = 'Enter PIN',
  helperText,
  secureTextEntry = true,
  enableVibration = true,
}: PINInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const handleChangeText = (text: string) => {
    // Only allow numeric input
    const cleaned = text.replace(/\D/g, '').slice(0, pinLength);
    onChangeText(cleaned);

    // Auto-complete when PIN is fully entered
    if (cleaned.length === pinLength) {
      onComplete?.(cleaned);
    }
  };

  const shake = () => {
    if (enableVibration && Platform.OS !== 'web') {
      Vibration.vibrate(100);
    }

    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  React.useEffect(() => {
    if (error) {
      shake();
    }
  }, [error]);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const renderDots = () => {
    return Array.from({ length: pinLength }).map((_, index) => {
      const isFilled = index < value.length;
      const isActive = index === value.length && isFocused;

      return (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            isFilled && styles.dotFilled,
            isActive && styles.dotActive,
            error && styles.dotError,
            { transform: [{ translateX: shakeAnimation }] },
          ]}
        >
          {isFilled && !secureTextEntry && (
            <Text style={styles.dotText}>{value[index]}</Text>
          )}
          {isFilled && secureTextEntry && <View style={styles.dotInner} />}
        </Animated.View>
      );
    });
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      {helperText && !error && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}

      <Pressable onPress={focusInput} style={styles.dotsContainer}>
        {renderDots()}
      </Pressable>

      {error && (
        <Text style={styles.error} testID={`${testID}-error`}>
          {error}
        </Text>
      )}

      {/* Hidden input for keyboard handling */}
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        keyboardType="number-pad"
        maxLength={pinLength}
        secureTextEntry={false} // We handle masking visually
        editable={!disabled}
        autoFocus={autoFocus}
        testID={testID}
        accessibilityLabel={label}
        accessibilityHint={`Enter your ${pinLength}-digit PIN`}
        caretHidden
      />
    </View>
  );
}

const ds = designSystem;
const { colors, spacing, radius, typography, shadows } = ds;
const { brand, neutral } = colors;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
  },
  label: {
    ...typography.textStyles.h3,
    color: neutral.text,
    textAlign: 'center',
  },
  helperText: {
    fontSize: 14,
    color: neutral.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  dot: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: neutral.border,
    backgroundColor: neutral.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  dotFilled: {
    borderColor: brand.primary,
    backgroundColor: brand.primaryLight,
    ...shadows.md,
  },
  dotActive: {
    borderColor: brand.primary,
    borderWidth: 2.5,
    ...shadows.md,
  },
  dotError: {
    borderColor: colors.error,
    backgroundColor: `${colors.error}10`,
  },
  dotInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: brand.primary,
  },
  dotText: {
    fontSize: 24,
    fontWeight: '700',
    color: brand.primary,
  },
  error: {
    color: colors.error,
    fontSize: 12,
    textAlign: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },
});

/**
 * USAGE EXAMPLE:
 * 
 * import { PINInput } from '@/components/auth/inputs/PINInput';
 * 
 * function CreatePINScreen() {
 *   const [pin, setPin] = useState('');
 *   const [error, setError] = useState('');
 *   
 *   const handleComplete = async (pin: string) => {
 *     try {
 *       await savePIN(pin);
 *       router.push('/dashboard');
 *     } catch (err) {
 *       setError('Failed to set PIN');
 *       setPin(''); // Clear for retry
 *     }
 *   };
 *   
 *   return (
 *     <PINInput
 *       value={pin}
 *       onChangeText={setPin}
 *       onComplete={handleComplete}
 *       error={error}
 *       label="Create Your PIN"
 *       helperText="Choose a 4-digit PIN for quick access"
 *       pinLength={4}
 *       secureTextEntry
 *     />
 *   );
 * }
 * 
 * PIN CONFIRMATION PATTERN:
 * 
 * function PINConfirmationFlow() {
 *   const [step, setStep] = useState<'create' | 'confirm'>('create');
 *   const [firstPIN, setFirstPIN] = useState('');
 *   const [confirmPIN, setConfirmPIN] = useState('');
 *   const [error, setError] = useState('');
 *   
 *   const handleCreateComplete = (pin: string) => {
 *     setFirstPIN(pin);
 *     setStep('confirm');
 *   };
 *   
 *   const handleConfirmComplete = (pin: string) => {
 *     if (pin === firstPIN) {
 *       savePIN(pin);
 *       router.push('/dashboard');
 *     } else {
 *       setError('PINs do not match');
 *       setConfirmPIN('');
 *     }
 *   };
 *   
 *   if (step === 'create') {
 *     return (
 *       <PINInput
 *         value={firstPIN}
 *         onChangeText={setFirstPIN}
 *         onComplete={handleCreateComplete}
 *         label="Create PIN"
 *       />
 *     );
 *   }
 *   
 *   return (
 *     <PINInput
 *       value={confirmPIN}
 *       onChangeText={setConfirmPIN}
 *       onComplete={handleConfirmComplete}
 *       error={error}
 *       label="Confirm PIN"
 *     />
 *   );
 * }
 * 
 * SECURE STORAGE (with expo-secure-store):
 * 
 * import * as SecureStore from 'expo-secure-store';
 * import * as Crypto from 'expo-crypto';
 * 
 * const savePIN = async (pin: string) => {
 *   // Hash the PIN before storing
 *   const hashed = await Crypto.digestStringAsync(
 *     Crypto.CryptoDigestAlgorithm.SHA256,
 *     pin
 *   );
 *   await SecureStore.setItemAsync('user_pin', hashed);
 * };
 * 
 * const verifyPIN = async (pin: string): Promise<boolean> => {
 *   const stored = await SecureStore.getItemAsync('user_pin');
 *   if (!stored) return false;
 *   
 *   const hashed = await Crypto.digestStringAsync(
 *     Crypto.CryptoDigestAlgorithm.SHA256,
 *     pin
 *   );
 *   return hashed === stored;
 * };
 * 
 * FEATURES:
 * - Visual feedback with dot animation
 * - Haptic feedback on error (vibration)
 * - Auto-submit on completion
 * - Secure masking option
 * - Shake animation for errors
 * - Numeric keyboard
 * - Hidden input for accessibility
 * 
 * SECURITY BEST PRACTICES:
 * - Always hash PINs before storage
 * - Use expo-secure-store for sensitive data
 * - Implement rate limiting (3-5 attempts)
 * - Add biometric fallback option
 * - Clear PIN after successful auth
 * - Timeout after multiple failed attempts
 * 
 * RATE LIMITING EXAMPLE:
 * 
 * const MAX_ATTEMPTS = 3;
 * const [attempts, setAttempts] = useState(0);
 * const [isLocked, setIsLocked] = useState(false);
 * 
 * const handleComplete = async (pin: string) => {
 *   if (isLocked) return;
 *   
 *   const isValid = await verifyPIN(pin);
 *   
 *   if (isValid) {
 *     setAttempts(0);
 *     router.push('/dashboard');
 *   } else {
 *     const newAttempts = attempts + 1;
 *     setAttempts(newAttempts);
 *     
 *     if (newAttempts >= MAX_ATTEMPTS) {
 *       setIsLocked(true);
 *       setTimeout(() => {
 *         setIsLocked(false);
 *         setAttempts(0);
 *       }, 30000); // 30 second lockout
 *     }
 *     
 *     setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining`);
 *     setPin('');
 *   }
 * };
 * 
 * ACCESSIBILITY:
 * - Hidden input for screen reader support
 * - Proper labels and hints
 * - Focus management
 * - Clear error announcements
 * 
 * TESTING:
 * 
 * test('calls onComplete when PIN fully entered', () => {
 *   const handleComplete = jest.fn();
 *   const { getByTestId } = render(
 *     <PINInput value="" onChangeText={jest.fn()} onComplete={handleComplete} pinLength={4} />
 *   );
 *   
 *   fireEvent.changeText(getByTestId('pin-input'), '1234');
 *   expect(handleComplete).toHaveBeenCalledWith('1234');
 * });
 * 
 * test('shakes on error', () => {
 *   const { rerender } = render(
 *     <PINInput value="1234" onChangeText={jest.fn()} />
 *   );
 *   
 *   rerender(
 *     <PINInput value="1234" onChangeText={jest.fn()} error="Invalid PIN" />
 *   );
 *   
 *   // Verify shake animation is triggered
 *   // This would require testing animation callbacks
 * });
 */
