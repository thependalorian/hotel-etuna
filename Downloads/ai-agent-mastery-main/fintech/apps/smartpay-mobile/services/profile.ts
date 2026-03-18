/**
 * Profile Service - SmartPay Mobile
 * Handles user profile operations including Proof of Life verification
 * Location: mobile/services/profile.ts
 */

import { api, NetworkError } from './api';
import { 
  UserProfile, 
  UpdateProfileRequest, 
  UpdateProfileResponse,
  StartProofOfLifeRequest,
  ProofOfLifeResponse,
  CompleteProofOfLifeRequest
} from '../types/api';

// Export types for external use
export { UserProfile, UpdateProfileRequest };
export type UserProfileFromApi = UserProfile;

/**
 * Get user profile
 * GET /api/v1/mobile/user/profile
 */
export async function fetchProfile(): Promise<UserProfile | null> {
  try {
    const response = await api.get<UserProfile>('/api/v1/mobile/user/profile', { retry: true });
    
    // Normalize field names (backend uses snake_case, frontend prefers camelCase)
    return {
      id: response.id || response.userId!,
      userId: response.userId || response.id,
      phone: response.phone,
      email: response.email,
      firstName: response.firstName || response.first_name || '',
      lastName: response.lastName || response.last_name || '',
      fullName: response.fullName || response.full_name,
      photoUrl: response.photoUrl || response.photo_url || response.avatarUrl,
      avatarUrl: response.avatarUrl || response.photoUrl || response.photo_url,
      kycTier: response.kycTier || response.kyc_tier,
      kycVerified: response.kycVerified ?? response.kyc_verified,
      creditScore: response.creditScore ?? response.credit_score,
      accountStatus: response.accountStatus || response.account_status,
      walletCount: response.walletCount,
      proofOfLife: response.proofOfLife,
      createdAt: response.createdAt || response.created_at,
      updatedAt: response.updatedAt || response.updated_at,
    };
  } catch (error) {
    console.error('fetchProfile error:', error);

    if (error instanceof NetworkError && __DEV__) {
      return getMockProfile();
    }

    return null;
  }
}

/**
 * Update user profile
 * PATCH /api/v1/mobile/user/profile
 */
export async function updateProfile(payload: UpdateProfileRequest): Promise<{ updated: boolean } | null> {
  try {
    const response = await api.patch<UpdateProfileResponse>('/api/v1/mobile/user/profile', payload);

    return response.data || { updated: response.success };
  } catch (error) {
    console.error('updateProfile error:', error);
    throw error;
  }
}

/**
 * Start Proof of Life verification
 * POST /api/v1/mobile/user/proof-of-life
 */
export async function startProofOfLife(request: StartProofOfLifeRequest): Promise<ProofOfLifeResponse> {
  try {
    return await api.post<ProofOfLifeResponse>(
      '/api/v1/mobile/user/proof-of-life',
      request
    );
  } catch (error) {
    console.error('startProofOfLife error:', error);
    throw error;
  }
}

/**
 * Complete Proof of Life verification
 * POST /api/v1/mobile/user/proof-of-life/verify
 */
export async function completeProofOfLife(request: CompleteProofOfLifeRequest): Promise<ProofOfLifeResponse> {
  try {
    return await api.post<ProofOfLifeResponse>(
      '/api/v1/mobile/user/proof-of-life/verify',
      request
    );
  } catch (error) {
    console.error('completeProofOfLife error:', error);
    throw error;
  }
}

// ============================================================================
// MOCK DATA FOR DEVELOPMENT
// ============================================================================

function getMockProfile(): UserProfile {
  return {
    id: 'mock-user-id',
    userId: 'mock-user-id',
    phone: process.env.EXPO_PUBLIC_TEST_USER_PHONE || '+264811234567',
    email: process.env.TEST_USER_EMAIL || 'pendanek@gmail.com',
    firstName: process.env.EXPO_PUBLIC_TEST_USER_FIRST_NAME || 'Pendapala',
    lastName: process.env.EXPO_PUBLIC_TEST_USER_LAST_NAME || 'Nekulilo',
    fullName: `${process.env.EXPO_PUBLIC_TEST_USER_FIRST_NAME || 'Pendapala'} ${process.env.EXPO_PUBLIC_TEST_USER_LAST_NAME || 'Nekulilo'}`,
    kycTier: 'basic',
    kycVerified: false,
    accountStatus: 'active',
    walletCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
