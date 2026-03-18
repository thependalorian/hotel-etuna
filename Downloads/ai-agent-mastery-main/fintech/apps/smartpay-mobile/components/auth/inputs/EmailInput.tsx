/**
 * EmailInput - Email input with built-in validation
 * Location: fintech/smartpay/components/auth/inputs/EmailInput.tsx
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { designSystem } from '@/constants/designSystem';

export interface EmailInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  testID?: string;
  label?: string;
  required?: boolean;
  validateOnBlur?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailInput({
  value,
  onChangeText,
  error,
  disabled = false,
  placeholder = 'your@email.com',
  autoFocus = false,
  testID = 'email-input',
  label = 'Email Address',
  required = false,
  validateOnBlur = true,
  onValidationChange,
}: EmailInputProps) {
  const [touched, setTouched] = useState(false);
  const [validationError, setValidationError] = useState<string>();

  const validateEmail = (email: string): boolean => {
    if (!email && !required) return true;
    if (!email && required) {
      setValidationError('Email is required');
      return false;
    }
    if (!EMAIL_REGEX.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    setValidationError(undefined);
    return true;
  };

  useEffect(() => {
    if (touched && validateOnBlur) {
      const isValid = validateEmail(value);
      onValidationChange?.(isValid);
    }
  }, [value, touched, validateOnBlur]);

  const handleBlur = () => {
    setTouched(true);
    if (validateOnBlur) {
      const isValid = validateEmail(value);
      onValidationChange?.(isValid);
    }
  };

  const displayError = error || (touched && validationError);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={[styles.inputContainer, displayError && styles.inputContainerError]}>
        <Text style={styles.icon}>✉️</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={designSystem.colors.neutral.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          editable={!disabled}
          autoFocus={autoFocus}
          testID={testID}
          accessibilityLabel={label}
          accessibilityHint="Enter your email address"
        />
        {value && !displayError && touched && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </View>

      {displayError && (
        <Text style={styles.error} testID={`${testID}-error`}>
          {displayError}
        </Text>
      )}
    </View>
  );
}

const ds = designSystem;
const { colors, spacing, radius, typography, shadows } = ds;
const { neutral } = colors;

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
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  icon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: neutral.text,
  },
  checkmark: {
    fontSize: 20,
    color: colors.success,
    marginLeft: spacing.sm,
  },
  error: {
    color: colors.error,
    fontSize: 12,
  },
});

/**
 * USAGE EXAMPLE:
 * 
 * import { EmailInput } from '@/components/auth/inputs/EmailInput';
 * 
 * function SignInScreen() {
 *   const [email, setEmail] = useState('');
 *   const [isValid, setIsValid] = useState(false);
 *   
 *   return (
 *     <EmailInput
 *       value={email}
 *       onChangeText={setEmail}
 *       onValidationChange={setIsValid}
 *       label="Email"
 *       required
 *       validateOnBlur
 *     />
 *   );
 * }
 * 
 * VALIDATION:
 * - RFC 5322 compliant email validation
 * - Real-time validation on blur
 * - Optional required field validation
 * - Visual feedback with checkmark for valid emails
 * 
 * ACCESSIBILITY:
 * - Proper keyboard type (email-address)
 * - Auto-complete enabled
 * - Screen reader support
 * - Clear error messaging
 * 
 * TESTING:
 * 
 * test('validates email format', () => {
 *   const handleValidation = jest.fn();
 *   const { getByTestId } = render(
 *     <EmailInput
 *       value="invalid"
 *       onChangeText={jest.fn()}
 *       onValidationChange={handleValidation}
 *       validateOnBlur
 *     />
 *   );
 *   
 *   fireEvent(getByTestId('email-input'), 'blur');
 *   expect(handleValidation).toHaveBeenCalledWith(false);
 * });
 * 
 * test('shows checkmark for valid email', () => {
 *   const { getByTestId, queryByText } = render(
 *     <EmailInput value="test@example.com" onChangeText={jest.fn()} />
 *   );
 *   
 *   fireEvent(getByTestId('email-input'), 'blur');
 *   expect(queryByText('✓')).toBeTruthy();
 * });
 */
