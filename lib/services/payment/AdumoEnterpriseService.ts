/**
 * Adumo Enterprise Payment Service
 *
 * Purpose: Server-side card API (Enterprise). Guest checkout prefers Adumo Virtual (hosted page).
 * Location: /lib/services/payment/AdumoEnterpriseService.ts
 */

import { adumoConfig } from '@/lib/config/adumo';

type AdumoAction = 'authorise' | 'reverse' | 'settle' | 'refund';

export interface AdumoCardInput {
  cardHolderFullName?: string;
  cardNumber?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cvv?: string;
  saveCardDetails?: boolean;
  token?: string;
  profileUid?: string;
  uci?: string;
}

export interface AdumoInitiateInput {
  value: number;
  merchantReference: string;
  ipAddress: string;
  userAgent: string;
  budgetPeriod?: number;
  currency?: string;
  card?: AdumoCardInput;
}

export interface AdumoInitiateResponse {
  transactionId: string;
  threeDSecureAuthRequired: boolean;
  threeDSecureProvider?: string;
  acsUrl?: string;
  acsPayload?: string;
  acsMD?: string;
  profileUid?: string;
}

export interface AdumoTransactionResponse {
  statusCode: number;
  statusMessage: string;
  autoSettle?: boolean;
  authorisedAmount?: number;
  cardCountry?: string;
  currencyCode?: string;
  eciFlag?: string;
  authorisationCode?: string;
  processorResponse?: string;
}

interface AdumoOAuthToken {
  accessToken: string;
  expiresAtEpochMs: number;
}

export class AdumoEnterpriseService {
  private static oauthToken: AdumoOAuthToken | null = null;

  static isConfigured(): boolean {
    return Boolean(
      adumoConfig.clientId &&
      adumoConfig.clientSecret &&
      adumoConfig.merchantUid &&
      adumoConfig.applicationUid
    );
  }

  static async initiate(input: AdumoInitiateInput): Promise<AdumoInitiateResponse> {
    const token = await this.getBearerToken();
    const payload = this.buildInitiatePayload(input);

    return this.request<AdumoInitiateResponse>({
      path: '/products/payments/v1/card/initiate',
      method: 'POST',
      token,
      body: payload,
    });
  }

  static async performAction(
    action: AdumoAction,
    transactionId: string,
    amount?: number
  ): Promise<AdumoTransactionResponse> {
    const token = await this.getBearerToken();
    const body: Record<string, unknown> = { transactionId };
    if (typeof amount === 'number') {
      body.amount = amount;
    }

    return this.request<AdumoTransactionResponse>({
      path: `/products/payments/v1/card/${action}`,
      method: 'POST',
      token,
      body,
    });
  }

  static async authenticate3DS(transactionId: string): Promise<Record<string, unknown>> {
    const token = await this.getBearerToken();
    return this.request<Record<string, unknown>>({
      path: `/product/authentication/v2/tds/authenticate/${transactionId}`,
      method: 'GET',
      token,
    });
  }

  private static buildInitiatePayload(input: AdumoInitiateInput): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      merchantUid: adumoConfig.merchantUid,
      applicationUid: adumoConfig.applicationUid,
      value: Number(input.value.toFixed(2)),
      merchantReference: input.merchantReference,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      budgetPeriod: input.budgetPeriod ?? 0,
      currency: input.currency ?? 'NAD',
    };

    if (input.card) {
      const {
        cardHolderFullName,
        cardNumber,
        expiryMonth,
        expiryYear,
        cvv,
        saveCardDetails,
        token,
        profileUid,
        uci,
      } = input.card;

      if (cardHolderFullName) payload.cardHolderFullName = cardHolderFullName;
      if (cardNumber) payload.cardNumber = cardNumber;
      if (expiryMonth) payload.expiryMonth = expiryMonth;
      if (expiryYear) payload.expiryYear = expiryYear;
      if (cvv) payload.cvv = cvv;
      if (typeof saveCardDetails === 'boolean') payload.saveCardDetails = saveCardDetails;
      if (token) payload.token = token;
      if (profileUid) payload.profileUid = profileUid;
      if (uci) payload.uci = uci;
    }

    return payload;
  }

  private static async getBearerToken(): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Adumo is not configured. Missing ADUMO_* environment variables.');
    }

    const now = Date.now();
    if (this.oauthToken && this.oauthToken.expiresAtEpochMs > now + 15_000) {
      return this.oauthToken.accessToken;
    }

    const authUrl =
      `${adumoConfig.baseUrl}/oauth/token?grant_type=client_credentials` +
      `&client_id=${encodeURIComponent(adumoConfig.clientId)}` +
      `&client_secret=${encodeURIComponent(adumoConfig.clientSecret)}`;

    const res = await fetch(authUrl, { method: 'POST' });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Adumo OAuth failed (${res.status}): ${text}`);
    }

    const tokenPayload = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };

    this.oauthToken = {
      accessToken: tokenPayload.access_token,
      expiresAtEpochMs: now + tokenPayload.expires_in * 1000,
    };

    return tokenPayload.access_token;
  }

  private static async request<T>(params: {
    path: string;
    method: 'GET' | 'POST';
    token: string;
    body?: Record<string, unknown>;
  }): Promise<T> {
    const res = await fetch(`${adumoConfig.baseUrl}${params.path}`, {
      method: params.method,
      headers: {
        Authorization: `Bearer ${params.token}`,
        'Content-Type': 'application/json',
      },
      body: params.body ? JSON.stringify(params.body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Adumo request failed (${res.status}): ${text}`);
    }

    return (await res.json()) as T;
  }
}
