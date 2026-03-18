/**
 * Send Money Service - SmartPay Mobile
 * Handles P2P money transfers
 * Location: mobile/services/send.ts
 */

import { api } from './api';
import { SendMoneyRequest, SendMoneyResponse } from '../types/api';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  avatarUri?: string;
  smartpayId?: string;
  isFavorite?: boolean;
}

export interface SendResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

/**
 * Send money to another user
 * POST /api/v1/mobile/send-money
 */
export async function sendMoney(params: {
  recipientPhone?: string;
  beneficiaryPhone?: string;
  beneficiaryId?: string;
  amount: number;
  note?: string;
  walletId?: string;
  sourceWalletId?: string;
  pin?: string;
}): Promise<SendResult> {
  try {
    // Normalize parameters to match backend API
    const request: SendMoneyRequest = {
      amount: params.amount,
      beneficiaryPhone: params.beneficiaryPhone || params.recipientPhone,
      beneficiaryId: params.beneficiaryId,
      sourceWalletId: params.sourceWalletId || params.walletId || '',
      note: params.note,
    };

    const response = await api.post<SendMoneyResponse>(
      '/api/v1/mobile/send-money',
      request,
      { retry: false }
    );

    if (response.success && response.data) {
      return {
        success: true,
        transactionId: response.data.transactionId,
      };
    }

    return {
      success: false,
      error: response.error?.message || 'Transfer failed',
    };
  } catch (error) {
    console.error('sendMoney error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Get user's contacts (mock data for now)
 * TODO: Implement contact sync from device or backend
 */
export async function getContacts(): Promise<Contact[]> {
  return [
    { id: '1', name: 'John Doe', phone: '+26481234567', smartpayId: 'SP12345678' },
    { id: '2', name: 'Jane Smith', phone: '+26481234568', smartpayId: 'SP12345679' },
    { id: '3', name: 'Bob Johnson', phone: '+26481234569', smartpayId: 'SP12345680' },
  ];
}
