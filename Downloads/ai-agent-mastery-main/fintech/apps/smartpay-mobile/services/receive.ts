/**
 * Receive Money Service - SmartPay Mobile
 * Handles NAMQR generation for receiving money
 * Location: mobile/services/receive.ts
 */

import { api } from './api';
import { generateNAMQR } from '../utils/namqr';

export interface ReceiveQRData {
  qrString: string;
  smartpayId: string;
  amount?: number;
  expiresAt?: string;
  deepLink?: string;
}

export interface GenerateReceiveQRRequest {
  walletId?: string;
  amount?: number;
  note?: string;
}

/**
 * Generate NAMQR for receiving money
 * 
 * This function generates a NAMQR code client-side using the user's SmartPay ID.
 * The NAMQR code can be scanned by other users to send money.
 * 
 * Note: The backend doesn't have a specific endpoint for generating receive QR codes.
 * The QR generation is done client-side using the NAMQR utils, as the user's
 * SmartPay ID is already available in their profile.
 * 
 * @param request - Options for QR generation
 * @returns Promise with QR data
 */
export async function generateReceiveQR(
  request: GenerateReceiveQRRequest = {}
): Promise<{ success: boolean; data?: ReceiveQRData; error?: string }> {
  try {
    // Fetch user profile to get SmartPay ID
    const profileResponse = await api.get<{
      profile: {
        smartpayId: string;
        firstName: string;
        lastName: string;
      };
    }>('/api/v1/mobile/user/profile', { retry: true });

    const { smartpayId, firstName, lastName } = profileResponse.profile;

    if (!smartpayId) {
      return {
        success: false,
        error: 'SmartPay ID not found. Please complete your profile.',
      };
    }

    // Generate NAMQR code client-side
    const qrString = generateNAMQR(smartpayId, request.amount);

    // Generate deep link for web/app sharing
    const deepLink = request.amount
      ? `smartpay://receive?id=${smartpayId}&amount=${request.amount}`
      : `smartpay://receive?id=${smartpayId}`;

    // Optional: Track QR generation on backend for analytics
    // This is fire-and-forget, don't block on it
    if (__DEV__) {
      console.log('[generateReceiveQR] Generated QR:', { smartpayId, amount: request.amount });
    }

    // Optional backend logging (non-blocking)
    trackQRGeneration(smartpayId, request.amount).catch((error) => {
      if (__DEV__) {
        console.warn('[generateReceiveQR] Failed to track QR generation:', error);
      }
    });

    return {
      success: true,
      data: {
        qrString,
        smartpayId,
        amount: request.amount,
        deepLink,
        expiresAt: undefined, // Receive QR codes don't expire
      },
    };
  } catch (error) {
    console.error('generateReceiveQR error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate QR code',
    };
  }
}

/**
 * Track QR generation for analytics (optional, non-blocking)
 * This logs the QR generation event to the backend for analytics purposes.
 * 
 * Note: This endpoint may not exist yet in the backend.
 * The function is wrapped in try-catch and errors are swallowed.
 */
async function trackQRGeneration(smartpayId: string, amount?: number): Promise<void> {
  try {
    await api.post(
      '/api/v1/mobile/analytics/qr-generated',
      {
        type: 'receive',
        smartpayId,
        amount,
        timestamp: new Date().toISOString(),
      },
      { retry: false }
    );
  } catch (error) {
    // Silently fail - analytics is non-critical
    if (__DEV__) {
      console.warn('Failed to track QR generation:', error);
    }
  }
}

/**
 * Validate scanned QR code before sending money
 * This function can be used to validate and parse a scanned QR code
 * before initiating a send money transaction.
 * 
 * @param qrString - The scanned QR code string
 * @returns Validation result with parsed data
 */
export async function validateReceiveQR(qrString: string): Promise<{
  success: boolean;
  data?: {
    smartpayId: string;
    amount?: number;
    recipientName?: string;
  };
  error?: string;
}> {
  try {
    // Import NAMQR parser
    const { parseNAMQR, extractSmartpayId } = require('../utils/namqr');

    // Try parsing as NAMQR
    const namqrResult = parseNAMQR(qrString);

    if (namqrResult.isValid && namqrResult.data) {
      const smartpayId = namqrResult.data.smartpayId;

      // Fetch recipient details from backend
      try {
        const recipientResponse = await api.get<{
          user: {
            smartpayId: string;
            firstName: string;
            lastName: string;
            phone: string;
          };
        }>(`/api/v1/mobile/users/lookup?smartpayId=${smartpayId}`, {
          retry: true,
        });

        return {
          success: true,
          data: {
            smartpayId,
            amount: namqrResult.data.amount,
            recipientName: `${recipientResponse.user.firstName} ${recipientResponse.user.lastName}`,
          },
        };
      } catch (error) {
        // If lookup fails, still return the parsed data
        return {
          success: true,
          data: {
            smartpayId,
            amount: namqrResult.data.amount,
          },
        };
      }
    }

    // Try extracting SmartPay ID from deep link or plain format
    const extractedId = extractSmartpayId(qrString);

    if (extractedId) {
      // Try to fetch recipient details
      try {
        const recipientResponse = await api.get<{
          user: {
            smartpayId: string;
            firstName: string;
            lastName: string;
            phone: string;
          };
        }>(`/api/v1/mobile/users/lookup?smartpayId=${extractedId}`, {
          retry: true,
        });

        return {
          success: true,
          data: {
            smartpayId: extractedId,
            recipientName: `${recipientResponse.user.firstName} ${recipientResponse.user.lastName}`,
          },
        };
      } catch (error) {
        // If lookup fails, still return the extracted ID
        return {
          success: true,
          data: {
            smartpayId: extractedId,
          },
        };
      }
    }

    return {
      success: false,
      error: 'Invalid QR code format',
    };
  } catch (error) {
    console.error('validateReceiveQR error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate QR code',
    };
  }
}

/**
 * Generate QR code for a specific transaction request
 * This creates a payment request that the payer must fulfill.
 * 
 * Note: This is different from a simple receive QR. This creates a
 * payment request in the backend that must be accepted/paid.
 * 
 * @param request - Payment request details
 * @returns Promise with QR data and request ID
 */
export async function generatePaymentRequest(params: {
  amount: number;
  note?: string;
  expiresInMinutes?: number;
}): Promise<{
  success: boolean;
  data?: {
    requestId: string;
    qrString: string;
    deepLink: string;
    expiresAt: string;
  };
  error?: string;
}> {
  try {
    const response = await api.post<{
      requestId: string;
      qrString: string;
      deepLink: string;
      expiresAt: string;
    }>(
      '/api/v1/mobile/payment-requests',
      {
        amount: params.amount,
        note: params.note,
        expiresInMinutes: params.expiresInMinutes || 60,
      },
      { retry: false }
    );

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error('generatePaymentRequest error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment request',
    };
  }
}
