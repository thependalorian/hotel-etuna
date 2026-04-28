/**
 * Payment Initiation Service (PIS) - Namibian Open Banking Standards v1.0
 * 
 * Purpose: Allow authorized TPPs to initiate payments on behalf of account holders
 * Location: /lib/services/openbanking/PaymentInitiationService.ts
 * 
 * Implements:
 * - Namibian Open Banking Standards v1.0 (Section 9.2.5: PIS Use Cases)
 * - Make Payment API
 * - Get Payment Status API
 * - List Beneficiaries API
 * 
 * Compliance:
 * - Requires OAuth 2.0 access token with 'banking:payments.write' scope
 * - PSD-12: Two-factor authentication required for all payments
 * - Payment streams: NRTC, EnCR (per Open Banking Standards Section 9.2.4)
 * - Trust account integration (PSD-3: 100% reserve)
 * 
 * @version 1.0.0
 * @since January 28, 2026
 */

import { db, transactions, trustAccountsPsd3, eq, and, desc } from '@/lib/db';
import { OAuthService } from './OAuthService';
import { TwoFactorAuthService, type TwoFactorMethod } from '@/lib/services/security/TwoFactorAuthService';
import crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface MakePaymentRequest {
  accessToken: string;

  // Payer (Debtor)
  payerAccountId: string;

  // Payee (Creditor)
  payeeIdentifier: string; // Mobile number, account alias, or account@provider
  payeeName: string;
  payeeAccountType: 'bank' | 'ewallet' | 'card';

  // Payment details
  amount: number;
  currency: string; // NAD
  reference?: string;
  description?: string;
  paymentStream: 'NRTC' | 'EnCR'; // Per Open Banking Standards

  // 2FA authentication (PSD-12 requirement)
  authMethod: string; // 'otp_sms', 'biometric', 'app_pin'
  authValue: string; // OTP code, biometric token, or PIN
}

export interface MakePaymentResponse {
  data: {
    paymentId: string;
    paymentReference: string;
    status: string; // 'initiated', 'pending', 'processing'
    estimatedSettlement: string; // ISO 8601 timestamp
  };
}

export interface GetPaymentStatusRequest {
  accessToken: string;
  paymentId: string;
}

export interface GetPaymentStatusResponse {
  data: {
    paymentId: string;
    paymentReference: string;
    status: string; // 'initiated', 'pending', 'processing', 'completed', 'failed'
    amount: number;
    currency: string;
    payeeName: string;
    initiatedAt: string; // ISO 8601
    completedAt?: string; // ISO 8601
    failureReason?: string;
  };
}

export interface Beneficiary {
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryIdentifier: string; // Mobile, alias, or account@provider
  beneficiaryAccountType: 'bank' | 'ewallet' | 'card';
  lastUsedDate?: string;
  isFavorite: boolean;
}

type PaymentMetadata = {
  payeeIdentifier?: string;
  payeeName?: string;
  payeeAccountType?: Beneficiary['beneficiaryAccountType'];
  tppParticipantId?: string | null;
  errorMessage?: string;
};

// ============================================================================
// PAYMENT INITIATION SERVICE
// ============================================================================

export class PaymentInitiationService {
  /**
   * Make Payment (Initiate Payment)
   * 
   * POST /bon/v1/banking/payments
   * 
   * Initiates payment on behalf of account holder
   * Requires scope: banking:payments.write
   * Requires 2FA authentication (PSD-12)
   * 
   * @param request - Payment initiation request
   * @returns Payment ID and initial status
   */
  static async makePayment(request: MakePaymentRequest): Promise<MakePaymentResponse> {
    // Validate access token and scopes
    const consent = await OAuthService.validateAccessToken(
      request.accessToken,
      ['banking:payments.write']
    );

    // Verify payer account matches consent
    if (request.payerAccountId !== consent.accountHolderId) {
      throw new Error('UNAUTHORIZED: Cannot initiate payment from this account');
    }

    // Validate 2FA (PSD-12 requirement)
    const is2FAValid = await this.validate2FA(
      request.payerAccountId,
      request.authMethod,
      request.authValue
    );

    if (!is2FAValid) {
      throw new Error('AUTHENTICATION_FAILED: Two-factor authentication failed');
    }

    // Validate currency
    if (request.currency !== 'NAD') {
      throw new Error('INVALID_CURRENCY: Only NAD is supported');
    }

    // Validate amount
    if (request.amount <= 0) {
      throw new Error('INVALID_AMOUNT: Amount must be positive');
    }

    // Validate payment stream
    const validStreams = ['NRTC', 'EnCR'];
    if (!validStreams.includes(request.paymentStream)) {
      throw new Error(`INVALID_PAYMENT_STREAM: Must be one of ${validStreams.join(', ')}`);
    }

    // Check sufficient balance (if applicable)
    const hasSufficientFunds = await this.checkSufficientFunds(
      request.payerAccountId,
      request.amount
    );

    if (!hasSufficientFunds) {
      throw new Error('INSUFFICIENT_FUNDS: Account has insufficient balance');
    }

    // Generate payment reference
    const paymentReference = this.generatePaymentReference();

    // Calculate estimated settlement time
    const estimatedSettlement = this.calculateSettlementTime(request.paymentStream);

    // Create transaction record
    const [transaction] = await db.insert(transactions).values({
      tenantId: consent.tppParticipantId, // TPP as tenant context
      guestId: request.payerAccountId,
      transactionReference: paymentReference,
      type: 'payment',
      amount: request.amount.toString(),
      currency: request.currency,
      status: 'initiated',
      paymentGateway: `openbanking_${request.paymentStream.toLowerCase()}`,
      description: request.description || 'Open Banking payment',
      metadata: {
        payeeIdentifier: request.payeeIdentifier,
        payeeName: request.payeeName,
        payeeAccountType: request.payeeAccountType,
        paymentStream: request.paymentStream,
        tppParticipantId: consent.tppParticipantId,
        consentId: consent.consentId,
        authMethod: request.authMethod,
      },
    }).returning();

    // Reserve funds in trust account (PSD-3 compliance)
    await this.reserveTrustAccountFunds(
      consent.tppParticipantId || '',
      request.amount,
      transaction.id
    );

    return {
      data: {
        paymentId: transaction.id,
        paymentReference,
        status: 'initiated',
        estimatedSettlement: estimatedSettlement.toISOString(),
      },
    };
  }

