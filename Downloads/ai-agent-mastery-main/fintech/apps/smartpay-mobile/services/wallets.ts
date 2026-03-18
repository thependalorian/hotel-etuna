/**
 * Wallet Service - SmartPay Mobile
 * Handles wallet CRUD operations
 * Location: mobile/services/wallets.ts
 */

import { api, NetworkError } from './api';
import { 
  Wallet, 
  CreateWalletRequest, 
  CreateWalletResponse, 
  UpdateWalletRequest,
  UpdateWalletResponse,
  DeleteWalletResponse 
} from '../types/api';

// Export types for external use
export { Wallet, CreateWalletRequest, UpdateWalletRequest };

/**
 * Get all wallets for authenticated user
 * GET /api/v1/mobile/wallets
 */
export async function getWallets(): Promise<Wallet[]> {
  try {
    const wallets = await api.get<Wallet[]>('/api/v1/mobile/wallets', { retry: true });
    
    // Normalize response (backend returns array directly)
    return Array.isArray(wallets) ? wallets : [];
  } catch (error) {
    console.error('getWallets error:', error);

    // Return mock data in development if API unavailable
    if (__DEV__ && error instanceof NetworkError) {
      return getMockWallets();
    }

    throw error;
  }
}

/**
 * Get specific wallet by ID
 * GET /api/v1/mobile/wallets/:id
 */
export async function getWalletById(walletId: string): Promise<Wallet | null> {
  try {
    const response = await api.get<{ wallet: Wallet }>(`/api/v1/mobile/wallets/${walletId}`);
    return response.wallet;
  } catch (error) {
    console.error('getWalletById error:', error);
    return null;
  }
}

/**
 * Create a new wallet
 * POST /api/v1/mobile/wallets
 */
export async function createWallet(params: CreateWalletRequest): Promise<Wallet | null> {
  try {
    const response = await api.post<CreateWalletResponse>(
      '/api/v1/mobile/wallets',
      params
    );

    return response.wallet;
  } catch (error) {
    console.error('createWallet error:', error);
    throw error;
  }
}

/**
 * Update wallet details
 * PATCH /api/v1/mobile/wallets/:id
 */
export async function updateWallet(
  walletId: string,
  params: UpdateWalletRequest
): Promise<Wallet | null> {
  try {
    const response = await api.patch<UpdateWalletResponse>(
      `/api/v1/mobile/wallets/${walletId}`,
      params
    );

    return response.wallet;
  } catch (error) {
    console.error('updateWallet error:', error);
    throw error;
  }
}

/**
 * Delete (archive) a wallet
 * DELETE /api/v1/mobile/wallets/:id
 */
export async function deleteWallet(walletId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await api.delete<DeleteWalletResponse>(`/api/v1/mobile/wallets/${walletId}`);
    return { success: true };
  } catch (error) {
    console.error('deleteWallet error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete wallet',
    };
  }
}

// ============================================================================
// MOCK DATA FOR DEVELOPMENT
// ============================================================================

function getMockWallets(): Wallet[] {
  return [
    {
      id: '1',
      name: 'Main',
      balance: 1250.50,
      type: 'main',
      currency: 'NAD',
      status: 'active',
      color: '#0029D6',
      icon: 'wallet-outline',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Savings',
      balance: 3500.00,
      type: 'savings',
      currency: 'NAD',
      status: 'active',
      color: '#22C55E',
      icon: 'cash-outline',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}
