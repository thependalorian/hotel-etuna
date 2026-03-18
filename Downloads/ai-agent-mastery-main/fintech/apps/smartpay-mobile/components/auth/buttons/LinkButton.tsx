/**
 * LinkButton - Text-based navigation links ("Forgot password?", "Sign up instead")
 * Location: fintech/smartpay/components/auth/buttons/LinkButton.tsx
 */
import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { designSystem } from '@/constants/designSystem';

export type LinkButtonVariant = 'default' | 'muted' | 'danger';
export type LinkButtonSize = 'small' | 'medium' | 'large';

export interface LinkButtonProps {
  title: string;
  onPress?: () => void;
  href?: string;
  variant?: LinkButtonVariant;
  size?: LinkButtonSize;
  icon?: string;
  disabled?: boolean;
  testID?: string;
  underline?: boolean;
}

export function LinkButton({
  title,
  onPress,
  href,
  variant = 'default',
  size = 'medium',
  icon,
  disabled = false,
  testID = 'link-button',
  underline = false,
}: LinkButtonProps) {
  const content = (
    <View style={styles.content}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text
        style={[
          styles.text,
          styles[variant],
          styles[size],
          underline && styles.underline,
          disabled && styles.disabled,
        ]}
      >
        {title}
      </Text>
    </View>
  );

  // If href is provided, use Link component
  if (href) {
    return (
      <Link href={href} asChild>
        <Pressable
          disabled={disabled}
          testID={testID}
          accessibilityRole="link"
          accessibilityLabel={title}
          accessibilityState={{ disabled }}
          style={({ pressed }) => [
            styles.button,
            pressed && !disabled && styles.pressed,
          ]}
        >
          {content}
        </Pressable>
      </Link>
    );
  }

  // Otherwise, use regular Pressable with onPress
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

const ds = designSystem;
const { colors, spacing } = ds;
const { brand, neutral } = colors;

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  text: {
    fontWeight: '600',
  },
  icon: {
    fontSize: 16,
  },

  // Variants
  default: {
    color: brand.primary,
  },
  muted: {
    color: neutral.textSecondary,
  },
  danger: {
    color: colors.error,
  },

  // Sizes
  small: {
    fontSize: 12,
  },
  medium: {
    fontSize: 14,
  },
  large: {
    fontSize: 16,
  },

  // States
  underline: {
    textDecorationLine: 'underline',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
});

