/**
 * Adumo Online Virtual — hosted payment page (form POST + JWT).
 * Location: lib/services/payment/AdumoVirtualService.ts
 *
 * Guests enter card data on Adumo's PCI-compliant page; merchant validates _RESPONSE_TOKEN / webhook JWT.
 */

import { createHmac, randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { adumoConfig } from '@/lib/config/adumo';

export type AdumoVirtualPurpose = 'booking_deposit' | 'folio_settle' | 'dining_deposit';

export interface AdumoVirtualInitiateInput {
  amount: number;
  merchantReference: string;
  recipientName?: string;
  orderDescription?: string;
  variable1?: string;
  redirectSuccessUrl?: string;
  redirectFailedUrl?: string;
}

export interface AdumoVirtualFormPayload {
  actionUrl: string;
  fields: Record<string, string>;
}

export interface AdumoVirtualDecodedToken {
  result: number;
  mref: string;
  amount: string;
  cuid: string;
  auid: string;
  transactionIndex?: string;
  puid?: string;
  raw: jwt.JwtPayload;
}

export class AdumoVirtualService {
  static isConfigured(): boolean {
    return Boolean(
      adumoConfig.merchantUid &&
        adumoConfig.applicationUid &&
        adumoConfig.jwtSecret
    );
  }

  static buildMerchantReference(bookingId: string): string {
    const compact = bookingId.replace(/-/g, '').slice(0, 12);
    const ref = `HE${compact}${Date.now().toString(36)}`;
    return ref.slice(0, 38);
  }

  static buildDiningMerchantReference(reservationId: string): string {
    const compact = reservationId.replace(/-/g, '').slice(0, 10);
    const ref = `DR${compact}${Date.now().toString(36)}`;
    return ref.slice(0, 38);
  }

  static createRequestToken(input: {
    amount: string;
    merchantReference: string;
    notificationURL?: string;
  }): string {
    if (!adumoConfig.jwtSecret) {
      throw new Error('ADUMO_JWT_SECRET is not configured');
    }

    const now = Math.floor(Date.now() / 1000);
    const payload: Record<string, string | number> = {
      iss: 'Hotel Etuna',
      cuid: adumoConfig.merchantUid,
      auid: adumoConfig.applicationUid,
      amount: Number.parseFloat(input.amount).toFixed(2),
      mref: input.merchantReference,
      jti: randomBytes(32).toString('base64'),
      iat: now - 60,
      exp: now + 600,
    };

    if (input.notificationURL) {
      payload.notificationURL = input.notificationURL;
    }

    return jwt.sign(payload, adumoConfig.jwtSecret, { algorithm: 'HS256' });
  }

  static buildFormPayload(input: AdumoVirtualInitiateInput): AdumoVirtualFormPayload {
    const amount = input.amount.toFixed(2);
    const token = this.createRequestToken({
      amount,
      merchantReference: input.merchantReference,
      notificationURL: adumoConfig.webhookNotificationUrl,
    });

    const fields: Record<string, string> = {
      MerchantID: adumoConfig.merchantUid,
      ApplicationID: adumoConfig.applicationUid,
      MerchantReference: input.merchantReference,
      Amount: amount,
      Token: token,
      txtCurrencyCode: adumoConfig.currencyCode,
      RedirectSuccessfulURL: input.redirectSuccessUrl || adumoConfig.redirectSuccessUrl,
      RedirectFailedURL: input.redirectFailedUrl || adumoConfig.redirectFailedUrl,
    };

    if (input.recipientName) fields.Recipient = input.recipientName;
    if (input.orderDescription) fields.OrderDescription = input.orderDescription;
    if (input.variable1) fields.Variable1 = input.variable1;

    return {
      actionUrl: adumoConfig.virtualInitialiseUrl,
      fields,
    };
  }

  static verifyResponseToken(token: string): AdumoVirtualDecodedToken | null {
    if (!adumoConfig.jwtSecret) return null;
    try {
      const raw = jwt.verify(token, adumoConfig.jwtSecret, {
        algorithms: ['HS256'],
      }) as jwt.JwtPayload & {
        result?: number;
        mref?: string;
        amount?: string;
        cuid?: string;
        auid?: string;
        transactionIndex?: string;
        puid?: string;
      };

      if (raw.cuid && raw.cuid !== adumoConfig.merchantUid) return null;
      if (raw.auid && raw.auid !== adumoConfig.applicationUid) return null;

      return {
        result: typeof raw.result === 'number' ? raw.result : Number(raw.result),
        mref: String(raw.mref ?? ''),
        amount: String(raw.amount ?? ''),
        cuid: String(raw.cuid ?? ''),
        auid: String(raw.auid ?? ''),
        transactionIndex: raw.transactionIndex
          ? String(raw.transactionIndex)
          : undefined,
        puid: raw.puid ? String(raw.puid) : undefined,
        raw,
      };
    } catch {
      return null;
    }
  }

  /** JWT / redirect result: 0 = success, 1 = success with warning, -1 = failed */
  static isPaymentSuccess(result: number): boolean {
    return result === 0 || result === 1;
  }

  /** Redirect query uses _RESULT: 0 success, -1 failed */
  static isRedirectSuccess(resultParam: string | null): boolean {
    return resultParam === '0' || resultParam === '1';
  }

  /** Optional HMAC check if Adumo sends signed webhook bodies */
  static verifyWebhookHmac(body: string, signature: string | null): boolean {
    const secret = process.env.ADUMO_WEBHOOK_HMAC_SECRET;
    if (!secret || !signature) return true;
    const expected = createHmac('sha256', secret).update(body).digest('hex');
    return expected === signature || expected === signature.toLowerCase();
  }
}
