/**
 * SMS Notification Service
 *
 * Purpose: Send SMS notifications via configurable provider
 * Location: lib/services/notifications/SmsService.ts
 *
 * Supported providers:
 * - Generic HTTP provider (SMS_PROVIDER_URL, SMS_PROVIDER_KEY)
 * - Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM)
 */

import { securityLogger } from '@/lib/utils/security-logger';

export interface SmsMessage {
  to: string;
  message: string;
  from?: string;
}

export interface SmsResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
}

export class SmsService {
  private static instance: SmsService | null = null;

  static getInstance(): SmsService {
    if (!SmsService.instance) {
      SmsService.instance = new SmsService();
    }
    return SmsService.instance;
  }

  async send(message: SmsMessage): Promise<SmsResult> {
    const provider = this.detectProvider();

    switch (provider) {
      case 'twilio':
        return this.sendViaTwilio(message);
      case 'generic':
        return this.sendViaGenericHttp(message);
      default:
        return {
          success: false,
          provider: 'none',
          error: 'No SMS provider configured',
        };
    }
  }

  private detectProvider(): 'twilio' | 'generic' | 'none' {
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const genericUrl = process.env.SMS_PROVIDER_URL;

    if (twilioSid && process.env.TWILIO_AUTH_TOKEN) {
      return 'twilio';
    }
    if (genericUrl && process.env.SMS_PROVIDER_KEY) {
      return 'generic';
    }
    return 'none';
  }

  private async sendViaTwilio(message: SmsMessage): Promise<SmsResult> {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID!;
      const authToken = process.env.TWILIO_AUTH_TOKEN!;
      const from = message.from || process.env.TWILIO_FROM || '';

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const form = new URLSearchParams({
        To: message.to,
        From: from,
        Body: message.message,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      });

      if (!response.ok) {
        const text = await response.text();
        return {
          success: false,
          provider: 'twilio',
          error: `Twilio error (${response.status}): ${text}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        provider: 'twilio',
        messageId: data.sid,
      };
    } catch (error) {
      securityLogger.error('[SmsService] Twilio send error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        provider: 'twilio',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async sendViaGenericHttp(message: SmsMessage): Promise<SmsResult> {
    try {
      const providerUrl = process.env.SMS_PROVIDER_URL!;
      const providerKey = process.env.SMS_PROVIDER_KEY!;

      const response = await fetch(providerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${providerKey}`,
        },
        body: JSON.stringify({
          to: message.to,
          message: message.message,
          from: message.from,
          channel: 'sms',
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        return {
          success: false,
          provider: 'generic',
          error: `SMS provider error (${response.status}): ${text}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        provider: 'generic',
        messageId: data.messageId || data.id,
      };
    } catch (error) {
      securityLogger.error('[SmsService] Generic HTTP send error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        provider: 'generic',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
