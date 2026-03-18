/**
 * Invite/Referral Service - SmartPay Mobile
 * Handles referral code validation and registration
 * Location: mobile/services/invite.ts
 */

import { api } from './api';

export interface InviteValidation {
  valid: boolean;
  code?: string;
  inviterName?: string;
  inviterPhone?: string;
  error?: string;
}

export interface ReferralStats {
  myReferralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  totalRewards: number;
  pendingRewards: number;
  referrals: Array<{
    id: string;
    phone: string;
    name?: string;
    status: string;
    reward: number;
    joinedAt: string;
  }>;
}

/**
 * Validate referral/invite code
 * GET /api/v1/mobile/invite/validate?code=XXX
 */
export async function validateInviteCode(code: string): Promise<InviteValidation> {
  try {
    const response = await api.get<InviteValidation>(
      '/api/v1/mobile/invite/validate',
      { params: { code }, skipAuth: true, retry: true }
    );

    return response;
  } catch (error) {
    console.error('validateInviteCode error:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    };
  }
}

/**
 * Register with invite code during onboarding
 * POST /api/v1/mobile/invite/register
 */
export async function registerWithInviteCode(params: {
  phone: string;
  inviteCode?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await api.post(
      '/api/v1/mobile/invite/register',
      params,
      { skipAuth: true, retry: false }
    );

    return { success: true };
  } catch (error) {
    console.error('registerWithInviteCode error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    };
  }
}

/**
 * Get my referral code and stats
 * GET /api/v1/mobile/invite/me
 */
export async function getMyReferralCode(): Promise<string | null> {
  try {
    const response = await api.get<{ referralCode: string }>('/api/v1/mobile/invite/me');
    return response.referralCode;
  } catch (error) {
    console.error('getMyReferralCode error:', error);
    return null;
  }
}

/**
 * Get my referral stats
 * GET /api/v1/mobile/invite/referrals
 */
export async function getReferralStats(): Promise<ReferralStats | null> {
  try {
    const response = await api.get<ReferralStats>('/api/v1/mobile/invite/referrals');
    return response;
  } catch (error) {
    console.error('getReferralStats error:', error);
    return null;
  }
}

/**
 * Get referral leaderboard
 * GET /api/v1/mobile/invite/leaderboard
 */
export async function getReferralLeaderboard(): Promise<Array<{
  rank: number;
  name: string;
  referralCount: number;
  rewards: number;
}>> {
  try {
    const response = await api.get<{ leaderboard: Array<{
      rank: number;
      name: string;
      referralCount: number;
      rewards: number;
    }> }>('/api/v1/mobile/invite/leaderboard');
    
    return response.leaderboard || [];
  } catch (error) {
    console.error('getReferralLeaderboard error:', error);
    return [];
  }
}
