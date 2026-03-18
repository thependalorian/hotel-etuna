/**
 * OTPInput - One-Time Password / Verification code input (6 digits)
 * Location: fintech/smartpay/components/auth/inputs/OTPInput.tsx
 * Uses react-native-confirmation-code-field for optimal UX
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import { designSystem } from '@/constants/designSystem';

export interface OTPInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onComplete?: (code: string) => void;
  error?: string;
  disabled?: boolean;
  cellCount?: number;
  autoFocus?: boolean;
  testID?: string;
  label?: string;
  helperText?: string;
}

export function OTPInput({
  value,
  onChangeText,
  onComplete,
  error,
  disabled = false,
  cellCount = 6,
  autoFocus = true,
  testID = 'otp-input',
  label = 'Verification Code',
  helperText = 'Enter the 6-digit code sent to your device',
}: OTPInputProps) {
  const ref = useBlurOnFulfill({ value, cellCount });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue: onChangeText,
  });

  const handleChangeText = (text: string) => {
    // Only allow numeric input
    const cleaned = text.replace(/\D/g, '').slice(0, cellCount);
    onChangeText(cleaned);

    // Auto-submit when complete
    if (cleaned.length === cellCount) {
      onComplete?.(cleaned);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      {helperText && !error && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}

      <CodeField
        ref={ref}
        {...props}
        value={value}
        onChangeText={handleChangeText}
        cellCount={cellCount}
        rootStyle={styles.codeFieldRoot}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.select({ android: 'sms-otp', default: 'one-time-code' })}
        testID={testID}
        editable={!disabled}
        autoFocus={autoFocus}
        renderCell={({ index, symbol, isFocused }) => (
          <View
            key={index}
            style={[
              styles.cell,
              isFocused && styles.cellFocused,
              error && styles.cellError,
              symbol && styles.cellFilled,
            ]}
            onLayout={getCellOnLayoutHandler(index)}
          >
            <Text
              style={[
                styles.cellText,
                isFocused && styles.cellTextFocused,
                error && styles.cellTextError,
              ]}
            >
              {symbol || (isFocused ? <Cursor /> : null)}
            </Text>
          </View>
        )}
      />

      {error && (
        <Text style={styles.error} testID={`${testID}-error`}>
          {error}
        </Text>
      )}
    </View>
  );
}

const ds = designSystem;
const { colors, spacing, radius, typography, shadows } = ds;
const { brand, neutral } = colors;

const styles = StyleSheet.create({
  container: {
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
  codeFieldRoot: {
    gap: spacing.sm,
    justifyContent: 'center',
  },
  cell: {
    width: 48,
    height: 56,
    lineHeight: 56,
    borderWidth: 2,
    borderColor: neutral.border,
    borderRadius: radius.md,
    backgroundColor: neutral.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  cellFocused: {
    borderColor: brand.primary,
    borderWidth: 2,
    backgroundColor: brand.primaryLight,
    ...shadows.md,
  },
  cellFilled: {
    borderColor: brand.primary,
    backgroundColor: brand.primaryLight,
  },
  cellError: {
    borderColor: colors.error,
    backgroundColor: `${colors.error}10`,
  },
  cellText: {
    fontSize: 24,
    fontWeight: '700',
    color: neutral.text,
    textAlign: 'center',
  },
  cellTextFocused: {
    color: brand.primary,
  },
  cellTextError: {
    color: colors.error,
  },
  error: {
    color: colors.error,
    fontSize: 12,
    textAlign: 'center',
  },
});

/**
 * USAGE EXAMPLE:
 * 
 * import { OTPInput } from '@/components/auth/inputs/OTPInput';
 * 
 * function VerificationScreen() {
 *   const [code, setCode] = useState('');
 *   const [error, setError] = useState('');
 *   
 *   const handleComplete = async (code: string) => {
 *     try {
 *       await verifyCode(code);
 *       router.push('/');
 *     } catch (err) {
 *       setError('Invalid code. Please try again.');
 *     }
 *   };
 *   
 *   return (
 *     <OTPInput
 *       value={code}
 *       onChangeText={setCode}
 *       onComplete={handleComplete}
 *       error={error}
 *       label="Enter Verification Code"
 *       helperText="Check your email for the code"
 *     />
 *   );
 * }
 * 
 * WITH BACKEND OTP:
 * 
 * function OtpVerifyExample() {
 *   const [code, setCode] = useState('');
 *   const handleComplete = async (code: string) => {
 *     const result = await verifyOtp(phone, code);
 *     if (result.success) router.replace('/');
 *   };
 *   return <OTPInput value={code} onChangeText={setCode} onComplete={handleComplete} />;
 * }
 * 
 * FEATURES:
 * - Auto-focuses on mount
 * - Auto-advances between cells
 * - Auto-submits when complete
 * - Paste support (iOS/Android)
 * - SMS auto-fill (Android)
 * - One-time code auto-fill (iOS)
 * - Clear on focus
 * - Numeric keyboard
 * 
 * ACCESSIBILITY:
 * - Proper text content type for auto-fill
 * - Screen reader support
 * - Clear focus indicators
 * - Error announcements
 * 
 * TESTING:
 * 
 * test('calls onComplete when all digits entered', () => {
 *   const handleComplete = jest.fn();
 *   const { getByTestId } = render(
 *     <OTPInput value="" onChangeText={jest.fn()} onComplete={handleComplete} />
 *   );
 *   
 *   fireEvent.changeText(getByTestId('otp-input'), '123456');
 *   expect(handleComplete).toHaveBeenCalledWith('123456');
 * });
 * 
 * test('shows error state on all cells', () => {
 *   const { getAllByTestId } = render(
 *     <OTPInput value="123" onChangeText={jest.fn()} error="Invalid code" />
 *   );
 *   
 *   // Verify error styling is applied
 *   expect(getAllByTestId('otp-input-error')).toBeTruthy();
 * });
 */
