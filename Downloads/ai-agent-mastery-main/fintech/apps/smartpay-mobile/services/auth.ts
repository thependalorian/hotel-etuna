/**
 * Authentication Service - SmartPay Mobile
 * Handles OTP-based authentication flow
 * Location: mobile/services/auth.ts
 */

import { api, setTokens, clearSession as clearApiSession, NetworkError } from './api';
import { getSecureItem } from './secureStorage';
import { 
  OtpRequestResponse, 
  OtpVerifyResponse, 
  RefreshTokenResponse,
  LogoutResponse 
} from '../types/api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const TOKEN_KEY = 'smartpay_access_token';

/** Test user phone for onboarding simulation (last 8 digits). Use EXPO_PUBLIC_TEST_USER_PHONE e.g. +264811234567 */
function getTestPhoneNormalized(): string | null {
  const raw = process.env.EXPO_PUBLIC_TEST_USER_PHONE ?? process.env.TEST_USER_PHONE ?? '';
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '').slice(-8);
  return digits.length >= 8 ? digits : null;
}

const DEV_OTP_CODE = '123456';

/** In dev, returns OTP to prefill when simulating onboarding (test user or no API). */
export function getDevPrefillOtp(phone: string): string | null {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return null;
  const testPhone = getTestPhoneNormalized();
  const normalized = phone.replace(/\D/g, '').slice(-8);
  if (testPhone && normalized === testPhone) return DEV_OTP_CODE;
  if (!API_BASE_URL) return DEV_OTP_CODE;
  return null;
}

export interface OtpRequestResult {
  success: boolean;
  expiresIn?: number;
  devCode?: string;
  error?: string;
}

export interface OtpVerifyResult {
  success: boolean;
  smartpayId?: string;
  error?: string;
  attemptsRemaining?: number;
}

/**
 * Request OTP for phone number authentication
 * POST /api/v1/auth/request-otp (or /api/v1/mobile/auth/request-otp)
 */
export async function requestOtp(
  phone: string, 
  email?: string, 
  channel: "sms" | "email" | "both" = "sms"
): Promise<OtpRequestResult> {
  const normalizedPhone = phone.replace(/\D/g, '').slice(-8);
  const testPhone = getTestPhoneNormalized();
  const isTestUser = __DEV__ && testPhone && normalizedPhone === testPhone;

  try {
    const response = await api.post<OtpRequestResponse>(
      '/api/v1/auth/request-otp',
      { phone: normalizedPhone, email, channel },
      { skipAuth: true, retry: true }
    );

    return {
      success: response.success,
      expiresIn: response.expiresIn,
      devCode: isTestUser ? DEV_OTP_CODE : undefined,
    };
  } catch (error) {
    console.error('OTP request error:', error);
    
    // Fallback to test mode in development
    if (isTestUser && __DEV__) {
      return { success: true, expiresIn: 300, devCode: DEV_OTP_CODE };
    }

    if (error instanceof NetworkError) {
      return { success: false, error: 'Network connection unavailable' };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send OTP',
    };
  }
}

/**
 * Verify OTP and authenticate user
 * POST /api/v1/auth/verify-otp (or /api/v1/mobile/auth/verify-otp)
 */
export async function verifyOtp(
  phone: string,
  code: string,
  email?: string
): Promise<OtpVerifyResult> {
  const normalizedPhone = phone.replace(/\D/g, '').slice(-8);
  const testPhone = getTestPhoneNormalized();
  const isTestUser = __DEV__ && testPhone && normalizedPhone === testPhone;

  try {
    const response = await api.post<OtpVerifyResponse>(
      '/api/v1/auth/verify-otp',
      { phone, code, email },
      { skipAuth: true, retry: false }
    );

    if (response.success) {
      // Store tokens
      const token = response.token || response.accessToken;
      await setTokens(token, response.refreshToken);

      return {
        success: true,
        smartpayId: response.smartpayId,
      };
    }

    return {
      success: false,
      error: response.message || 'Verification failed',
      attemptsRemaining: response.attemptsRemaining,
    };
  } catch (error) {
    console.error('OTP verify error:', error);

    // Fallback to test mode in development
    if (isTestUser && code === DEV_OTP_CODE && __DEV__) {
      const smartpayId = generateSmartpayId(phone);
      await setTokens('dev-session-token');
      return { success: true, smartpayId };
    }

    if (error instanceof NetworkError) {
      return { success: false, error: 'Network connection unavailable' };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await api.post<RefreshTokenResponse>(
      '/api/v1/auth/refresh',
      { refreshToken },
      { skipAuth: true, retry: false }
    );

    if (response.success && response.accessToken) {
      await setTokens(response.accessToken);
      return response.accessToken;
    }

    return null;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

/**
 * Logout and revoke tokens
 * POST /api/v1/auth/logout
 */
export async function logout(): Promise<void> {
  try {
    await api.post<LogoutResponse>('/api/v1/auth/logout', {}, { retry: false });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    await clearSession();
  }
}

/**
 * Clear session and tokens
 */
export async function clearSession(): Promise<void> {
  await clearApiSession();
}

/**
 * Get stored access token
 */
export async function getStoredToken(): Promise<string | null> {
  return await getSecureItem(TOKEN_KEY);
}

/**
 * Get auth header for manual requests
 */
export async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateDevCode(phone: string): string {
  const hash = phone.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return String(hash % 900000 + 100000);
}

function generateSmartpayId(phone: string): string {
  const normalized = phone.replace(/\D/g, '');
  return `SP${normalized.slice(-8)}`;
}
