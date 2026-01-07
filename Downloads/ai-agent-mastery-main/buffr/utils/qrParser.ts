/**
 * QR Code Parser Utility
 * 
 * Location: utils/qrParser.ts
 * Purpose: Parse QR codes for Buffr payment accounts (main account and wallets)
 * 
 * Now uses NAMQR Code Standards Version 5.0 (TLV format)
 * Also supports legacy JSON/URL formats for backward compatibility
 */

import { parseBuffrNAMQR, type ParsedBuffrQR } from './namqr';

export interface ParsedQRPayment {
  type: 'buffr_payment';
  userId?: string;
  phone?: string;
  accountType: 'buffr' | 'wallet';
  walletId?: string;
  walletName?: string;
  amount?: string;
  currency?: string;
  isValid: boolean;
  error?: string;
}

/**
 * Parse QR code data for Buffr payment accounts
 * Supports both NAMQR (TLV format) and legacy formats
 * @param qrData - Raw QR code string data
 * @returns Parsed payment information or error
 */
export function parseQRPayment(qrData: string): ParsedQRPayment {
  try {
    // First, try parsing as NAMQR (TLV format)
    // NAMQR codes start with "00" (Payload Format Indicator tag)
    if (qrData.trim().startsWith('00') || /^\d{2}\d{2}/.test(qrData.trim())) {
      const namqrResult = parseBuffrNAMQR(qrData);
      
      if (namqrResult.isValid) {
        return {
          type: 'buffr_payment',
          phone: namqrResult.accountType === 'buffr' ? namqrResult.identifier : undefined,
          walletId: namqrResult.accountType === 'wallet' ? namqrResult.identifier : undefined,
          accountType: namqrResult.accountType,
          amount: namqrResult.amount,
          currency: namqrResult.currency,
          isValid: true,
        };
      }
    }

    // Try parsing as JSON (legacy format)
    if (qrData.trim().startsWith('{')) {
      const jsonData = JSON.parse(qrData);
      
      if (jsonData.type === 'buffr_payment') {
        return {
          type: 'buffr_payment',
          userId: jsonData.userId,
          phone: jsonData.phone,
          accountType: jsonData.accountType || 'buffr',
          walletId: jsonData.walletId,
          walletName: jsonData.walletName,
          isValid: true,
        };
      }
    }

    // Try parsing as URL format: buffr://pay?userId=...&phone=...&type=...
    if (qrData.startsWith('buffr://pay') || qrData.startsWith('buffr://')) {
      const url = new URL(qrData.replace('buffr://', 'https://'));
      const params = new URLSearchParams(url.search);

      return {
        type: 'buffr_payment',
        userId: params.get('userId') || undefined,
        phone: params.get('phone') || undefined,
        accountType: (params.get('type') as 'buffr' | 'wallet') || 'buffr',
        walletId: params.get('walletId') || undefined,
        walletName: params.get('walletName') || undefined,
        isValid: true,
      };
    }

    // Try parsing as simple phone number (legacy)
    const phoneMatch = qrData.match(/^\+?[0-9]{10,15}$/);
    if (phoneMatch) {
      return {
        type: 'buffr_payment',
        phone: qrData,
        accountType: 'buffr',
        isValid: true,
      };
    }

    // Invalid format
    return {
      type: 'buffr_payment',
      accountType: 'buffr',
      isValid: false,
      error: 'Invalid QR code format. Please scan a valid Buffr payment QR code.',
    };
  } catch (error) {
    return {
      type: 'buffr_payment',
      accountType: 'buffr',
      isValid: false,
      error: error instanceof Error ? error.message : 'Failed to parse QR code',
    };
  }
}

/**
 * Generate QR code data for a Buffr payment account
 * Now uses NAMQR format by default
 * @param userId - User ID
 * @param phone - Phone number
 * @param accountType - Account type (buffr or wallet)
 * @param walletId - Wallet ID (if accountType is wallet)
 * @param walletName - Wallet name (optional)
 * @param amount - Transaction amount (optional, for dynamic QR)
 * @param useNAMQR - Whether to use NAMQR format (default: true)
 * @returns NAMQR string or legacy JSON string
 */
export function generateQRPaymentData(
  userId: string,
  phone: string,
  accountType: 'buffr' | 'wallet' = 'buffr',
  walletId?: string,
  walletName?: string,
  amount?: string,
  useNAMQR: boolean = true
): string {
  // Use NAMQR format (requires namqr utilities)
  if (useNAMQR) {
    // Import NAMQR generators
    const { generateBuffrAccountNAMQR, generateBuffrWalletNAMQR } = require('./namqr');
    
    // Generate token vault ID (in production, this would come from Token Vault API)
    // Format: xx-digit unique identifier (using timestamp + random for demo)
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 11);
    const tokenVaultId = `${timestamp}${random}`.substring(0, 20); // 20-digit identifier
    
    if (accountType === 'wallet' && walletId) {
      return generateBuffrWalletNAMQR(
        walletId,
        walletName || 'Buffr Wallet',
        'Windhoek', // Default city, should come from user/wallet data
        tokenVaultId,
        amount,
        !amount // Static if no amount, dynamic if amount provided
      );
    } else {
      return generateBuffrAccountNAMQR(
        phone,
        'Buffr User', // Should come from user data
        'Windhoek', // Default city, should come from user data
        tokenVaultId,
        amount,
        !amount // Static if no amount, dynamic if amount provided
      );
    }
  }
  
  // Legacy JSON format (for backward compatibility)
  return JSON.stringify({
    type: 'buffr_payment',
    userId,
    phone,
    accountType,
    walletId,
    walletName,
  });
}
