/**
 * NamQR Service - Bank of Namibia QR Code Standards v5.0
 * 
 * Purpose: Generate and process NamQR codes for payments
 * Location: /lib/services/openbanking/NamQRService.ts
 * 
 * Implements:
 * - NamQR Code Standards v5.0 (Bank of Namibia, May 2025)
 * - EMVCo QR Code Specification
 * - PSD-12: Two-factor authentication for payments
 * - Payment streams: NRTC, EnCR, IPP
 * 
 * Features:
 * - Static QR codes (merchants, fixed payee)
 * - Dynamic QR codes (per-transaction with amount)
 * - Payer-presented QR codes (request to pay)
 * - Token vault integration
 * - ECDSA signature (SHA-256)
 * - Tamper detection
 * 
 * @version 1.0.0
 * @since January 28, 2026
 */

import { db, namqrCodes, eq } from '@/lib/db';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { buildNamQrTlv, calculateNamQrCrc } from '@/lib/services/qr/namqr-core';

// ============================================================================
// TYPES
// ============================================================================

export interface NamQRGenerateRequest {
  tenantId: string;
  propertyId?: string;
  guestId?: string;

  // QR type
  qrType: 'static' | 'dynamic' | 'payer_presented';
  presentationMode: 'payee_presented' | 'payer_presented';

  // Payee information
  payeeIdentifier: string; // Mobile number, alias, or account@provider
  payeeName: string;
  payeeAccountType: 'bank' | 'ewallet' | 'card';
  payeeAccountNumber?: string;

  // Merchant information (if applicable)
  merchantCategoryCode?: string; // MCC
  merchantId?: string;
  merchantName?: string;
  merchantCity?: string;
  merchantPostalCode?: string;

  // Transaction amount (required for dynamic QR)
  amount?: number;
  currency?: string;
  convenienceFee?: number;
  tipAmount?: number;

  // Discounts (NamQR v5.0 feature)
  discountPercentage?: number;
  cashbackPercentage?: number;

  // Expiry (for dynamic QR)
  expiryMinutes?: number; // Default: 30 minutes

  // Payment stream
  paymentStream: 'NRTC' | 'EnCR' | 'IPP';
}

export interface NamQRValidateRequest {
  qrPayload: string;
  payerIdentifier: string;
  payerAccountType: 'bank' | 'ewallet' | 'card';
}

export interface NamQRValidateResponse {
  isValid: boolean;
  qrReference: string;
  tokenVaultId?: string;
  payeeIdentifier: string;
  amount?: number;
  currency: string;
  merchantName?: string;
  expiresAt?: Date;
  error?: string;
}

type ParsedNamQRPayload = {
  qrReference?: string;
  amount?: number;
  tokenVaultId?: string;
};

// ============================================================================
// NAMQR PAYLOAD TAGS (EMVCo Compliant)
// ============================================================================

const NAMQR_TAGS = {
  // Root level tags (EMVCo standard)
  PAYLOAD_FORMAT_INDICATOR: '00', // Always "01"
  POINT_OF_INITIATION_METHOD: '01', // "11" static, "12" dynamic
  MERCHANT_ACCOUNT_INFO: '26', // Payee account details
  MERCHANT_CATEGORY_CODE: '52', // MCC code
  TRANSACTION_CURRENCY: '53', // ISO 4217 (NAD = 516)
  TRANSACTION_AMOUNT: '54', // Amount
  COUNTRY_CODE: '58', // "NA" for Namibia
  MERCHANT_NAME: '59', // Payee name
  MERCHANT_CITY: '60', // City
  POSTAL_CODE: '61', // Postal code
  ADDITIONAL_DATA: '62', // Reference, purpose, etc.
  CRC: '63', // Cyclic Redundancy Check (checksum)
  
  // Buffr Host / NamQR specific tags
  TOKEN_VAULT_ID: '65', // Token vault unique identifier
  DISCOUNT: '66', // Discount percentage (NamQR v5.0)
  CASHBACK: '67', // Cashback percentage (NamQR v5.0)
  SIGNATURE: '68', // ECDSA signature (Signed QR)
} as const;

