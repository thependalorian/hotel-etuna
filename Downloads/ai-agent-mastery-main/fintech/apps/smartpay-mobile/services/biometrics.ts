/**
 * biometrics – Production Biometric Authentication Service
 * Implements secure biometric authentication for iOS (Face ID, Touch ID) and Android (Fingerprint).
 * Location: fintech/smartpay/services/biometrics.ts
 * 
 * SECURITY ARCHITECTURE:
 * 
 * 1. Device-Level Security:
 *    - Uses native secure enclave (iOS Keychain / Android Keystore)
 *    - Biometric data never leaves the device
 *    - No biometric data stored in app or transmitted
 * 
 * 2. Authentication Flow:
 *    - Check hardware availability
 *    - Check biometric enrollment status
 *    - Authenticate with device-level prompt
 *    - Track failed attempts
 *    - Generate secure token on success
 * 
 * 3. Error Handling:
 *    - Hardware not available
 *    - Biometrics not enrolled
 *    - Authentication failed
 *    - User cancelled
 *    - Too many attempts (device lockout)
 *    - System errors
 * 
 * 4. User Preferences:
 *    - Enable/disable biometric authentication
 *    - Stored in expo-secure-store (encrypted)
 *    - Per-device preference
 * 
 * 5. Compliance:
 *    - PSD-3 Strong Customer Authentication (SCA)
 *    - GDPR Article 4(14) biometric data handling
 *    - BON Act 2 security requirements
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';

// Secure Store Keys
const BIOMETRIC_ENABLED_KEY = 'smartpay_biometric_enabled';
const BIOMETRIC_FAILED_ATTEMPTS_KEY = 'smartpay_biometric_failed_attempts';
const BIOMETRIC_LOCK_UNTIL_KEY = 'smartpay_biometric_lock_until';

// Lockout Configuration
const MAX_BIOMETRIC_ATTEMPTS = 3;
const BIOMETRIC_LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Biometric authentication types supported by the device
 */
export enum BiometricType {
  NONE = 'none',
  FINGERPRINT = 'fingerprint',
  FACE = 'face',
  IRIS = 'iris',
}

/**
 * Biometric authentication error codes
 */
export enum BiometricErrorCode {
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  NOT_ENROLLED = 'NOT_ENROLLED',
  FAILED = 'FAILED',
  USER_CANCEL = 'USER_CANCEL',
  SYSTEM_CANCEL = 'SYSTEM_CANCEL',
  LOCKED_OUT = 'LOCKED_OUT',
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  DISABLED = 'DISABLED',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Biometric availability information
 */
export interface BiometricAvailability {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometricType: BiometricType;
  supportedTypes: BiometricType[];
  error?: string;
  errorCode?: BiometricErrorCode;
}

/**
 * Biometric authentication result
 */
export interface BiometricAuthResult {
  success: boolean;
  token?: string;
  expiresAt?: number;
  error?: string;
  errorCode?: BiometricErrorCode;
  attemptsRemaining?: number;
  lockedUntil?: number;
}

/**
 * Authentication options
 */
export interface BiometricAuthOptions {
  promptMessage?: string;
  cancelLabel?: string;
  fallbackLabel?: string;
  disableDeviceFallback?: boolean;
}

/**
 * Get human-readable name for biometric type
 */
export function getBiometricTypeName(type: BiometricType): string {
  switch (type) {
    case BiometricType.FACE:
      return 'Face ID';
    case BiometricType.FINGERPRINT:
      return 'Fingerprint';
    case BiometricType.IRIS:
      return 'Iris';
    default:
      return 'Biometric';
  }
}

/**
 * Map LocalAuthentication types to BiometricType enum
 */
function mapAuthenticationType(type: LocalAuthentication.AuthenticationType): BiometricType {
  switch (type) {
    case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
      return BiometricType.FACE;
    case LocalAuthentication.AuthenticationType.FINGERPRINT:
      return BiometricType.FINGERPRINT;
    case LocalAuthentication.AuthenticationType.IRIS:
      return BiometricType.IRIS;
    default:
      return BiometricType.NONE;
  }
}

/**
 * Check if biometric authentication is available on the device.
 * Checks hardware availability, enrollment status, and supported types.
 */
export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  try {
    // Check if device has biometric hardware
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    
    if (!hasHardware) {
      return {
        isAvailable: false,
        isEnrolled: false,
        biometricType: BiometricType.NONE,
        supportedTypes: [],
        error: 'Biometric hardware not available on this device',
        errorCode: BiometricErrorCode.NOT_AVAILABLE,
      };
    }

    // Check if biometric credentials are enrolled
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (!isEnrolled) {
      return {
        isAvailable: true,
        isEnrolled: false,
        biometricType: BiometricType.NONE,
        supportedTypes: [],
        error: 'No biometric credentials enrolled. Please set up Face ID, Touch ID, or Fingerprint in device settings.',
        errorCode: BiometricErrorCode.NOT_ENROLLED,
      };
    }

    // Get supported authentication types
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const mappedTypes = supportedTypes.map(mapAuthenticationType).filter(t => t !== BiometricType.NONE);

    // Determine primary biometric type (prefer Face > Fingerprint > Iris)
    let primaryType = BiometricType.NONE;
    if (mappedTypes.includes(BiometricType.FACE)) {
      primaryType = BiometricType.FACE;
    } else if (mappedTypes.includes(BiometricType.FINGERPRINT)) {
      primaryType = BiometricType.FINGERPRINT;
    } else if (mappedTypes.includes(BiometricType.IRIS)) {
      primaryType = BiometricType.IRIS;
    }

    return {
      isAvailable: true,
      isEnrolled: true,
      biometricType: primaryType,
      supportedTypes: mappedTypes,
    };
  } catch (error) {
    console.error('[Biometrics] Availability check error:', error);
    return {
      isAvailable: false,
      isEnrolled: false,
      biometricType: BiometricType.NONE,
      supportedTypes: [],
      error: 'Failed to check biometric availability',
      errorCode: BiometricErrorCode.UNKNOWN,
    };
  }
}