  /**
   * Get Payment Status
   * 
   * GET /bon/v1/banking/payments/{id}/status
   * 
   * Returns current status of payment
   * Requires scope: banking:payments.read
   * 
   * @param request - Payment status request
   * @returns Payment status
   */
  static async getPaymentStatus(request: GetPaymentStatusRequest): Promise<GetPaymentStatusResponse> {
    // Validate access token
    const consent = await OAuthService.validateAccessToken(
      request.accessToken,
      ['banking:payments.read']
    );

    // Get payment transaction
    const payment = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, request.paymentId))
      .limit(1);

    if (!payment || payment.length === 0) {
      throw new Error('PAYMENT_NOT_FOUND: Payment does not exist');
    }

    const paymentRecord = payment[0];

    // Verify payment was initiated by this TPP
    const metadata = paymentRecord.metadata as PaymentMetadata | null;
    if (metadata?.tppParticipantId !== consent.tppParticipantId) {
      throw new Error('UNAUTHORIZED: Payment was not initiated by this TPP');
    }

    return {
      data: {
        paymentId: paymentRecord.id,
        paymentReference: paymentRecord.transactionReference,
        status: paymentRecord.status ?? 'pending',
        amount: Number(paymentRecord.amount),
        currency: paymentRecord.currency ?? 'NAD',
        payeeName: metadata?.payeeName || 'Unknown',
        initiatedAt: paymentRecord.createdAt?.toISOString() || '',
        completedAt: paymentRecord.processedAt?.toISOString(),
        failureReason: metadata?.errorMessage,
      },
    };
  }

  /**
   * List Beneficiaries
   * 
   * GET /bon/v1/banking/beneficiaries
   * 
   * Returns saved beneficiaries for the account holder
   * Requires scope: banking:accounts.basic.read
   * 
   * @param accessToken - OAuth access token
   * @returns List of beneficiaries
   */
  static async listBeneficiaries(accessToken: string): Promise<{ data: Beneficiary[] }> {
    // Validate access token
    const consent = await OAuthService.validateAccessToken(
      accessToken,
      ['banking:accounts.basic.read']
    );

    // Get past payment recipients
    const pastPayments = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.guestId, consent.accountHolderId || ''),
          eq(transactions.type, 'payment')
        )
      )
      .orderBy(desc(transactions.createdAt))
      .limit(50);

    // Extract unique beneficiaries
    const beneficiariesMap = new Map<string, Beneficiary>();

    for (const payment of pastPayments) {
      const metadata = payment.metadata as PaymentMetadata | null;
      if (metadata?.payeeIdentifier) {
        if (!beneficiariesMap.has(metadata.payeeIdentifier)) {
          beneficiariesMap.set(metadata.payeeIdentifier, {
            beneficiaryId: crypto.randomUUID(),
            beneficiaryName: metadata.payeeName || 'Unknown',
            beneficiaryIdentifier: metadata.payeeIdentifier,
            beneficiaryAccountType: metadata.payeeAccountType || 'bank',
            lastUsedDate: payment.createdAt?.toISOString().split('T')[0],
            isFavorite: false,
          });
        }
      }
    }

    return {
      data: Array.from(beneficiariesMap.values()),
    };
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Validate 2FA authentication (PSD-12 requirement)
   * 
   * @param accountHolderId - Account holder ID
   * @param authMethod - Authentication method
   * @param authValue - Authentication value (OTP, biometric token, PIN)
   * @returns true if valid
   */
  private static async validate2FA(
    accountHolderId: string,
    authMethod: string,
    authValue: string
  ): Promise<boolean> {
    if (!authValue?.trim()) {
      return false;
    }

    const method = this.mapOpenBankingAuthMethod(authMethod);
    if (!method) {
      return false;
    }

    const verification = await TwoFactorAuthService.verify2FA({
      userId: accountHolderId,
      method,
      code: authValue,
      context: 'payment_initiation',
      metadata: {
        openBankingAuthMethod: authMethod,
        accountHolderId,
      },
    });

    return verification.success && verification.verified;
  }

  /**
   * Map Open Banking payment auth method names to platform 2FA methods.
   */
  private static mapOpenBankingAuthMethod(authMethod: string): TwoFactorMethod | null {
    const normalized = authMethod.trim().toLowerCase();
    const methodMap: Record<string, TwoFactorMethod> = {
      otp_sms: 'sms',
      sms: 'sms',
      biometric: 'biometric',
      app_pin: 'totp',
      totp: 'totp',
      backup_code: 'backup_code',
    };

    return methodMap[normalized] ?? null;
  }

  /**
   * Check sufficient funds in account
   */
  private static async checkSufficientFunds(
    accountId: string,
    amount: number
  ): Promise<boolean> {
    // In real bank, query actual balance
    // For Buffr Host, check transaction history
    const guestTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.guestId, accountId));

    let balance = 0;
    for (const txn of guestTransactions) {
      if (txn.status === 'completed') {
        balance += Number(txn.amount);
      }
    }

    return balance >= amount;
  }

  /**
   * Reserve funds in trust account (PSD-3 compliance)
   * 
   * When payment is initiated, funds are reserved in trust account
   * Outstanding liabilities increase, but actual payment not yet made
   * 
   * @param tppId - TPP participant ID
   * @param amount - Amount to reserve
   * @param transactionId - Related transaction ID
   */
  private static async reserveTrustAccountFunds(
    tppId: string,
    amount: number,
    transactionId: string
  ): Promise<void> {
    void transactionId;

    // Find trust account for this tenant
    // In production, each tenant/TPP has trust account
    const trustAccounts = await db
      .select()
      .from(trustAccountsPsd3)
      .where(eq(trustAccountsPsd3.status, 'active'))
      .limit(1);

    if (!trustAccounts || trustAccounts.length === 0) {
      // Create trust account if doesn't exist
      return; // For now, skip if no trust account
    }

    const trustAccount = trustAccounts[0];

    // Update outstanding liabilities
    const newLiabilities = Number(trustAccount.outstandingLiabilities) + amount;

    // Verify 100% reserve requirement (PSD-3)
    if (newLiabilities > Number(trustAccount.balance)) {
      throw new Error('TRUST_ACCOUNT_DEFICIENT: Insufficient funds in trust account');
    }

    // Update trust account
    const newReservePercentage = (Number(trustAccount.balance) / newLiabilities) * 100;

    await db
      .update(trustAccountsPsd3)
      .set({
        outstandingLiabilities: newLiabilities.toString(),
        reservePercentage: newReservePercentage.toString(),
        updatedAt: new Date(),
      })
      .where(eq(trustAccountsPsd3.id, trustAccount.id));

    // Log transaction in trust account transactions table
    // (Implementation would go here)
  }

  /**
   * Calculate estimated settlement time based on payment stream
   * 
   * @param paymentStream - NRTC or EnCR
   * @returns Estimated settlement timestamp
   */
  private static calculateSettlementTime(paymentStream: string): Date {
    const now = new Date();

    if (paymentStream === 'NRTC') {
      // Near-Real-Time Credit: < 60 seconds
      return new Date(now.getTime() + 60 * 1000);
    } else if (paymentStream === 'EnCR') {
      // Enhanced Credit: Same business day
      // Assume cutoff at 15:00, settlement by 17:00
      const cutoffHour = 15;
      const settlementHour = 17;
      
      const settlement = new Date(now);
      settlement.setHours(settlementHour, 0, 0, 0);

      if (now.getHours() >= cutoffHour) {
        // Past cutoff, next business day
        settlement.setDate(settlement.getDate() + 1);
      }

      return settlement;
    } else {
      // Default: 1 hour
      return new Date(now.getTime() + 60 * 60 * 1000);
    }
  }

  /**
   * Generate payment reference
   * Format: PAY-{timestamp}-{random}
   */
  private static generatePaymentReference(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `PAY-${timestamp}-${random}`;
  }
}
