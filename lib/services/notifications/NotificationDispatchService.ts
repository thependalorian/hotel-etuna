/**
 * @fileoverview NotificationDispatchService — domain service module.
 * NotificationDispatchService — route notifications via user preferences + history log.
 *
 * Purpose: Central dispatch for email/SMS with notification_preferences gating (Novu pattern).
 * Location: lib/services/notifications/NotificationDispatchService.ts
 */

import { db } from '@/lib/db';
import { notificationHistory, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EmailService } from '@/lib/services/sofia/EmailService';
import { SmsService } from '@/lib/services/notifications/SmsService';
import { securityLogger } from '@/lib/utils/security-logger';

export type NotificationChannel = 'email' | 'sms' | 'push';

export interface DispatchNotificationInput {
  tenantId: string;
  userId: string;
  notificationType: string;
  subject: string;
  content: string;
  htmlContent?: string;
  channels?: NotificationChannel[];
  metadata?: Record<string, unknown>;
}

/** Guest-facing transactional email (guest may not have a staff user account). */
export interface DispatchGuestTransactionalInput {
  tenantId: string;
  guestId: string;
  guestEmail: string;
  notificationType: string;
  subject: string;
  content: string;
  htmlContent?: string;
  metadata?: Record<string, unknown>;
}

export interface DispatchNotificationResult {
  channelsAttempted: NotificationChannel[];
  channelsSent: NotificationChannel[];
  historyIds: string[];
  skipped: NotificationChannel[];
  errors: string[];
}

type NotificationPreferences = Record<string, unknown>;

function preferenceEnabled(
  prefs: NotificationPreferences,
  notificationType: string,
  channel: NotificationChannel,
): boolean {
  const globalKey = `${channel}_${notificationType}`;
  const channelKey = `notify_${channel}`;
  const global = prefs[globalKey];
  const channelDefault = prefs[channelKey];

  if (global === false || global === 'false' || global === 0 || global === '0') {
    return false;
  }
  if (global === true || global === 'true' || global === 1 || global === '1') {
    return true;
  }
  if (channelDefault === false || channelDefault === 'false') {
    return false;
  }
  // Default: email on, sms/push off unless explicitly enabled
  if (channel === 'email') {
    return true;
  }
  return channelDefault === true || channelDefault === 'true' || channelDefault === 1;
}

export class NotificationDispatchService {
  private emailService = new EmailService();
  private smsService = new SmsService();

  /**
   * Dispatch a notification respecting user notification_preferences and log to notification_history.
   */
  async dispatch(input: DispatchNotificationInput): Promise<DispatchNotificationResult> {
    const channels = input.channels ?? ['email'];
    const result: DispatchNotificationResult = {
      channelsAttempted: [],
      channelsSent: [],
      historyIds: [],
      skipped: [],
      errors: [],
    };

    const [user] = await db
      .select({
        email: users.email,
        phone: users.phone,
        notificationPreferences: users.notificationPreferences,
      })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);

    if (!user) {
      throw new Error(`User not found: ${input.userId}`);
    }

    const prefs = (user.notificationPreferences ?? {}) as NotificationPreferences;

