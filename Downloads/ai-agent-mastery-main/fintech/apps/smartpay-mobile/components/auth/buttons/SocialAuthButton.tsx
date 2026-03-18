/**
 * SocialAuthButton - Social authentication buttons (Google, Apple, etc.)
 * Location: fintech/smartpay/components/auth/buttons/SocialAuthButton.tsx
 */
import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Platform,
} from 'react-native';
import { designSystem } from '@/constants/designSystem';

export type SocialProvider = 'google' | 'apple' | 'facebook' | 'github';

export interface SocialAuthButtonProps {
  provider: SocialProvider;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  testID?: string;
}

const providerConfig: Record<SocialProvider, {
  label: string;
  icon: string;
  backgroundColor: string;
  textColor: string;
}> = {
  google: {
    label: 'Continue with Google',
    icon: '🔍', // In production, use SVG icon
    backgroundColor: '#fff',
    textColor: '#1f1f1f',
  },
  apple: {
    label: 'Continue with Apple',
    icon: '', // Apple logo
    backgroundColor: '#000',
    textColor: '#fff',
  },
  facebook: {
    label: 'Continue with Facebook',
    icon: '📘',
    backgroundColor: '#1877F2',
    textColor: '#fff',
  },
  github: {
    label: 'Continue with GitHub',
    icon: '🐙',
    backgroundColor: '#24292e',
    textColor: '#fff',
  },
};

export function SocialAuthButton({
  provider,
  onPress,
  loading = false,
  disabled = false,
  fullWidth = true,
  testID = `social-auth-${provider}`,
}: SocialAuthButtonProps) {
  const config = providerConfig[provider];
  const isDisabled = disabled || loading;

  // Apple Sign In only available on iOS
  if (provider === 'apple' && Platform.OS === 'android') {
    return null;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={config.label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: config.backgroundColor,
        },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={config.textColor}
          testID={`${testID}-loading`}
        />
      ) : (
        <View style={styles.content}>
          <Text style={styles.icon}>{config.icon}</Text>
          <Text
            style={[
              styles.text,
              { color: config.textColor },
            ]}
          >
            {config.label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const ds = designSystem;
const { spacing, radius, shadows } = ds;

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: designSystem.colors.neutral.border,
    ...shadows.sm,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    fontSize: 20,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
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
 * // Google Sign In
 * <SocialAuthButton
 *   provider="google"
 *   onPress={handleGoogleSignIn}
 *   loading={isGoogleLoading}
 * />
 * 
 * // Apple Sign In (iOS only)
 * <SocialAuthButton
 *   provider="apple"
 *   onPress={handleAppleSignIn}
 *   loading={isAppleLoading}
 * />
 * 
 * // Multiple providers
 * function SocialAuthOptions() {
 *   return (
 *     <View style={{ gap: 12 }}>
 *       <SocialAuthButton provider="google" onPress={handleGoogleSignIn} />
 *       <SocialAuthButton provider="apple" onPress={handleAppleSignIn} />
 *     </View>
 *   );
 * }
 * 
 * OPTIONAL OAUTH (e.g. Supabase Auth or custom backend):
 * 
 * Use SocialAuthButton with onPress that calls your backend or Supabase
 * OAuth flow (e.g. signInWithOAuth), then set tokens and router.replace('/').
 * Install expo-web-browser for redirects. Configure app.json scheme and
 * your OAuth provider redirect URLs (e.g. smartpay://oauth-callback).
 * 
 * ERROR HANDLING:
 * 
 * const handleOAuth = async (provider: 'google' | 'apple') => {
 *   try {
 *     const { startOAuthFlow } = useOAuth({ 
 *       strategy: `oauth_${provider}` 
 *     });
 *     
 *     const { createdSessionId, setActive, signUp, signIn } = await startOAuthFlow();
 *     
 *     if (createdSessionId) {
 *       await setActive({ session: createdSessionId });
 *       
 *       // Check if this is a new user
 *       if (signUp?.createdSessionId) {
 *         // New user - redirect to onboarding
 *         router.push('/onboarding');
 *       } else {
 *         // Returning user - go to dashboard
 *         router.replace('/dashboard');
 *       }
 *     }
 *   } catch (err) {
 *     // Handle specific OAuth errors
 *     if (err.code === 'user_cancelled') {
 *       // User cancelled the OAuth flow
 *       return;
 *     }
 *     
 *     if (err.code === 'account_exists') {
 *       Alert.alert(
 *         'Account Exists',
 *         'An account with this email already exists. Please sign in instead.',
 *         [{ text: 'OK', onPress: () => router.push('/sign-in') }]
 *       );
 *       return;
 *     }
 *     
 *     // Generic error
 *     Alert.alert('Authentication Error', 'Unable to sign in. Please try again.');
 *   }
 * };
 * 
 * PRODUCTION ICONS:
 * Replace emoji icons with proper SVG logos:
 * 
 * import GoogleIcon from '@/assets/icons/google.svg';
 * import AppleIcon from '@/assets/icons/apple.svg';
 * 
 * // In component:
 * <GoogleIcon width={20} height={20} />
 * 
 * ACCESSIBILITY:
 * - Clear provider identification
 * - Proper button role
 * - Loading state announced
 * - Platform-specific behavior (Apple on iOS only)
 * 
 * TESTING:
 * 
 * test('renders Google button', () => {
 *   const { getByText } = render(
 *     <SocialAuthButton provider="google" onPress={jest.fn()} />
 *   );
 *   
 *   expect(getByText('Continue with Google')).toBeTruthy();
 * });
 * 
 * test('does not render Apple button on Android', () => {
 *   Platform.OS = 'android';
 *   
 *   const { queryByText } = render(
 *     <SocialAuthButton provider="apple" onPress={jest.fn()} />
 *   );
 *   
 *   expect(queryByText('Continue with Apple')).toBeNull();
 * });
 * 
 * test('calls onPress when pressed', () => {
 *   const handlePress = jest.fn();
 *   const { getByTestId } = render(
 *     <SocialAuthButton provider="google" onPress={handlePress} />
 *   );
 *   
 *   fireEvent.press(getByTestId('social-auth-google'));
 *   expect(handlePress).toHaveBeenCalledTimes(1);
 * });
 */