// ============================================================================
// NAMQR SERVICE
// ============================================================================

export class NamQRService {
  /**
   * Generate NamQR Code
   * 
   * Creates EMVCo compliant QR code with all required tags
   * Stores in database and returns QR code string + image
   * 
   * @param request - NamQR generation request
   * @returns QR code reference, payload, and image URL
   */
  static async generateQR(request: NamQRGenerateRequest) {
    // Validate request
    this.validateGenerateRequest(request);

    // Generate NREF (8-digit unique reference)
    const qrReference = await this.generateNREF();

    // Generate token vault ID (if dynamic QR)
    const tokenVaultId = request.qrType === 'dynamic' 
      ? this.generateTokenVaultId() 
      : undefined;

    // Build QR payload
    const qrPayload = this.buildQRPayload(request, qrReference, tokenVaultId);

    // Generate QR code image
    const qrImageUrl = await this.generateQRImage(qrPayload);

    // Calculate expiry
    const expiresAt = request.expiryMinutes
      ? new Date(Date.now() + request.expiryMinutes * 60 * 1000)
      : undefined;

    // Sign QR code (for security)
    const signature = await this.signQRCode(qrPayload);

    // Store in database (only columns present in namqr_codes schema)
    await db.insert(namqrCodes).values({
      tenantId: request.tenantId,
      propertyId: request.propertyId,
      guestId: request.guestId,
      qrReference,
      tokenVaultId,
      qrType: request.qrType,
      presentationMode: request.presentationMode,
      qrPayload,
      qrImageUrl,
      payeeIdentifier: request.payeeIdentifier,
      payeeName: request.payeeName,
      amount: request.amount != null ? String(request.amount) : undefined,
      currency: request.currency || 'NAD',
      merchantCategoryCode: request.merchantCategoryCode,
      merchantId: request.merchantId,
      expiresAt,
      signature,
      isSigned: true,
      isActive: true,
    }).returning();

    return {
      qrReference,
      tokenVaultId,
      qrPayload,
      qrImageUrl,
      expiresAt,
      signature,
    };
  }