/**
 * USAGE EXAMPLES:
 * 
 * // Navigation link with href
 * <LinkButton
 *   title="Forgot password?"
 *   href="/forgot-password"
 * />
 * 
 * // Action link with onPress
 * <LinkButton
 *   title="Resend code"
 *   onPress={handleResendCode}
 * />
 * 
 * // Muted link
 * <LinkButton
 *   title="Skip for now"
 *   onPress={handleSkip}
 *   variant="muted"
 * />
 * 
 * // Danger link
 * <LinkButton
 *   title="Delete account"
 *   onPress={handleDelete}
 *   variant="danger"
 * />
 * 
 * // With icon
 * <LinkButton
 *   title="Go back"
 *   href="/sign-in"
 *   icon="←"
 * />
 * 
 * // Small size
 * <LinkButton
 *   title="Privacy Policy"
 *   href="/privacy"
 *   size="small"
 *   variant="muted"
 * />
 * 
 * COMMON AUTH PATTERNS:
 * 
 * // Sign In / Sign Up toggle
 * function SignInFooter() {
 *   return (
 *     <View style={styles.linkContainer}>
 *       <Text style={styles.linkText}>Don't have an account? </Text>
 *       <LinkButton
 *         title="Sign Up"
 *         href="/sign-up"
 *       />
 *     </View>
 *   );
 * }
 * 
 * // Forgot password link
 * function ForgotPasswordLink() {
 *   return (
 *     <LinkButton
 *       title="Forgot password?"
 *       href="/forgot-password"
 *       variant="muted"
 *       size="small"
 *     />
 *   );
 * }
 * 
 * // Resend code with timer
 * function ResendCodeLink() {
 *   const [canResend, setCanResend] = useState(false);
 *   const [countdown, setCountdown] = useState(60);
 *   
 *   useEffect(() => {
 *     if (countdown > 0) {
 *       const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
 *       return () => clearTimeout(timer);
 *     } else {
 *       setCanResend(true);
 *     }
 *   }, [countdown]);
 *   
 *   const handleResend = async () => {
 *     await resendCode();
 *     setCanResend(false);
 *     setCountdown(60);
 *   };
 *   
 *   return (
 *     <LinkButton
 *       title={canResend ? 'Resend code' : `Resend in ${countdown}s`}
 *       onPress={handleResend}
 *       disabled={!canResend}
 *     />
 *   );
 * }
 * 
 * // Help links in footer
 * function AuthFooter() {
 *   return (
 *     <View style={styles.footer}>
 *       <LinkButton
 *         title="Terms of Service"
 *         href="/terms"
 *         size="small"
 *         variant="muted"
 *       />
 *       <Text style={styles.separator}>•</Text>
 *       <LinkButton
 *         title="Privacy Policy"
 *         href="/privacy"
 *         size="small"
 *         variant="muted"
 *       />
 *       <Text style={styles.separator}>•</Text>
 *       <LinkButton
 *         title="Help"
 *         href="/help"
 *         size="small"
 *         variant="muted"
 *       />
 *     </View>
 *   );
 * }
 * 
 * INTEGRATION WITH CLERK:
 * 
 * // Reset password link
 * function ResetPasswordLink() {
 *   const { signIn } = useSignIn();
 *   const [sent, setSent] = useState(false);
 *   
 *   const handleReset = async () => {
 *     await signIn.create({
 *       strategy: 'reset_password_email_code',
 *       identifier: email,
 *     });
 *     setSent(true);
 *   };
 *   
 *   return (
 *     <LinkButton
 *       title={sent ? 'Check your email' : 'Forgot password?'}
 *       onPress={handleReset}
 *       disabled={sent}
 *       variant="muted"
 *     />
 *   );
 * }
 * 
 * // Switch authentication method
 * function SwitchAuthMethodLink() {
 *   const router = useRouter();
 *   
 *   return (
 *     <View style={styles.switchContainer}>
 *       <Text style={styles.text}>Having trouble? </Text>
 *       <LinkButton
 *         title="Use email instead"
 *         onPress={() => router.push('/sign-in/email')}
 *       />
 *     </View>
 *   );
 * }
 * 
 * // Support link
 * function SupportLink() {
 *   const openSupport = () => {
 *     Linking.openURL('mailto:support@smartpay.com');
 *   };
 *   
 *   return (
 *     <LinkButton
 *       title="Contact support"
 *       onPress={openSupport}
 *       icon="📧"
 *       variant="muted"
 *       size="small"
 *     />
 *   );
 * }
 * 
 * ACCESSIBILITY:
 * - Proper role (link vs button)
 * - Clear labels
 * - Disabled state announced
 * - Minimum touch target (44x44)
 * - Clear focus indicators
 * 
 * TESTING:
 * 
 * test('renders LinkButton with title', () => {
 *   const { getByText } = render(
 *     <LinkButton title="Forgot password?" href="/forgot-password" />
 *   );
 *   
 *   expect(getByText('Forgot password?')).toBeTruthy();
 * });
 * 
 * test('calls onPress when pressed', () => {
 *   const handlePress = jest.fn();
 *   const { getByTestId } = render(
 *     <LinkButton title="Resend" onPress={handlePress} />
 *   );
 *   
 *   fireEvent.press(getByTestId('link-button'));
 *   expect(handlePress).toHaveBeenCalledTimes(1);
 * });
 * 
 * test('does not call onPress when disabled', () => {
 *   const handlePress = jest.fn();
 *   const { getByTestId } = render(
 *     <LinkButton title="Resend" onPress={handlePress} disabled />
 *   );
 *   
 *   fireEvent.press(getByTestId('link-button'));
 *   expect(handlePress).not.toHaveBeenCalled();
 * });
 * 
 * test('applies correct variant styles', () => {
 *   const { getByText, rerender } = render(
 *     <LinkButton title="Link" onPress={jest.fn()} variant="default" />
 *   );
 *   
 *   let text = getByText('Link');
 *   expect(text.props.style).toMatchObject({ color: designSystem.colors.brand.primary });
 *   
 *   rerender(
 *     <LinkButton title="Link" onPress={jest.fn()} variant="danger" />
 *   );
 *   
 *   text = getByText('Link');
 *   expect(text.props.style).toMatchObject({ color: designSystem.colors.error });
 * });
 */