/**
 * Check if user has enabled biometric authentication in app settings.
 */
export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('[Biometrics] Failed to check enabled status:', error);
    return false;
  }
}

/**
 * Enable biometric authentication.
 * Requires biometric hardware to be available and enrolled.
 */
export async function enableBiometric(): Promise<{ success: boolean; error?: string; errorCode?: BiometricErrorCode }> {
  const availability = await checkBiometricAvailability();
  
  if (!availability.isAvailable || !availability.isEnrolled) {
    return {
      success: false,
      error: availability.error || 'Biometric authentication not available',
      errorCode: availability.errorCode,
    };
  }
  
  try {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return { success: true };
  } catch (error) {
    console.error('[Biometrics] Failed to enable:', error);
    return {
      success: false,
      error: 'Failed to enable biometric authentication',
      errorCode: BiometricErrorCode.UNKNOWN,
    };
  }
}

/**
 * Disable biometric authentication.
 */
export async function disableBiometric(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    await clearBiometricFailedAttempts();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    console.error('[Biometrics] Failed to disable:', error);
  }
}

/**
 * Check if biometric authentication is locked due to too many failed attempts.
 */
async function checkBiometricLockStatus(): Promise<{ isLocked: boolean; lockedUntil?: number }> {
  try {
    const lockUntilStr = await SecureStore.getItemAsync(BIOMETRIC_LOCK_UNTIL_KEY);
    
    if (!lockUntilStr) {
      return { isLocked: false };
    }
    
    const lockUntil = parseInt(lockUntilStr, 10);
    const now = Date.now();
    
    if (now < lockUntil) {
      return { isLocked: true, lockedUntil: lockUntil };
    }
    
    // Lock expired, clear it
    await clearBiometricFailedAttempts();
    return { isLocked: false };
  } catch (error) {
    console.error('[Biometrics] Failed to check lock status:', error);
    return { isLocked: false };
  }
}

/**
 * Record a failed biometric authentication attempt.
 */
async function recordBiometricFailedAttempt(): Promise<{ attemptsRemaining: number; lockedUntil?: number }> {
  try {
    const attemptsStr = await SecureStore.getItemAsync(BIOMETRIC_FAILED_ATTEMPTS_KEY);
    const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
    const newAttempts = attempts + 1;
    
    await SecureStore.setItemAsync(BIOMETRIC_FAILED_ATTEMPTS_KEY, String(newAttempts));
    
    if (newAttempts >= MAX_BIOMETRIC_ATTEMPTS) {
      const lockUntil = Date.now() + BIOMETRIC_LOCK_DURATION_MS;
      await SecureStore.setItemAsync(BIOMETRIC_LOCK_UNTIL_KEY, String(lockUntil));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return { attemptsRemaining: 0, lockedUntil: lockUntil };
    }
    
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    return { attemptsRemaining: MAX_BIOMETRIC_ATTEMPTS - newAttempts };
  } catch (error) {
    console.error('[Biometrics] Failed to record attempt:', error);
    return { attemptsRemaining: MAX_BIOMETRIC_ATTEMPTS };
  }
}

/**
 * Clear biometric failed attempts (on successful authentication or when lock expires).
 */
async function clearBiometricFailedAttempts(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_FAILED_ATTEMPTS_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_LOCK_UNTIL_KEY);
  } catch (error) {
    console.error('[Biometrics] Failed to clear attempts:', error);
  }
}

