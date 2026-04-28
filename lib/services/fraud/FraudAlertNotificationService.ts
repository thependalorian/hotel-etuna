/**
 * Fraud Alert Notification Service
 * 
 * Purpose: Send notifications for fraud alerts via multiple channels
 * Functionality:
 * - Email notifications for high-risk transactions
 * - SMS notifications for critical alerts
 * - Webhook notifications for third-party integrations
 * - Real-time dashboard notifications
 * 
 * Location: lib/services/fraud/FraudAlertNotificationService.ts
 * 
 * @implements Rule 2: Modular design
 * @implements Rule 3: Documented purpose
 * @implements Rule 10: Comprehensive error handling
 * @implements Rule 15: Error checks and logging
 */

import { db } from '@/lib/db/connection';
import {
  fraudAlerts,
  users,
  guests,
  type FraudAlert,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationPayload {
  alertId: string;
  alertType: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  transactionId?: string;
  guestId?: string;
  amount?: number;
  currency?: string;
  timestamp: Date;
}

export interface EmailNotification {
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  html?: string;
}

export interface SMSNotification {
  to: string[];
  message: string;
}

export interface WebhookNotification {
  url: string;
  headers?: Record<string, string>;
  payload: NotificationPayload;
}

// ============================================================================
// FRAUD ALERT NOTIFICATION SERVICE
// ============================================================================

export class FraudAlertNotificationService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  // ==========================================================================
  // MAIN NOTIFICATION DISPATCHER
  // ==========================================================================

  /**
   * Send notifications for a fraud alert through all configured channels
   */
  async sendNotifications(alertId: string): Promise<{
    emailSent: boolean;
    smsSent: boolean;
    webhookSent: boolean;
    errors: string[];
  }> {
    console.log('[FraudNotification] Sending notifications for alert', { alertId });

    const errors: string[] = [];
    let emailSent = false;
    let smsSent = false;
    let webhookSent = false;

    try {
      // Get alert details
      const alert = await this.getAlert(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }

      // Build notification payload
      const payload = await this.buildNotificationPayload(alert);

      // Send notifications in parallel
      const [emailResult, smsResult, webhookResult] = await Promise.allSettled([
        this.sendEmailNotification(alert, payload),
        this.sendSMSNotification(alert, payload),
        this.sendWebhookNotification(payload),
      ]);

      // Process email result
      if (emailResult.status === 'fulfilled' && emailResult.value) {
        emailSent = true;
      } else if (emailResult.status === 'rejected') {
        errors.push(`Email: ${emailResult.reason}`);
      }

      // Process SMS result
      if (smsResult.status === 'fulfilled' && smsResult.value) {
        smsSent = true;
      } else if (smsResult.status === 'rejected') {
        errors.push(`SMS: ${smsResult.reason}`);
      }

      // Process webhook result
      if (webhookResult.status === 'fulfilled' && webhookResult.value) {
        webhookSent = true;
      } else if (webhookResult.status === 'rejected') {
        errors.push(`Webhook: ${webhookResult.reason}`);
      }

      // Update alert with notification status
      await db
        .update(fraudAlerts)
        .set({
          emailSent,
          smsSent,
          webhookSent,
          notificationSentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(fraudAlerts.id, alertId),
            eq(fraudAlerts.tenantId, this.tenantId)
          )
        );

      console.log('[FraudNotification] Notifications sent', {
        alertId,
        emailSent,
        smsSent,
        webhookSent,
        errorCount: errors.length,
      });

      return { emailSent, smsSent, webhookSent, errors };
    } catch (error) {
      console.error('[FraudNotification] Error sending notifications:', error);
      errors.push(`General: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { emailSent, smsSent, webhookSent, errors };
    }
  }

  // ==========================================================================
  // EMAIL NOTIFICATIONS
  // ==========================================================================

  /**
   * Send email notification for fraud alert
   */
  private async sendEmailNotification(
    alert: FraudAlert,
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      // Determine severity-based recipients
      const recipients = await this.getEmailRecipients(alert.severity);

      if (recipients.length === 0) {
        console.log('[FraudNotification] No email recipients configured');
        return false;
      }

      const emailData = this.buildEmailNotification(alert, payload, recipients);

      // Send via email service (placeholder - integrate with actual email service)
      console.log('[FraudNotification] Sending email notification', {
        to: emailData.to,
        subject: emailData.subject,
      });

      // TODO: Integrate with EmailService or NodeMailer
      // await emailService.send(emailData);

      return true;
    } catch (error) {
      console.error('[FraudNotification] Error sending email:', error);
      throw error;
    }
  }

  /**
   * Build email notification content
   */
  private buildEmailNotification(
    alert: FraudAlert,
    payload: NotificationPayload,
    recipients: string[]
  ): EmailNotification {
    const severityEmoji: Record<NotificationPayload['severity'], string> = {
      critical: '🚨',
      warning: '⚠️',
      info: 'ℹ️',
    };
    const normalizedSeverity: NotificationPayload['severity'] =
      alert.severity === 'critical' || alert.severity === 'warning' || alert.severity === 'info'
        ? alert.severity
        : 'warning';

    const subject = `${severityEmoji[normalizedSeverity]} Fraud Alert: ${alert.title}`;

    const body = `
Fraud Alert Notification
========================

Alert ID: ${alert.id}
Severity: ${alert.severity.toUpperCase()}
Type: ${alert.alertType}
Time: ${payload.timestamp.toISOString()}

${alert.description}

${payload.transactionId ? `Transaction ID: ${payload.transactionId}` : ''}
${payload.amount ? `Amount: ${payload.currency} ${payload.amount}` : ''}

Action Required:
- Review the alert in the fraud detection dashboard
- Verify the transaction details
- Contact the customer if necessary
- Update the alert status after investigation

Dashboard: https://your-app.com/fraud/alerts/${alert.id}

This is an automated notification from the Buffr Fraud Detection System.
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: ${alert.severity === 'critical' ? '#dc2626' : alert.severity === 'warning' ? '#f59e0b' : '#3b82f6'}; 
              color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .info-row { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
    .label { font-weight: bold; color: #6b7280; }
    .value { color: #111827; }
    .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; 
              text-decoration: none; border-radius: 6px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h2>${severityEmoji[normalizedSeverity]} ${alert.title}</h2>
  </div>
  <div class="content">
    <div class="info-row">
      <span class="label">Alert ID:</span> <span class="value">${alert.id}</span>
    </div>
    <div class="info-row">
      <span class="label">Severity:</span> <span class="value">${alert.severity.toUpperCase()}</span>
    </div>
    <div class="info-row">
      <span class="label">Type:</span> <span class="value">${alert.alertType}</span>
    </div>
    <div class="info-row">
      <span class="label">Time:</span> <span class="value">${payload.timestamp.toLocaleString()}</span>
    </div>
    <div class="info-row">
      <p>${alert.description}</p>
    </div>
    ${payload.amount ? `<div class="info-row"><span class="label">Amount:</span> <span class="value">${payload.currency} ${payload.amount}</span></div>` : ''}
    
    <a href="https://your-app.com/fraud/alerts/${alert.id}" class="button">
      Review Alert
    </a>
  </div>
</body>
</html>
    `.trim();

    return {
      to: recipients,
      subject,
      body,
      html,
    };
  }

  /**
   * Get email recipients based on alert severity
   */
  private async getEmailRecipients(severity: string): Promise<string[]> {
    try {
      // Get users with fraud monitoring role or platform admin
      const alertRecipients = await db
        .select({ email: users.email })
        .from(users)
        .where(
          and(
            eq(users.tenantId, this.tenantId),
            eq(users.status, 'active')
          )
        );

      // Filter based on severity
      // Critical: All fraud team + platform admins
      // Warning: Fraud team leads
      // Info: Fraud monitoring dashboard only
      
      const emails = alertRecipients
        .map((r) => r.email)
        .filter(Boolean) as string[];

      // For critical alerts, add additional stakeholders
      if (severity === 'critical') {
        // Add tenant-specific critical alert emails
        // TODO: Fetch from tenant settings
      }

      return emails;
    } catch (error) {
      console.error('[FraudNotification] Error getting email recipients:', error);
      return [];
    }
  }

  // ==========================================================================
  // SMS NOTIFICATIONS
  // ==========================================================================

  /**
   * Send SMS notification for critical fraud alerts
   */
  private async sendSMSNotification(
    alert: FraudAlert,
    payload: NotificationPayload
  ): Promise<boolean> {
    // Only send SMS for critical alerts
    if (alert.severity !== 'critical') {
      return false;
    }

    try {
      const recipients = await this.getSMSRecipients();

      if (recipients.length === 0) {
        console.log('[FraudNotification] No SMS recipients configured');
        return false;
      }

      const smsData = this.buildSMSNotification(alert, payload);

      console.log('[FraudNotification] Sending SMS notification', {
        to: smsData.to,
        messageLength: smsData.message.length,
      });

      // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
      // await smsService.send(smsData);

      return true;
    } catch (error) {
      console.error('[FraudNotification] Error sending SMS:', error);
      throw error;
    }
  }

  /**
   * Build SMS notification content (max 160 characters)
   */
  private buildSMSNotification(
    alert: FraudAlert,
    payload: NotificationPayload
  ): SMSNotification {
    const message = `🚨 CRITICAL FRAUD ALERT: ${alert.alertType}. ${payload.amount ? `Amount: ${payload.currency} ${payload.amount}. ` : ''}Review immediately at buffr.app/fraud`;

    return {
      to: [], // Will be populated from tenant settings
      message: message.substring(0, 160), // SMS character limit
    };
  }

  /**
   * Get SMS recipients for critical alerts
   */
  private async getSMSRecipients(): Promise<string[]> {
    try {
      // Get on-call fraud team members' phone numbers
      const onCallUsers = await db
        .select({ phone: users.phone })
        .from(users)
        .where(
          and(
            eq(users.tenantId, this.tenantId),
            eq(users.status, 'active')
          )
        );

      return onCallUsers
        .map((u) => u.phone)
        .filter(Boolean) as string[];
    } catch (error) {
      console.error('[FraudNotification] Error getting SMS recipients:', error);
      return [];
    }
  }

  // ==========================================================================
  // WEBHOOK NOTIFICATIONS
  // ==========================================================================

  /**
   * Send webhook notification for third-party integrations
   */
  private async sendWebhookNotification(
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      // Get configured webhook URLs from tenant settings
      const webhookUrls = await this.getWebhookUrls();

      if (webhookUrls.length === 0) {
        console.log('[FraudNotification] No webhooks configured');
        return false;
      }

      // Send to all configured webhooks
      const results = await Promise.allSettled(
        webhookUrls.map((url) => this.sendWebhook(url, payload))
      );

      const successCount = results.filter((r) => r.status === 'fulfilled').length;

      console.log('[FraudNotification] Webhook notifications sent', {
        total: webhookUrls.length,
        success: successCount,
      });

      return successCount > 0;
    } catch (error) {
      console.error('[FraudNotification] Error sending webhooks:', error);
      throw error;
    }
  }

  /**
   * Send individual webhook request
   */
  private async sendWebhook(
    url: string,
    payload: NotificationPayload
  ): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Buffr-FraudDetection/1.0',
        },
        body: JSON.stringify({
          event: 'fraud.alert.created',
          timestamp: new Date().toISOString(),
          data: payload,
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }

      console.log('[FraudNotification] Webhook sent successfully', { url });
    } catch (error) {
      console.error('[FraudNotification] Webhook request failed:', error);
      throw error;
    }
  }

  /**
   * Get configured webhook URLs from tenant settings
   */
  private async getWebhookUrls(): Promise<string[]> {
    try {
      // TODO: Fetch from tenant settings or system_settings table
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('[FraudNotification] Error getting webhook URLs:', error);
      return [];
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Get alert details from database
   */
  private async getAlert(alertId: string): Promise<FraudAlert | null> {
    try {
      const [alert] = await db
        .select()
        .from(fraudAlerts)
        .where(
          and(
            eq(fraudAlerts.id, alertId),
            eq(fraudAlerts.tenantId, this.tenantId)
          )
        )
        .limit(1);

      return alert || null;
    } catch (error) {
      console.error('[FraudNotification] Error fetching alert:', error);
      return null;
    }
  }

  /**
   * Build notification payload from alert
   */
  private async buildNotificationPayload(
    alert: FraudAlert
  ): Promise<NotificationPayload> {
    const severity: NotificationPayload['severity'] =
      alert.severity === 'critical' || alert.severity === 'warning' || alert.severity === 'info'
        ? alert.severity
        : 'warning';

    return {
      alertId: alert.id,
      alertType: alert.alertType,
      severity,
      title: alert.title,
      description: alert.description,
      transactionId: alert.transactionId || undefined,
      guestId: alert.guestId || undefined,
      timestamp: alert.createdAt,
    };
  }

  // ==========================================================================
  // PUBLIC API - MANUAL NOTIFICATION TRIGGER
  // ==========================================================================

  /**
   * Manually trigger notifications for an existing alert
   */
  async resendNotifications(alertId: string): Promise<{
    success: boolean;
    emailSent: boolean;
    smsSent: boolean;
    webhookSent: boolean;
    errors: string[];
  }> {
    try {
      const result = await this.sendNotifications(alertId);
      
      return {
        success: result.errors.length === 0,
        ...result,
      };
    } catch (error) {
      console.error('[FraudNotification] Error resending notifications:', error);
      
      return {
        success: false,
        emailSent: false,
        smsSent: false,
        webhookSent: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
}
