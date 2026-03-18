/**
 * PasswordInput - Password input with show/hide toggle and strength indicator
 * Location: fintech/smartpay/components/auth/inputs/PasswordInput.tsx
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { designSystem } from '@/constants/designSystem';

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4; // 0=very weak, 4=very strong
  feedback: string;
  color: string;
}

export interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  testID?: string;
  label?: string;
  required?: boolean;
  showStrength?: boolean;
  onStrengthChange?: (strength: PasswordStrength) => void;
  minLength?: number;
}

export function PasswordInput({
  value,
  onChangeText,
  error,
  disabled = false,
  placeholder = 'Enter password',
  autoFocus = false,
  testID = 'password-input',
  label = 'Password',
  required = false,
  showStrength = false,
  onStrengthChange,
  minLength = 8,
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [strength, setStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: '',
    color: designSystem.colors.neutral.border,
  });

  const calculateStrength = (password: string): PasswordStrength => {
    let score = 0;
    const { colors } = designSystem;

    if (!password) {
      return { score: 0, feedback: '', color: colors.neutral.border };
    }

    // Length check
    if (password.length >= minLength) score++;
    if (password.length >= 12) score++;

    // Character variety checks
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;

    // Cap at 4
    score = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;

    const strengthMap: Record<number, { feedback: string; color: string }> = {
      0: { feedback: '', color: colors.neutral.border },
      1: { feedback: 'Very weak', color: colors.error },
      2: { feedback: 'Weak', color: colors.warning },
      3: { feedback: 'Good', color: '#3b82f6' },
      4: { feedback: 'Strong', color: colors.success },
    };

    return { score, ...strengthMap[score] };
  };

  const handleChangeText = (text: string) => {
    onChangeText(text);
    
    if (showStrength) {
      const newStrength = calculateStrength(text);
      setStrength(newStrength);
      onStrengthChange?.(newStrength);
    }
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
        <Text style={styles.icon}>🔒</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={designSystem.colors.neutral.textSecondary}
          secureTextEntry={!isVisible}
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
          editable={!disabled}
          autoFocus={autoFocus}
          testID={testID}
          accessibilityLabel={label}
          accessibilityHint="Enter your password"
        />
        <Pressable
          onPress={() => setIsVisible(!isVisible)}
          style={styles.toggleButton}
          accessibilityLabel={isVisible ? 'Hide password' : 'Show password'}
          testID={`${testID}-toggle`}
        >
          <Text style={styles.toggleIcon}>{isVisible ? '👁️' : '👁️‍🗨️'}</Text>
        </Pressable>
      </View>

      {showStrength && value.length > 0 && (
        <View style={styles.strengthContainer}>
          <View style={styles.strengthBars}>
            {[1, 2, 3, 4].map((level) => (
              <View
                key={level}
                style={[
                  styles.strengthBar,
                  level <= strength.score && {
                    backgroundColor: strength.color,
                  },
                ]}
              />
            ))}
          </View>
          {strength.feedback && (
            <Text style={[styles.strengthText, { color: strength.color }]}>
              {strength.feedback}
            </Text>
          )}
        </View>
      )}

      {error && (
        <Text style={styles.error} testID={`${testID}-error`}>
          {error}
        </Text>
      )}

      {!error && showStrength && value.length > 0 && value.length < minLength && (
        <Text style={styles.hint}>
          Password must be at least {minLength} characters
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
  toggleButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
  toggleIcon: {
    fontSize: 20,
  },
  strengthContainer: {
    gap: spacing.xs,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: radius.sm,
    backgroundColor: neutral.border,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  error: {
    color: colors.error,
    fontSize: 12,
  },
  hint: {
    fontSize: 12,
    color: neutral.textSecondary,
  },
});

/**
 * USAGE EXAMPLE:
 * 
 * import { PasswordInput } from '@/components/auth/inputs/PasswordInput';
 * 
 * function SignUpScreen() {
 *   const [password, setPassword] = useState('');
 *   const [strength, setStrength] = useState<PasswordStrength>();
 *   
 *   return (
 *     <PasswordInput
 *       value={password}
 *       onChangeText={setPassword}
 *       onStrengthChange={setStrength}
 *       label="Create Password"
 *       required
 *       showStrength
 *       minLength={8}
 *     />
 *   );
 * }
 * 
 * PASSWORD STRENGTH ALGORITHM:
 * - Length >= 8: +1 point
 * - Length >= 12: +1 point
 * - Mixed case: +1 point
 * - Contains number: +1 point
 * - Contains special character: +1 point
 * - Max score: 4 (Strong)
 * 
 * VALIDATION RULES:
 * 
 * const validatePassword = (password: string) => {
 *   const errors: string[] = [];
 *   
 *   if (password.length < 8) {
 *     errors.push('At least 8 characters');
 *   }
 *   if (!/[a-z]/.test(password)) {
 *     errors.push('One lowercase letter');
 *   }
 *   if (!/[A-Z]/.test(password)) {
 *     errors.push('One uppercase letter');
 *   }
 *   if (!/\d/.test(password)) {
 *     errors.push('One number');
 *   }
 *   
 *   return errors.length === 0 ? null : errors.join(', ');
 * };
 * 
 * SECURITY CONSIDERATIONS:
 * - Never store passwords in plain text
 * - Use secure storage for cached credentials
 * - Implement rate limiting on password attempts
 * - Support password managers (auto-complete)
 * - Clear password on successful submission
 * 
 * ACCESSIBILITY:
 * - Toggle button clearly labeled
 * - Password strength announced to screen readers
 * - Proper text content type
 * - Auto-complete support
 * 
 * TESTING:
 * 
 * test('calculates password strength correctly', () => {
 *   const handleStrength = jest.fn();
 *   const { getByTestId, rerender } = render(
 *     <PasswordInput
 *       value=""
 *       onChangeText={jest.fn()}
 *       onStrengthChange={handleStrength}
 *       showStrength
 *     />
 *   );
 *   
 *   rerender(
 *     <PasswordInput
 *       value="MyP@ssw0rd123"
 *       onChangeText={jest.fn()}
 *       onStrengthChange={handleStrength}
 *       showStrength
 *     />
 *   );
 *   
 *   expect(handleStrength).toHaveBeenCalledWith(
 *     expect.objectContaining({ score: 4, feedback: 'Strong' })
 *   );
 * });
 * 
 * test('toggles password visibility', () => {
 *   const { getByTestId } = render(
 *     <PasswordInput value="secret" onChangeText={jest.fn()} />
 *   );
 *   
 *   const input = getByTestId('password-input');
 *   expect(input.props.secureTextEntry).toBe(true);
 *   
 *   fireEvent.press(getByTestId('password-input-toggle'));
 *   expect(input.props.secureTextEntry).toBe(false);
 * });
 */
