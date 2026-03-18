/**
 * BiometricPrompt - FaceID/TouchID/Fingerprint authentication prompt
 * Location: fintech/smartpay/components/auth/specialty/BiometricPrompt.tsx
 * Uses expo-local-authentication
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { designSystem } from '@/constants/designSystem';

export interface BiometricPromptProps {
  onSuccess: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  promptMessage?: string;
  fallbackLabel?: string;
  disableDeviceFallback?: boolean;
  testID?: string;
}

export function BiometricPrompt({
  onSuccess,
  onError,
  onCancel,
  promptMessage = 'Authenticate to continue',
  fallbackLabel = 'Use password',
  disableDeviceFallback = false,
  testID = 'biometric-prompt',
}: BiometricPromptProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      setIsAvailable(compatible && enrolled);
      
      // Determine biometric type
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType(Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint');
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType('Iris');
      }
    } catch (error) {
      console.error('Biometric check error:', error);
      setIsAvailable(false);
    }
  };

  const handleAuthenticate = async () => {
    if (!isAvailable) {
      onError?.('Biometric authentication not available');
      return;
    }

    setIsAuthenticating(true);
    
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: disableDeviceFallback ? undefined : fallbackLabel,
        disableDeviceFallback,
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        onSuccess();
      } else {
        if (result.error === 'user_cancel') {
          onCancel?.();
        } else {
          onError?.(result.error || 'Authentication failed');
        }
      }
    } catch (error) {
      onError?.('Authentication error occurred');
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (!isAvailable) {
    return null;
  }

  return (
    <View style={styles.container} testID={testID}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          isAuthenticating && styles.buttonDisabled,
        ]}
        onPress={handleAuthenticate}
        disabled={isAuthenticating}
        accessibilityLabel={`Authenticate with ${biometricType}`}
      >
        <Text style={styles.icon}>
          {biometricType === 'Face ID' ? '👤' : '👆'}
        </Text>
        <Text style={styles.text}>
          {isAuthenticating
            ? 'Authenticating...'
            : `Sign in with ${biometricType}`}
        </Text>
      </Pressable>
    </View>
  );
}

const ds = designSystem;
const { colors, spacing, radius, shadows } = ds;
const { brand, neutral } = colors;

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  button: {
    backgroundColor: neutral.surface,
    borderWidth: 1.5,
    borderColor: brand.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 24,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: brand.primary,
  },
});

/**
 * USAGE EXAMPLES:
 * 
 * // Basic usage
 * <BiometricPrompt
 *   onSuccess={() => router.replace('/dashboard')}
 *   onError={(error) => setError(error)}
 * />
 * 
 * // With custom message
 * <BiometricPrompt
 *   promptMessage="Verify your identity"
 *   onSuccess={handleSuccess}
 * />
 * 
 * // Disable device fallback
 * <BiometricPrompt
 *   disableDeviceFallback
 *   onSuccess={handleSuccess}
 *   onCancel={() => console.log('Cancelled')}
 * />
 * 
 * COMPLETE SIGN-IN WITH BIOMETRICS:
 * 
 * import { BiometricPrompt } from '@/components/auth/specialty/BiometricPrompt';
 * import * as SecureStore from 'expo-secure-store';
 * 
 * function BiometricSignIn() {
 *   const { signIn } = useSignIn();
 *   const router = useRouter();
 *   const [error, setError] = useState('');
 *   
 *   const handleBiometricSuccess = async () => {
 *     try {
 *       // Retrieve stored credentials
 *       const email = await SecureStore.getItemAsync('user_email');
 *       const token = await SecureStore.getItemAsync('session_token');
 *       
 *       if (token) {
 *         // Restore session with token
 *         await signIn.restore({ token });
 *         router.replace('/dashboard');
 *       } else {
 *         setError('No saved credentials found');
 *       }
 *     } catch (err) {
 *       setError('Authentication failed');
 *     }
 *   };
 *   
 *   return (
 *     <AuthContainer>
 *       <AuthHeader title="Welcome back" />
 *       
 *       <BiometricPrompt
 *         onSuccess={handleBiometricSuccess}
 *         onError={setError}
 *       />
 *       
 *       {error && <AuthError message={error} />}
 *       
 *       <View style={styles.divider}>
 *         <Text style={styles.dividerText}>or</Text>
 *       </View>
 *       
 *       <LinkButton
 *         title="Sign in with password"
 *         href="/sign-in/password"
 *       />
 *     </AuthContainer>
 *   );
 * }
 * 
 * ENABLE BIOMETRICS AFTER SIGN-IN:
 * 
 * import * as SecureStore from 'expo-secure-store';
 * 
 * function EnableBiometrics() {
 *   const { user } = useUser();
 *   
 *   const handleEnable = async () => {
 *     try {
 *       // Test biometric authentication
 *       const result = await LocalAuthentication.authenticateAsync({
 *         promptMessage: 'Enable biometric authentication',
 *       });
 *       
 *       if (result.success) {
 *         // Store user credentials securely
 *         await SecureStore.setItemAsync('user_email', user.email);
 *         await SecureStore.setItemAsync('session_token', user.sessionToken);
 *         await SecureStore.setItemAsync('biometric_enabled', 'true');
 *         
 *         Alert.alert('Success', 'Biometric authentication enabled');
 *       }
 *     } catch (error) {
 *       Alert.alert('Error', 'Failed to enable biometric authentication');
 *     }
 *   };
 *   
 *   return (
 *     <AuthButton
 *       title="Enable Biometric Sign-In"
 *       onPress={handleEnable}
 *     />
 *   );
 * }
 * 
 * SECURITY BEST PRACTICES:
 * 
 * 1. Always use expo-secure-store for credentials
 * 2. Store minimal data (tokens, not passwords)
 * 3. Implement token rotation
 * 4. Add re-authentication for sensitive actions
 * 5. Provide fallback to password
 * 6. Clear stored credentials on sign-out
 * 
 * const clearBiometricData = async () => {
 *   await SecureStore.deleteItemAsync('user_email');
 *   await SecureStore.deleteItemAsync('session_token');
 *   await SecureStore.deleteItemAsync('biometric_enabled');
 * };
 * 
 * CHECK IF BIOMETRICS ENABLED:
 * 
 * const isBiometricEnabled = async (): Promise<boolean> => {
 *   try {
 *     const enabled = await SecureStore.getItemAsync('biometric_enabled');
 *     const hasToken = await SecureStore.getItemAsync('session_token');
 *     
 *     // Check hardware availability
 *     const compatible = await LocalAuthentication.hasHardwareAsync();
 *     const enrolled = await LocalAuthentication.isEnrolledAsync();
 *     
 *     return enabled === 'true' && !!hasToken && compatible && enrolled;
 *   } catch {
 *     return false;
 *   }
 * };
 * 
 * TESTING:
 * 
 * test('renders BiometricPrompt when available', async () => {
 *   LocalAuthentication.hasHardwareAsync.mockResolvedValue(true);
 *   LocalAuthentication.isEnrolledAsync.mockResolvedValue(true);
 *   
 *   const { getByTestId } = render(
 *     <BiometricPrompt onSuccess={jest.fn()} />
 *   );
 *   
 *   await waitFor(() => {
 *     expect(getByTestId('biometric-prompt')).toBeTruthy();
 *   });
 * });
 * 
 * test('calls onSuccess after successful authentication', async () => {
 *   const handleSuccess = jest.fn();
 *   LocalAuthentication.authenticateAsync.mockResolvedValue({ success: true });
 *   
 *   const { getByTestId } = render(
 *     <BiometricPrompt onSuccess={handleSuccess} />
 *   );
 *   
 *   fireEvent.press(getByTestId('biometric-prompt'));
 *   
 *   await waitFor(() => {
 *     expect(handleSuccess).toHaveBeenCalled();
 *   });
 * });
 */