/**
 * Generate a secure one-time authentication token.
 */
async function generateAuthToken(): Promise<{ token: string; expiresAt: number }> {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  const token = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const expiresAt = Date.now() + 60 * 1000; // 60 seconds validity
  
  return { token, expiresAt };
}

/**
 * Authenticate using biometric (Face ID / Touch ID / Fingerprint).
 * 
 * @param options - Authentication options (prompt message, labels, etc.)
 * @returns Authentication result with token if successful
 */
export async function authenticateBiometric(
  options: BiometricAuthOptions = {}
): Promise<BiometricAuthResult> {
  // Check if biometric is enabled by user
  const isEnabled = await isBiometricEnabled();
  if (!isEnabled) {
    return {
      success: false,
      error: 'Biometric authentication is not enabled',
      errorCode: BiometricErrorCode.DISABLED,
    };
  }

  // Check availability
  const availability = await checkBiometricAvailability();
  if (!availability.isAvailable || !availability.isEnrolled) {
    return {
      success: false,
      error: availability.error || 'Biometric authentication not available',
      errorCode: availability.errorCode,
    };
  }

  // Check lock status
  const { isLocked, lockedUntil } = await checkBiometricLockStatus();
  if (isLocked && lockedUntil) {
    const remainingMs = lockedUntil - Date.now();
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    return {
      success: false,
      error: `Too many failed attempts. Try again in ${remainingMinutes} minute(s)`,
      errorCode: BiometricErrorCode.LOCKED_OUT,
      lockedUntil,
    };
  }

  // Perform biometric authentication
  try {
    const biometricTypeName = getBiometricTypeName(availability.biometricType);
    
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: options.promptMessage || `Authenticate with ${biometricTypeName}`,
      cancelLabel: options.cancelLabel || 'Cancel',
      fallbackLabel: options.fallbackLabel || 'Use PIN',
      disableDeviceFallback: options.disableDeviceFallback ?? false,
    });

    if (result.success) {
      // Success - clear failed attempts and generate token
      await clearBiometricFailedAttempts();
      const { token, expiresAt } = await generateAuthToken();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Log security event
      console.log('[Biometrics] Authentication successful');
      
      return {
        success: true,
        token,
        expiresAt,
      };
    } else {
      // Authentication failed
      const { attemptsRemaining, lockedUntil: newLockUntil } = await recordBiometricFailedAttempt();
      
      let errorMessage = 'Authentication failed';
      let errorCode = BiometricErrorCode.FAILED;

      if (result.error === 'user_cancel') {
        errorMessage = 'Authentication cancelled';
        errorCode = BiometricErrorCode.USER_CANCEL;
        // Don't count user cancellation as a failed attempt
        await clearBiometricFailedAttempts();
      } else if (result.error === 'system_cancel') {
        errorMessage = 'Authentication interrupted by system';
        errorCode = BiometricErrorCode.SYSTEM_CANCEL;
      } else if (result.error === 'lockout' || result.error === 'lockout_permanent') {
        errorMessage = 'Too many attempts. Biometric authentication is temporarily locked.';
        errorCode = BiometricErrorCode.TOO_MANY_ATTEMPTS;
      }

      return {
        success: false,
        error: errorMessage,
        errorCode,
        attemptsRemaining: attemptsRemaining > 0 ? attemptsRemaining : undefined,
        lockedUntil: newLockUntil,
      };
    }
  } catch (error) {
    console.error('[Biometrics] Authentication error:', error);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    
    return {
      success: false,
      error: 'Biometric authentication failed',
      errorCode: BiometricErrorCode.UNKNOWN,
    };
  }
}

/**
 * Re-enroll biometrics (disable and re-enable).
 * Use when user wants to update their biometric preference.
 */
export async function reEnrollBiometric(): Promise<{ success: boolean; error?: string }> {
  await disableBiometric();
  return enableBiometric();
}

/**
 * Get current biometric failed attempts count.
 */
export async function getBiometricFailedAttempts(): Promise<number> {
  try {
    const attemptsStr = await SecureStore.getItemAsync(BIOMETRIC_FAILED_ATTEMPTS_KEY);
    return attemptsStr ? parseInt(attemptsStr, 10) : 0;
  } catch (error) {
    console.error('[Biometrics] Failed to get attempts:', error);
    return 0;
  }
}

/**
 * Reset all biometric settings (for testing or troubleshooting).
 */
export async function resetBiometricSettings(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    await clearBiometricFailedAttempts();
    console.log('[Biometrics] Settings reset');
  } catch (error) {
    console.error('[Biometrics] Failed to reset settings:', error);
  }
}