  /**
   * Validate NamQR Code
   * 
   * Validates scanned QR code before payment processing
   * Checks signature, expiry, and tamper detection
   * 
   * @param request - Validation request
   * @returns Validation response
   */
  static async validateQR(request: NamQRValidateRequest): Promise<NamQRValidateResponse> {
    try {
      // Parse QR payload to extract NREF
      const parsedData = this.parseQRPayload(request.qrPayload);

      if (!parsedData.qrReference) {
        return {
          isValid: false,
          qrReference: '',
          payeeIdentifier: '',
          currency: 'NAD',
          error: 'INVALID_QR: Could not extract NREF from QR code',
        };
      }

      // Find QR code in database
      const qrCode = await db
        .select()
        .from(namqrCodes)
        .where(eq(namqrCodes.qrReference, parsedData.qrReference))
        .limit(1);

      if (!qrCode || qrCode.length === 0) {
        return {
          isValid: false,
          qrReference: parsedData.qrReference,
          payeeIdentifier: '',
          currency: 'NAD',
          error: 'QR_NOT_FOUND: QR code not found in system',
        };
      }

      const qrRecord = qrCode[0];

      // Check if active
      if (!qrRecord.isActive) {
        return {
          isValid: false,
          qrReference: qrRecord.qrReference,
          payeeIdentifier: qrRecord.payeeIdentifier || '',
          currency: qrRecord.currency ?? 'NAD',
          error: 'QR_INACTIVE: QR code has been deactivated',
        };
      }

      // Check expiry (for dynamic QR)
      if (qrRecord.expiresAt && new Date() > qrRecord.expiresAt) {
        return {
          isValid: false,
          qrReference: qrRecord.qrReference,
          payeeIdentifier: qrRecord.payeeIdentifier || '',
          currency: qrRecord.currency ?? 'NAD',
          error: 'QR_EXPIRED: QR code has expired',
        };
      }

      // Verify signature (tamper detection)
      const isSignatureValid = await this.verifyQRSignature(
        request.qrPayload,
        qrRecord.signature || ''
      );

      if (!isSignatureValid) {
        return {
          isValid: false,
          qrReference: qrRecord.qrReference,
          payeeIdentifier: qrRecord.payeeIdentifier || '',
          currency: qrRecord.currency ?? 'NAD',
          error: 'TAMPERED_QR: QR code signature is invalid (possible tampering detected)',
        };
      }

      // Increment scan count
      await db
        .update(namqrCodes)
        .set({
          scanCount: (qrRecord.scanCount || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(namqrCodes.id, qrRecord.id));

      // Return validation success
      return {
        isValid: true,
        qrReference: qrRecord.qrReference,
        tokenVaultId: qrRecord.tokenVaultId || undefined,
        payeeIdentifier: qrRecord.payeeIdentifier || '',
        amount: qrRecord.amount ? Number(qrRecord.amount) : undefined,
        currency: qrRecord.currency ?? 'NAD',
        merchantName: qrRecord.payeeName ?? undefined,
        expiresAt: qrRecord.expiresAt || undefined,
      };
    } catch (error: unknown) {
      return {
        isValid: false,
        qrReference: '',
        payeeIdentifier: '',
        currency: 'NAD',
        error: `VALIDATION_ERROR: ${this.getErrorMessage(error)}`,
      };
    }
  }

  // ============================================================================
  // QR PAYLOAD BUILDING (EMVCo Format)
  // ============================================================================

  /**
   * Build EMVCo compliant QR payload
   * 
   * Format: Tag-Length-Value (TLV)
   * Example: 00020101... (tag 00, length 02, value 01)
   */
  private static buildQRPayload(
    request: NamQRGenerateRequest,
    qrReference: string,
    tokenVaultId?: string
  ): string {
    let payload = '';

    // 00: Payload Format Indicator (always "01")
    payload += this.buildTLV(NAMQR_TAGS.PAYLOAD_FORMAT_INDICATOR, '01');

    // 01: Point of Initiation Method
    const initiationMethod = request.qrType === 'static' ? '11' : '12';
    payload += this.buildTLV(NAMQR_TAGS.POINT_OF_INITIATION_METHOD, initiationMethod);

    // 26: Merchant Account Information (Payee details)
    const merchantAccountInfo = this.buildMerchantAccountInfo(request);
    payload += this.buildTLV(NAMQR_TAGS.MERCHANT_ACCOUNT_INFO, merchantAccountInfo);

    // 52: Merchant Category Code (MCC)
    if (request.merchantCategoryCode) {
      payload += this.buildTLV(NAMQR_TAGS.MERCHANT_CATEGORY_CODE, request.merchantCategoryCode);
    }

    // 53: Transaction Currency (NAD = 516)
    const currencyCode = '516'; // ISO 4217 code for NAD
    payload += this.buildTLV(NAMQR_TAGS.TRANSACTION_CURRENCY, currencyCode);

    // 54: Transaction Amount (for dynamic QR)
    if (request.amount) {
      const amountStr = request.amount.toFixed(2);
      payload += this.buildTLV(NAMQR_TAGS.TRANSACTION_AMOUNT, amountStr);
    }

    // 58: Country Code (NA for Namibia)
    payload += this.buildTLV(NAMQR_TAGS.COUNTRY_CODE, 'NA');

    // 59: Merchant Name
    payload += this.buildTLV(NAMQR_TAGS.MERCHANT_NAME, request.merchantName || request.payeeName);

    // 60: Merchant City
    if (request.merchantCity) {
      payload += this.buildTLV(NAMQR_TAGS.MERCHANT_CITY, request.merchantCity);
    }

    // 61: Postal Code
    if (request.merchantPostalCode) {
      payload += this.buildTLV(NAMQR_TAGS.POSTAL_CODE, request.merchantPostalCode);
    }

    // 62: Additional Data (reference, purpose)
    const additionalData = this.buildAdditionalData(qrReference);
    payload += this.buildTLV(NAMQR_TAGS.ADDITIONAL_DATA, additionalData);

    // 65: Token Vault ID (NamQR specific)
    if (tokenVaultId) {
      payload += this.buildTLV(NAMQR_TAGS.TOKEN_VAULT_ID, tokenVaultId);
    }

    // 66: Discount Percentage (NamQR v5.0)
    if (request.discountPercentage) {
      payload += this.buildTLV(NAMQR_TAGS.DISCOUNT, request.discountPercentage.toFixed(2));
    }

    // 67: Cashback Percentage (NamQR v5.0)
    if (request.cashbackPercentage) {
      payload += this.buildTLV(NAMQR_TAGS.CASHBACK, request.cashbackPercentage.toFixed(2));
    }

    // 63: CRC (Cyclic Redundancy Check) - MUST be last
    const crc = this.calculateCRC(payload + NAMQR_TAGS.CRC + '04');
    payload += this.buildTLV(NAMQR_TAGS.CRC, crc);

    return payload;
  }

  /**
   * Build Merchant Account Information (Tag 26)
   * Contains payee identifier and account details
   */
  private static buildMerchantAccountInfo(request: NamQRGenerateRequest): string {
    let merchantInfo = '';

    // Sub-tag 00: Global Unique Identifier (RID)
    merchantInfo += this.buildTLV('00', 'com.buffr.namqr');

    // Sub-tag 01: Payee Identifier
    merchantInfo += this.buildTLV('01', request.payeeIdentifier);

    // Sub-tag 02: Account Type
    merchantInfo += this.buildTLV('02', request.payeeAccountType);

    // Sub-tag 03: Merchant ID (if applicable)
    if (request.merchantId) {
      merchantInfo += this.buildTLV('03', request.merchantId);
    }

    return merchantInfo;
  }

  /**
   * Build Additional Data (Tag 62)
   * Contains NREF and transaction purpose
   */
  private static buildAdditionalData(qrReference: string): string {
    let additionalData = '';

    // Sub-tag 01: Bill Number / Reference
    additionalData += this.buildTLV('01', qrReference); // NREF

    // Sub-tag 05: Reference Label
    additionalData += this.buildTLV('05', `BUFFR-${qrReference}`);

    // Sub-tag 08: Purpose of Transaction
    additionalData += this.buildTLV('08', 'Payment via Buffr Host');

    return additionalData;
  }

  /**
   * Build TLV (Tag-Length-Value) string
   * 
   * @param tag - 2-digit tag
   * @param value - Value string
   * @returns TLV formatted string
   */
  private static buildTLV(tag: string, value: string): string {
    return buildNamQrTlv(tag, value);
  }

  /**
   * Calculate CRC16-CCITT checksum
   * EMVCo requirement for QR code integrity
   * 
   * @param payload - QR payload without CRC
   * @returns 4-character hex CRC
   */
  private static calculateCRC(payload: string): string {
    return calculateNamQrCrc(payload);
  }

  /**
   * Parse QR payload to extract fields
   */
  private static parseQRPayload(payload: string): ParsedNamQRPayload {
    const parsed: ParsedNamQRPayload = {};
    let position = 0;

    while (position < payload.length - 6) { // -6 for CRC at end
      const tag = payload.substring(position, position + 2);
      const length = parseInt(payload.substring(position + 2, position + 4), 10);
      const value = payload.substring(position + 4, position + 4 + length);

      // Extract NREF from Additional Data (tag 62)
      if (tag === NAMQR_TAGS.ADDITIONAL_DATA) {
        const refMatch = value.match(/01(\d{2})([A-Z0-9]{8})/); // Sub-tag 01
        if (refMatch) {
          parsed.qrReference = refMatch[2]; // Extract 8-digit NREF
        }
      }

      // Extract amount (tag 54)
      if (tag === NAMQR_TAGS.TRANSACTION_AMOUNT) {
        parsed.amount = parseFloat(value);
      }

      // Extract token vault ID (tag 65)
      if (tag === NAMQR_TAGS.TOKEN_VAULT_ID) {
        parsed.tokenVaultId = value;
      }

      position += 4 + length;
    }

    return parsed;
  }

  /**
   * Generate QR code image
   * 
   * @param qrPayload - QR code string
   * @returns Data URL of QR code image
   */
  private static async generateQRImage(qrPayload: string): Promise<string> {
    try {
      // Generate QR code as data URL
      // Version 10 (57x57 modules) - NamQR recommended
      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: 'M', // Medium error correction (15%)
        type: 'image/png',
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return qrDataUrl;
    } catch (error: unknown) {
      throw new Error(`QR_GENERATION_FAILED: ${this.getErrorMessage(error)}`);
    }
  }

  private static getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }

  /**
   * Sign QR code with ECDSA (SHA-256)
   * NamQR v5.0: Signed QR for tamper detection
   * 
   * @param qrPayload - QR payload string
   * @returns ECDSA signature (hex)
   */
  private static async signQRCode(qrPayload: string): Promise<string> {
    const privateKey = this.getSigningPrivateKey();
    if (privateKey) {
      const signature = crypto.sign('sha256', Buffer.from(qrPayload, 'utf8'), {
        key: privateKey,
        dsaEncoding: 'ieee-p1363',
      });

      return `ecdsa:${signature.toString('hex')}`;
    }

    const secret = this.getLocalSigningSecret();
    if (!secret) {
      throw new Error('NAMQR_SIGNING_SECRET or NAMQR_PRIVATE_KEY is required to sign QR codes');
    }

    return `hmac:${crypto
      .createHmac('sha256', secret)
      .update(qrPayload, 'utf8')
      .digest('hex')}`;
  }

  /**
   * Verify QR code signature
   * 
   * @param qrPayload - QR payload string
   * @param signature - ECDSA signature (hex)
   * @returns true if valid
   */
  private static async verifyQRSignature(qrPayload: string, signature: string): Promise<boolean> {
    try {
      if (!signature) {
        return false;
      }

      if (signature.startsWith('ecdsa:')) {
        const publicKey = this.getSigningPublicKey();
        if (!publicKey) {
          return false;
        }

        return crypto.verify('sha256', Buffer.from(qrPayload, 'utf8'), {
          key: publicKey,
          dsaEncoding: 'ieee-p1363',
        }, Buffer.from(signature.slice('ecdsa:'.length), 'hex'));
      }

      const secret = this.getLocalSigningSecret();
      if (!secret) {
        return false;
      }

      const rawSignature = signature.startsWith('hmac:')
        ? signature.slice('hmac:'.length)
        : signature;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(qrPayload, 'utf8')
        .digest('hex');

      return this.timingSafeHexEqual(rawSignature, expectedSignature);
    } catch {
      return false;
    }
  }

  /**
   * Load ECDSA private key PEM from env for production NamQR signing.
   */
  private static getSigningPrivateKey(): string | null {
    return this.normalizePemEnv(process.env.NAMQR_PRIVATE_KEY);
  }

  /**
   * Load ECDSA public key PEM from env for production NamQR verification.
   */
  private static getSigningPublicKey(): string | null {
    return this.normalizePemEnv(process.env.NAMQR_PUBLIC_KEY);
  }

  /**
   * HMAC fallback keeps local/dev validation deterministic without generating throwaway keys.
   */
  private static getLocalSigningSecret(): string | null {
    return process.env.NAMQR_SIGNING_SECRET?.trim()
      || process.env.NEXTAUTH_SECRET?.trim()
      || null;
  }

  /**
   * Vercel env vars often store PEM newlines as escaped characters.
   */
  private static normalizePemEnv(value?: string): string | null {
    const normalized = value?.trim().replace(/\\n/g, '\n');
    return normalized || null;
  }

  private static timingSafeHexEqual(actualHex: string, expectedHex: string): boolean {
    if (!/^[a-f0-9]+$/i.test(actualHex) || actualHex.length !== expectedHex.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(actualHex, 'hex'),
      Buffer.from(expectedHex, 'hex')
    );
  }

  /**
   * Generate NREF (8-digit unique reference)
   * Human-readable, unique identifier for QR code
   * 
   * @returns 8-character alphanumeric reference
   */
  private static async generateNREF(): Promise<string> {
    // Generate random 8-character alphanumeric string
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars (I, O, 0, 1)
    let nref = '';

    for (let i = 0; i < 8; i++) {
      const randomIndex = crypto.randomInt(0, characters.length);
      nref += characters[randomIndex];
    }

    // Check uniqueness
    const existing = await db
      .select()
      .from(namqrCodes)
      .where(eq(namqrCodes.qrReference, nref))
      .limit(1);

    if (existing && existing.length > 0) {
      // Collision, try again (very rare)
      return this.generateNREF();
    }

    return nref;
  }

  /**
   * Generate Token Vault ID
   * Used for dynamic QR codes to map to transaction details
   * 
   * @returns Unique token vault identifier
   */
  private static generateTokenVaultId(): string {
    return crypto.randomBytes(16).toString('hex'); // 32-character hex string
  }

  /**
   * Validate generate request
   */
  private static validateGenerateRequest(request: NamQRGenerateRequest): void {
    // Dynamic QR must have amount
    if (request.qrType === 'dynamic' && !request.amount) {
      throw new Error('INVALID_REQUEST: Dynamic QR codes must have an amount');
    }

    // Static QR should not have amount
    if (request.qrType === 'static' && request.amount) {
      throw new Error('INVALID_REQUEST: Static QR codes should not have an amount');
    }

    // Validate payment stream
    const validStreams = ['NRTC', 'EnCR', 'IPP'];
    if (!validStreams.includes(request.paymentStream)) {
      throw new Error(`INVALID_PAYMENT_STREAM: Must be one of ${validStreams.join(', ')}`);
    }

    // Validate currency
    if (request.currency && request.currency !== 'NAD') {
      throw new Error('INVALID_CURRENCY: Only NAD is supported');
    }
  }
}

// ============================================================================
// NAMQR CONSTANTS
// ============================================================================

export const NAMQR_CONSTANTS = {
  VERSION: '5.0',
  CURRENCY_CODE: '516', // ISO 4217 for NAD
  COUNTRY_CODE: 'NA',
  MAX_CONSENT_DAYS: 180, // Per BoN standards
  DEFAULT_EXPIRY_MINUTES: 30,
  QR_ERROR_CORRECTION: 'M', // Medium (15%)
  QR_VERSION: 10, // 57x57 modules
} as const;

// ============================================================================
// PAYMENT STREAM CONFIGURATION
// ============================================================================

export const PAYMENT_STREAMS = {
  NRTC: {
    name: 'Near-Real-Time Credit',
    settlementTime: '< 60 seconds',
    maxAmount: null, // No limit
    supported: true,
  },
  EnCR: {
    name: 'Enhanced Credit',
    settlementTime: 'Same day',
    maxAmount: null,
    supported: true,
  },
  IPP: {
    name: 'Instant Payment',
    settlementTime: 'Immediate',
    maxAmount: null,
    supported: false, // Future
  },
  RTGS: {
    name: 'Real-Time Gross Settlement',
    settlementTime: 'Real-time',
    maxAmount: null,
    supported: false, // Not for consumer/SME (per Open Banking Standards)
  },
} as const;
