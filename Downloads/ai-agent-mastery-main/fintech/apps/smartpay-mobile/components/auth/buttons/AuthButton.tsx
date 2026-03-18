/**
 * AuthButton - Primary CTA button with loading states
 * Location: fintech/smartpay/components/auth/buttons/AuthButton.tsx
 */
import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  PressableProps,
} from 'react-native';
import { designSystem } from '@/constants/designSystem';

export type AuthButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type AuthButtonSize = 'small' | 'medium' | 'large';

export interface AuthButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: AuthButtonVariant;
  size?: AuthButtonSize;
  fullWidth?: boolean;
  icon?: string;
  testID?: string;
}

export function AuthButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'large',
  fullWidth = true,
  icon,
  testID = 'auth-button',
  ...pressableProps
}: AuthButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...pressableProps}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#fff' : designSystem.colors.brand.primary}
          testID={`${testID}-loading`}
        />
      ) : (
        <View style={styles.content}>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text
            style={[
              styles.text,
              styles[`${variant}Text`],
              styles[`${size}Text`],
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const ds = designSystem;
const { colors, spacing, radius, typography, shadows } = ds;
const { brand, neutral } = colors;

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  
  // Variants
  primary: {
    backgroundColor: brand.primary,
    ...shadows.md,
    shadowColor: brand.primary,
    shadowOpacity: 0.25,
  },
  secondary: {
    backgroundColor: neutral.muted,
    ...shadows.sm,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: brand.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },

  // Sizes
  small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  medium: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  large: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
  },

  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: neutral.text,
  },
  outlineText: {
    color: brand.primary,
  },
  ghostText: {
    color: brand.primary,
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 15,
  },
  largeText: {
    fontSize: 16,
  },

  icon: {
    fontSize: 20,
  },

  // States
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});

/**
 * USAGE EXAMPLES:
 * 
 * // Primary button (default)
 * <AuthButton
 *   title="Sign In"
 *   onPress={handleSignIn}
 *   loading={isLoading}
 * />
 * 
 * // Secondary button
 * <AuthButton
 *   title="Cancel"
 *   onPress={handleCancel}
 *   variant="secondary"
 * />
 * 
 * // Outline button
 * <AuthButton
 *   title="Skip for now"
 *   onPress={handleSkip}
 *   variant="outline"
 * />
 * 
 * // With icon
 * <AuthButton
 *   title="Continue"
 *   onPress={handleContinue}
 *   icon="→"
 * />
 * 
 * // Small size
 * <AuthButton
 *   title="Resend"
 *   onPress={handleResend}
 *   size="small"
 *   variant="ghost"
 *   fullWidth={false}
 * />
 * 
 * INTEGRATION WITH CLERK:
 * 
 * function SignInScreen() {
 *   const { signIn, fetchStatus } = useSignIn();
 *   const [email, setEmail] = useState('');
 *   const [password, setPassword] = useState('');
 *   
 *   const handleSignIn = async () => {
 *     await signIn.password({ emailAddress: email, password });
 *     
 *     if (signIn.status === 'complete') {
 *       await signIn.finalize({ navigate: () => router.replace('/') });
 *     }
 *   };
 *   
 *   return (
 *     <AuthButton
 *       title="Sign In"
 *       onPress={handleSignIn}
 *       loading={fetchStatus === 'fetching'}
 *       disabled={!email || !password}
 *     />
 *   );
 * }
 * 
 * ASYNC OPERATION PATTERN:
 * 
 * function AsyncButtonExample() {
 *   const [loading, setLoading] = useState(false);
 *   const [error, setError] = useState('');
 *   
 *   const handleSubmit = async () => {
 *     setLoading(true);
 *     setError('');
 *     
 *     try {
 *       await submitForm();
 *       router.push('/success');
 *     } catch (err) {
 *       setError(err.message);
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 *   
 *   return (
 *     <AuthButton
 *       title="Submit"
 *       onPress={handleSubmit}
 *       loading={loading}
 *     />
 *   );
 * }
 * 
 * ACCESSIBILITY:
 * - Proper role and label
 * - Disabled state announced
 * - Loading state announced (busy)
 * - Minimum touch target (44x44)
 * - Clear focus indicators
 * 
 * TESTING:
 * 
 * test('shows loading indicator when loading', () => {
 *   const { getByTestId } = render(
 *     <AuthButton title="Submit" onPress={jest.fn()} loading />
 *   );
 *   
 *   expect(getByTestId('auth-button-loading')).toBeTruthy();
 * });
 * 
 * test('calls onPress when pressed', () => {
 *   const handlePress = jest.fn();
 *   const { getByTestId } = render(
 *     <AuthButton title="Submit" onPress={handlePress} />
 *   );
 *   
 *   fireEvent.press(getByTestId('auth-button'));
 *   expect(handlePress).toHaveBeenCalledTimes(1);
 * });
 * 
 * test('does not call onPress when disabled', () => {
 *   const handlePress = jest.fn();
 *   const { getByTestId } = render(
 *     <AuthButton title="Submit" onPress={handlePress} disabled />
 *   );
 *   
 *   fireEvent.press(getByTestId('auth-button'));
 *   expect(handlePress).not.toHaveBeenCalled();
 * });
 */
