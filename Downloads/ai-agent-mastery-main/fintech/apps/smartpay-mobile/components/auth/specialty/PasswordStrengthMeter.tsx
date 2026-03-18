/**
 * PasswordStrengthMeter - Visual password strength indicator
 * Location: fintech/smartpay/components/auth/specialty/PasswordStrengthMeter.tsx
 * Can be used standalone or with PasswordInput
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { designSystem } from '@/constants/designSystem';

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  feedback: string;
  color: string;
  suggestions?: string[];
}

export interface PasswordStrengthMeterProps {
  password: string;
  minLength?: number;
  showSuggestions?: boolean;
  testID?: string;
}

export function PasswordStrengthMeter({
  password,
  minLength = 8,
  showSuggestions = true,
  testID = 'password-strength-meter',
}: PasswordStrengthMeterProps) {
  const strength = calculateStrength(password, minLength);

  if (!password) return null;

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.barsContainer}>
        {[1, 2, 3, 4].map((level) => (
          <View
            key={level}
            style={[
              styles.bar,
              level <= strength.score && {
                backgroundColor: strength.color,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.feedbackContainer}>
        <Text style={[styles.feedback, { color: strength.color }]}>
          {strength.feedback}
        </Text>
      </View>

      {showSuggestions && strength.suggestions && strength.suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {strength.suggestions.map((suggestion, index) => (
            <Text key={index} style={styles.suggestion}>
              • {suggestion}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function calculateStrength(
  password: string,
  minLength: number
): PasswordStrength {
  const { colors } = designSystem;
  let score = 0;
  const suggestions: string[] = [];

  if (!password) {
    return {
      score: 0,
      feedback: '',
      color: colors.neutral.border,
      suggestions: [],
    };
  }

  // Length checks
  if (password.length >= minLength) {
    score++;
  } else {
    suggestions.push(`Use at least ${minLength} characters`);
  }

  if (password.length >= 12) {
    score++;
  }

  // Character variety checks
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z\d]/.test(password);

  if (hasLower && hasUpper) {
    score++;
  } else {
    if (!hasLower) suggestions.push('Add lowercase letters');
    if (!hasUpper) suggestions.push('Add uppercase letters');
  }

  if (hasNumber) {
    score++;
  } else {
    suggestions.push('Add numbers');
  }

  if (hasSpecial) {
    score++;
  } else {
    suggestions.push('Add special characters (!@#$%^&*)');
  }

  // Cap at 4
  score = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;

  const strengthMap: Record<
    number,
    { feedback: string; color: string }
  > = {
    0: { feedback: '', color: colors.neutral.border },
    1: { feedback: 'Very weak', color: colors.error },
    2: { feedback: 'Weak', color: colors.warning },
    3: { feedback: 'Good', color: '#3b82f6' },
    4: { feedback: 'Strong', color: colors.success },
  };

  return {
    score,
    ...strengthMap[score],
    suggestions: score < 4 ? suggestions.slice(0, 2) : [],
  };
}

const ds = designSystem;
const { colors, spacing, radius } = ds;
const { neutral } = colors;

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  barsContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: radius.sm,
    backgroundColor: neutral.border,
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedback: {
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionsContainer: {
    gap: spacing.xs / 2,
  },
  suggestion: {
    fontSize: 12,
    color: neutral.textSecondary,
    lineHeight: 16,
  },
});

/**
 * USAGE EXAMPLES:
 * 
 * // Basic usage
 * const [password, setPassword] = useState('');
 * 
 * <TextInput
 *   value={password}
 *   onChangeText={setPassword}
 *   secureTextEntry
 * />
 * <PasswordStrengthMeter password={password} />
 * 
 * // Custom minimum length
 * <PasswordStrengthMeter
 *   password={password}
 *   minLength={12}
 * />
 * 
 * // Without suggestions
 * <PasswordStrengthMeter
 *   password={password}
 *   showSuggestions={false}
 * />
 * 
 * // With callback
 * function PasswordWithStrength() {
 *   const [password, setPassword] = useState('');
 *   const strength = calculateStrength(password, 8);
 *   
 *   const canSubmit = strength.score >= 3;
 *   
 *   return (
 *     <>
 *       <PasswordInput
 *         value={password}
 *         onChangeText={setPassword}
 *       />
 *       <PasswordStrengthMeter password={password} />
 *       <AuthButton
 *         title="Continue"
 *         onPress={handleSubmit}
 *         disabled={!canSubmit}
 *       />
 *     </>
 *   );
 * }
 */

// Export strength calculation for external use
export { calculateStrength };