    for (const channel of channels) {
      if (!preferenceEnabled(prefs, input.notificationType, channel)) {
        result.skipped.push(channel);
        continue;
      }

      result.channelsAttempted.push(channel);

      const recipient =
        channel === 'email'
          ? user.email
          : channel === 'sms'
            ? user.phone ?? ''
            : input.userId;

      if (!recipient) {
        result.errors.push(`${channel}: missing recipient`);
        await this.logHistory({
          tenantId: input.tenantId,
          userId: input.userId,
          notificationType: input.notificationType,
          channel,
          recipient: 'missing',
          subject: input.subject,
          content: input.content,
          metadata: input.metadata,
          status: 'failed',
          errorMessage: 'Missing recipient',
        });
        continue;
      }

      try {
        if (channel === 'email') {
          await this.emailService.sendEmail(input.tenantId, {
            to: recipient,
            subject: input.subject,
            htmlContent: input.htmlContent ?? `<p>${input.content}</p>`,
            textContent: input.content,
            metadata: input.metadata,
          });
        } else if (channel === 'sms') {
          const smsResult = await this.smsService.send({
            to: recipient,
            message: input.content,
          });
          if (!smsResult.success) {
            throw new Error(smsResult.error ?? 'SMS send failed');
          }
        } else {
          result.skipped.push(channel);
          continue;
        }

        const historyId = await this.logHistory({
          tenantId: input.tenantId,
          userId: input.userId,
          notificationType: input.notificationType,
          channel,
          recipient,
          subject: input.subject,
          content: input.content,
          metadata: input.metadata,
          status: 'sent',
          sentAt: new Date(),
        });

        result.channelsSent.push(channel);
        result.historyIds.push(historyId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        result.errors.push(`${channel}: ${message}`);
        securityLogger.error('[NotificationDispatch] channel failed', {
          channel,
          userId: input.userId,
          notificationType: input.notificationType,
          error: message,
        });

        await this.logHistory({
          tenantId: input.tenantId,
          userId: input.userId,
          notificationType: input.notificationType,
          channel,
          recipient,
          subject: input.subject,
          content: input.content,
          metadata: input.metadata,
          status: 'failed',
          failedAt: new Date(),
          errorMessage: message,
        });
      }
    }

    return result;
  }

  /**
   * Send a transactional email to a guest (booking reminders, receipts).
   * Skips user preference gates — operational emails always deliver when SMTP is configured.
   * Logs to `notification_history` with `userId` = guestId (varchar, no FK).
   */
  async dispatchGuestTransactional(
    input: DispatchGuestTransactionalInput,
  ): Promise<DispatchNotificationResult> {
    const result: DispatchNotificationResult = {
      channelsAttempted: ['email'],
      channelsSent: [],
      historyIds: [],
      skipped: [],
      errors: [],
    };

    if (!input.guestEmail?.trim()) {
      result.errors.push('email: missing recipient');
      return result;
    }

    try {
      await this.emailService.sendEmail(input.tenantId, {
        to: input.guestEmail,
        subject: input.subject,
        htmlContent: input.htmlContent ?? `<p>${input.content}</p>`,
        textContent: input.content,
        metadata: {
          ...input.metadata,
          guestId: input.guestId,
          notificationType: input.notificationType,
        },
      });

      const historyId = await this.logHistory({
        tenantId: input.tenantId,
        userId: input.guestId,
        notificationType: input.notificationType,
        channel: 'email',
        recipient: input.guestEmail,
        subject: input.subject,
        content: input.content,
        metadata: input.metadata,
        status: 'sent',
        sentAt: new Date(),
      });

      result.channelsSent.push('email');
      result.historyIds.push(historyId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(`email: ${message}`);
      securityLogger.error('[NotificationDispatch] guest transactional failed', {
        guestId: input.guestId,
        notificationType: input.notificationType,
        error: message,
      });

      await this.logHistory({
        tenantId: input.tenantId,
        userId: input.guestId,
        notificationType: input.notificationType,
        channel: 'email',
        recipient: input.guestEmail,
        subject: input.subject,
        content: input.content,
        metadata: input.metadata,
        status: 'failed',
        failedAt: new Date(),
        errorMessage: message,
      });
    }

    return result;
  }

  private async logHistory(row: {
    tenantId: string;
    userId: string;
    notificationType: string;
    channel: string;
    recipient: string;
    subject?: string;
    content?: string;
    metadata?: Record<string, unknown>;
    status: string;
    sentAt?: Date;
    failedAt?: Date;
    errorMessage?: string;
  }): Promise<string> {
    const [inserted] = await db
      .insert(notificationHistory)
      .values({
        tenantId: row.tenantId,
        userId: row.userId,
        notificationType: row.notificationType,
        channel: row.channel,
        recipient: row.recipient,
        subject: row.subject,
        content: row.content,
        metadata: row.metadata ?? {},
        status: row.status,
        sentAt: row.sentAt,
        failedAt: row.failedAt,
        errorMessage: row.errorMessage,
        updatedAt: new Date(),
      })
      .returning({ id: notificationHistory.id });

    return inserted.id;
  }
}

export const notificationDispatchService = new NotificationDispatchService();
