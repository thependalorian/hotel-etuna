/**
 * Cash-Out Service - SmartPay Mobile
 * Handles all cash-out operations to various channels
 * Location: mobile/services/cashOut.ts
 */

import { api, NetworkError } from './api';
import {
  CashOutBankRequest,
  CashOutTillRequest,
  CashOutAgentRequest,
  CashOutMerchantRequest,
  CashOutATMRequest,
  CashOutResponse as ApiCashOutResponse,
} from '../types/api';

export type CashOutMethod = 'till' | 'agent' | 'merchant' | 'atm' | 'bank';

export interface CashOutResponse {
  success: boolean;
  transactionId: string;
  reference?: string;
  collectionCode?: string;
  offlineCode?: string;
  authCode?: string;
  qrCode?: string;
  namqrCode?: string;
  processingTime?: string;
  instructions?: string;
  expiresAt?: string;
  error?: string;
}

/**
 * Cash out to bank account
 * POST /api/v1/mobile/cash-out/bank
 */
export async function cashOutToBank(params: {
  walletId: string;
  amount: number;
  bankAccount: string;
  bankCode: string;
}): Promise<CashOutResponse> {
  try {
    const request: CashOutBankRequest = {
      walletId: params.walletId,
      amount: params.amount,
      bankAccount: params.bankAccount,
      bankCode: params.bankCode,
    };

    const response = await api.post<ApiCashOutResponse>(
      '/api/v1/mobile/cash-out/bank',
      request,
      { retry: false }
    );

    if (response.success && response.data) {
      return {
        success: true,
        transactionId: response.data.transactionId,
        reference: response.data.transactionId,
        processingTime: response.data.estimatedCompletion || '1-2 business days',
      };
    }

    return {
      success: false,
      transactionId: '',
      error: response.error?.message || 'Cash out failed',
    };
  } catch (error) {
    console.error('cashOutToBank error:', error);

    // Mock response in development
    if (__DEV__ && error instanceof NetworkError) {
      return {
        success: true,
        transactionId: `TXN-${Date.now()}`,
        reference: `BNK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        processingTime: '1-2 business days',
      };
    }

    return {
      success: false,
      transactionId: '',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Cash out at till
 * POST /api/v1/mobile/cash-out/till
 */
export async function cashOutAtTill(params: {
  walletId: string;
  amount: number;
  tillNumber?: string;
}): Promise<CashOutResponse> {
  try {
    const request: CashOutTillRequest = {
      walletId: params.walletId,
      amount: params.amount,
      tillNumber: params.tillNumber,
    };

    const response = await api.post<ApiCashOutResponse>(
      '/api/v1/mobile/cash-out/till',
      request,
      { retry: false }
    );

    if (response.success && response.data) {
      return {
        success: true,
        transactionId: response.data.transactionId,
        offlineCode: response.data.offlineCode,
        expiresAt: response.data.expiresAt,
        instructions: response.data.instructions,
      };
    }

    return {
      success: false,
      transactionId: '',
      error: response.error?.message || 'Cash out failed',
    };
  } catch (error) {
    console.error('cashOutAtTill error:', error);
    return {
      success: false,
      transactionId: '',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Cash out at agent with QR code
 * POST /api/v1/mobile/cash-out/agent
 */
export async function cashOutAtAgent(params: {
  walletId: string;
  amount: number;
  agentCode?: string;
}): Promise<CashOutResponse> {
  try {
    const request: CashOutAgentRequest = {
      walletId: params.walletId,
      amount: params.amount,
      agentCode: params.agentCode,
    };

    const response = await api.post<ApiCashOutResponse>(
      '/api/v1/mobile/cash-out/agent',
      request,
      { retry: false }
    );

    if (response.success && response.data) {
      return {
        success: true,
        transactionId: response.data.transactionId,
        qrCode: response.data.qrCode,
        expiresAt: response.data.expiresAt,
        instructions: response.data.instructions,
      };
    }

    return {
      success: false,
      transactionId: '',
      error: response.error?.message || 'Cash out failed',
    };
  } catch (error) {
    console.error('cashOutAtAgent error:', error);
    return {
      success: false,
      transactionId: '',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Cash out at merchant POS
 * POST /api/v1/mobile/cash-out/merchant
 */
export async function cashOutAtMerchant(params: {
  walletId: string;
  amount: number;
  merchantId: string;
}): Promise<CashOutResponse> {
  try {
    const request: CashOutMerchantRequest = {
      walletId: params.walletId,
      amount: params.amount,
      merchantId: params.merchantId,
    };

    const response = await api.post<ApiCashOutResponse>(
      '/api/v1/mobile/cash-out/merchant',
      request,
      { retry: false }
    );

    if (response.success && response.data) {
      return {
        success: true,
        transactionId: response.data.transactionId,
        authCode: response.data.authCode,
        expiresAt: response.data.expiresAt,
        instructions: response.data.instructions,
      };
    }

    return {
      success: false,
      transactionId: '',
      error: response.error?.message || 'Cash out failed',
    };
  } catch (error) {
    console.error('cashOutAtMerchant error:', error);
    return {
      success: false,
      transactionId: '',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Cash out at ATM with NAMQR
 * POST /api/v1/mobile/cash-out/atm
 */
export async function cashOutAtATM(params: {
  walletId: string;
  amount: number;
  atmId?: string;
}): Promise<CashOutResponse> {
  try {
    const request: CashOutATMRequest = {
      walletId: params.walletId,
      amount: params.amount,
      atmId: params.atmId,
    };

    const response = await api.post<ApiCashOutResponse>(
      '/api/v1/mobile/cash-out/atm',
      request,
      { retry: false }
    );

    if (response.success && response.data) {
      return {
        success: true,
        transactionId: response.data.transactionId,
        namqrCode: response.data.namqrCode,
        expiresAt: response.data.expiresAt,
        instructions: response.data.instructions,
      };
    }

    return {
      success: false,
      transactionId: '',
      error: response.error?.message || 'Cash out failed',
    };
  } catch (error) {
    console.error('cashOutAtATM error:', error);

    // Mock response in development
    if (__DEV__ && error instanceof NetworkError) {
      return {
        success: true,
        transactionId: `TXN-${Date.now()}`,
        namqrCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        instructions: 'Scan this NAMQR code at any compatible ATM to withdraw cash',
      };
    }

    return {
      success: false,
      transactionId: '',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Legacy method for backward compatibility
 */
export async function cashOutAtLocation(params: {
  walletId: string;
  amount: number;
  method: 'till' | 'agent' | 'merchant';
  recipientId?: string;
  agentCode?: string;
  merchantId?: string;
  tillNumber?: string;
  pin?: string;
}): Promise<CashOutResponse> {
  if (params.method === 'till') {
    return cashOutAtTill({
      walletId: params.walletId,
      amount: params.amount,
      tillNumber: params.tillNumber,
    });
  } else if (params.method === 'agent') {
    return cashOutAtAgent({
      walletId: params.walletId,
      amount: params.amount,
      agentCode: params.agentCode,
    });
  } else if (params.method === 'merchant') {
    return cashOutAtMerchant({
      walletId: params.walletId,
      amount: params.amount,
      merchantId: params.merchantId || params.recipientId || '',
    });
  }

  return {
    success: false,
    transactionId: '',
    error: 'Invalid cash-out method',
  };
}

/**
 * Get cash-out fee for a method
 */
export function getCashOutFee(method: CashOutMethod, amount: number): number {
  switch (method) {
    case 'agent':
      return 5;
    case 'atm':
      return 10;
    case 'till':
    case 'merchant':
    case 'bank':
    default:
      return 0;
  }
}

/**
 * Get processing time for a method
 */
export function getProcessingTime(method: CashOutMethod): string {
  switch (method) {
    case 'bank':
      return '1-2 business days';
    case 'till':
    case 'agent':
    case 'merchant':
    case 'atm':
    default:
      return 'Instant';
  }
}
