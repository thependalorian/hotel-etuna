/**
 * KYC Service - SmartPay Mobile
 * Handles KYC (Know Your Customer) verification per Namibia FIA/FIC
 * Location: mobile/services/kyc.ts
 */

import { api } from './api';
import { KycStatus, KycSubmitRequest, KycSubmitResponse } from '../types/api';

export { KycStatus };

/**
 * Get KYC status for authenticated user
 * GET /api/v1/kyc/status
 */
export async function getKycStatus(): Promise<KycStatus | null> {
  try {
    const response = await api.get<{ data: KycStatus }>('/api/v1/kyc/status', { retry: true });
    return response.data;
  } catch (error) {
    console.error('getKycStatus error:', error);
    return null;
  }
}

/**
 * Submit KYC information for verification
 * POST /api/v1/kyc/submit
 */
export async function submitKyc(input: KycSubmitRequest): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await api.post<KycSubmitResponse>(
      '/api/v1/kyc/submit',
      input,
      { retry: false }
    );

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error?.message || 'Submission failed',
    };
  } catch (error) {
    console.error('submitKyc error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}
