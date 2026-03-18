# Backend Notification Implementation Guide

## Overview

This guide shows how to implement the backend notification system for SmartPay to send push notifications to mobile devices.

---

## Prerequisites

- Node.js backend (Express, Fastify, or similar)
- Database to store device registrations
- Expo SDK for sending push notifications

---

## 1. Install Dependencies

```bash
npm install expo-server-sdk
```

---

## 2. Database Schema

### Device Registration Table

```sql
CREATE TABLE device_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL UNIQUE,
  push_token TEXT NOT NULL,
  platform VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android')),
  device_name VARCHAR(255),
  model_name VARCHAR(255),
  os_version VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

CREATE INDEX idx_device_registrations_user_id ON device_registrations(user_id);
CREATE INDEX idx_device_registrations_push_token ON device_registrations(push_token);
```

### Notification History Table (Optional)

```sql
CREATE TABLE notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP DEFAULT NOW(),
  delivered BOOLEAN DEFAULT false,
  opened BOOLEAN DEFAULT false,
  error TEXT
);

CREATE INDEX idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX idx_notification_history_sent_at ON notification_history(sent_at DESC);
```

---

## 3. Backend API Endpoints

### Device Registration Endpoint

```typescript
import { Router } from 'express';
import { Expo } from 'expo-server-sdk';

const router = Router();

// POST /api/notifications/register
router.post('/register', async (req, res) => {
  try {
    const {
      pushToken,
      deviceId,
      userId,
      platform,
      deviceName,
      modelName,
      osVersion,
    } = req.body;

    // Validate push token
    if (!Expo.isExpoPushToken(pushToken)) {
      return res.status(400).json({
        error: 'Invalid push token format',
      });
    }

    // Upsert device registration
    await db.query(`
      INSERT INTO device_registrations (
        user_id, device_id, push_token, platform,
        device_name, model_name, os_version, last_used_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (user_id, device_id)
      DO UPDATE SET
        push_token = EXCLUDED.push_token,
        platform = EXCLUDED.platform,
        device_name = EXCLUDED.device_name,
        model_name = EXCLUDED.model_name,
        os_version = EXCLUDED.os_version,
        last_used_at = NOW(),
        updated_at = NOW()
    `, [userId, deviceId, pushToken, platform, deviceName, modelName, osVersion]);

    res.json({
      success: true,
      message: 'Device registered successfully',
    });
  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({ error: 'Failed to register device' });
  }
});

// POST /api/notifications/unregister
router.post('/unregister', async (req, res) => {
  try {
    const { deviceId, userId } = req.body;

    await db.query(`
      DELETE FROM device_registrations
      WHERE user_id = $1 AND device_id = $2
    `, [userId, deviceId]);

    res.json({
      success: true,
      message: 'Device unregistered successfully',
    });
  } catch (error) {
    console.error('Error unregistering device:', error);
    res.status(500).json({ error: 'Failed to unregister device' });
  }
});

export default router;
```

---

## 4. Push Notification Service

### Complete Service Implementation

```typescript
import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from 'expo-server-sdk';

const expo = new Expo();

export interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: any;
  badge?: number;
  sound?: string;
  channelId?: string;
  priority?: 'default' | 'high';
}

export class NotificationService {
  private expo: Expo;

  constructor() {
    this.expo = new Expo();
  }

  async sendToUser(payload: NotificationPayload): Promise<void> {
    try {
      // Get all device registrations for user
      const devices = await db.query(`
        SELECT push_token, platform, device_id
        FROM device_registrations
        WHERE user_id = $1 AND push_token IS NOT NULL
      `, [payload.userId]);

      if (devices.rows.length === 0) {
        console.log(`No devices registered for user ${payload.userId}`);
        return;
      }

      // Build push messages
      const messages: ExpoPushMessage[] = devices.rows
        .filter(device => Expo.isExpoPushToken(device.push_token))
        .map(device => ({
          to: device.push_token,
          sound: payload.sound || 'notification.wav',
          title: payload.title,
          body: payload.body,
          data: {
            type: payload.type,
            metadata: payload.data || {},
          },
          badge: payload.badge,
          channelId: payload.channelId || this.getChannelId(payload.type),
          priority: payload.priority || 'high',
        }));

      if (messages.length === 0) {
        console.log('No valid push tokens found');
        return;
      }

      // Send notifications in chunks
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
        }
      }

      // Log notification history
      await this.logNotification(payload, tickets);

      // Handle errors
      await this.handleTicketErrors(tickets, devices.rows);
    } catch (error) {
      console.error('Error sending notification to user:', error);
      throw error;
    }
  }

  async sendToMultipleUsers(userIds: string[], payload: Omit<NotificationPayload, 'userId'>): Promise<void> {
    await Promise.all(
      userIds.map(userId => 
        this.sendToUser({ ...payload, userId })
      )
    );
  }

  async sendBroadcast(payload: Omit<NotificationPayload, 'userId'>): Promise<void> {
    try {
      const allDevices = await db.query(`
        SELECT DISTINCT user_id FROM device_registrations
        WHERE push_token IS NOT NULL
      `);

      const userIds = allDevices.rows.map(row => row.user_id);
      await this.sendToMultipleUsers(userIds, payload);
    } catch (error) {
      console.error('Error sending broadcast notification:', error);
      throw error;
    }
  }

  private getChannelId(type: string): string {
    const channelMap: Record<string, string> = {
      payment_received: 'payments',
      payment_sent: 'payments',
      kyc_status_update: 'kyc',
      proof_of_life_reminder: 'reminders',
      voucher_received: 'payments',
      group_invitation: 'social',
      loan_status_update: 'loans',
      transaction_failed: 'payments',
      wallet_low_balance: 'reminders',
      payment_request_received: 'payments',
      payment_request_paid: 'payments',
      system_announcement: 'default',
    };
    return channelMap[type] || 'default';
  }

  private async logNotification(
    payload: NotificationPayload,
    tickets: ExpoPushTicket[]
  ): Promise<void> {
    try {
      const success = tickets.every(ticket => ticket.status === 'ok');
      const error = tickets.find(t => t.status === 'error')?.message;

      await db.query(`
        INSERT INTO notification_history (
          user_id, notification_type, title, body, data, delivered, error
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        payload.userId,
        payload.type,
        payload.title,
        payload.body,
        JSON.stringify(payload.data || {}),
        success,
        error || null,
      ]);
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  private async handleTicketErrors(
    tickets: ExpoPushTicket[],
    devices: any[]
  ): Promise<void> {
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const device = devices[i];

      if (ticket.status === 'error') {
        console.error(`Error sending to device ${device.device_id}:`, ticket.message);

        if (ticket.details?.error === 'DeviceNotRegistered') {
          await db.query(`
            DELETE FROM device_registrations
            WHERE device_id = $1
          `, [device.device_id]);
          console.log(`Removed unregistered device: ${device.device_id}`);
        }
      }
    }
  }

  async checkReceipts(ticketIds: string[]): Promise<void> {
    try {
      const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(ticketIds);

      for (const chunk of receiptIdChunks) {
        const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);

        for (const receiptId in receipts) {
          const receipt = receipts[receiptId];
          
          if (receipt.status === 'error') {
            console.error(`Error in receipt ${receiptId}:`, receipt.message);
            
            if (receipt.details?.error === 'DeviceNotRegistered') {
              console.log('Device not registered, should remove from database');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking receipts:', error);
    }
  }
}

export const notificationService = new NotificationService();
```

---

## 5. Usage Examples

### Send Payment Received Notification

```typescript
import { notificationService } from './services/notificationService';

async function notifyPaymentReceived(
  userId: string,
  amount: number,
  senderName: string,
  transactionId: string
) {
  await notificationService.sendToUser({
    userId,
    type: 'payment_received',
    title: 'Payment Received',
    body: `You received N$${amount.toFixed(2)} from ${senderName}`,
    data: {
      transactionId,
      amount,
      currency: 'NAD',
      senderName,
      deepLink: `/transactions/${transactionId}`,
    },
    badge: 1,
    channelId: 'payments',
  });
}
```

### Send KYC Status Update

```typescript
async function notifyKYCUpdate(
  userId: string,
  status: 'approved' | 'rejected' | 'pending'
) {
  const messages = {
    approved: 'Your identity has been verified!',
    rejected: 'Your KYC verification requires additional review.',
    pending: 'Your documents are being reviewed.',
  };

  await notificationService.sendToUser({
    userId,
    type: 'kyc_status_update',
    title: 'KYC Status Update',
    body: messages[status],
    data: {
      kycStatus: status,
      deepLink: '/kyc',
    },
    channelId: 'kyc',
  });
}
```

### Send Group Invitation

```typescript
async function notifyGroupInvitation(
  userId: string,
  groupName: string,
  inviterName: string,
  groupId: string
) {
  await notificationService.sendToUser({
    userId,
    type: 'group_invitation',
    title: 'Group Invitation',
    body: `${inviterName} invited you to join ${groupName}`,
    data: {
      groupId,
      groupName,
      inviterName,
      deepLink: `/groups/${groupId}`,
    },
    channelId: 'social',
    priority: 'default',
  });
}
```

### Send Proof-of-Life Reminder

```typescript
async function sendProofOfLifeReminders() {
  // Get all users with expiring proof-of-life
  const users = await db.query(`
    SELECT id, first_name, proof_of_life_expiry
    FROM users
    WHERE proof_of_life_expiry IS NOT NULL
      AND proof_of_life_expiry BETWEEN NOW() AND NOW() + INTERVAL '7 days'
  `);

  for (const user of users.rows) {
    const daysRemaining = Math.ceil(
      (new Date(user.proof_of_life_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    await notificationService.sendToUser({
      userId: user.id,
      type: 'proof_of_life_reminder',
      title: 'Proof-of-Life Reminder',
      body: `Your proof-of-life expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}. Please verify to continue.`,
      data: {
        daysRemaining,
        expiryDate: user.proof_of_life_expiry,
        deepLink: '/proof-of-life',
      },
      channelId: 'reminders',
    });
  }
}

// Run as a cron job daily
// schedule.scheduleJob('0 9 * * *', sendProofOfLifeReminders);
```

### Send Loan Payment Reminder

```typescript
async function sendLoanPaymentReminders() {
  const loans = await db.query(`
    SELECT l.id, l.user_id, l.payment_amount, l.due_date, u.first_name
    FROM loans l
    JOIN users u ON u.id = l.user_id
    WHERE l.status = 'active'
      AND l.due_date BETWEEN NOW() + INTERVAL '3 days' AND NOW() + INTERVAL '4 days'
  `);

  for (const loan of loans.rows) {
    await notificationService.sendToUser({
      userId: loan.user_id,
      type: 'loan_status_update',
      title: 'Loan Payment Due',
      body: `Your loan payment of N$${loan.payment_amount.toFixed(2)} is due in 3 days`,
      data: {
        loanId: loan.id,
        amount: loan.payment_amount,
        dueDate: loan.due_date,
        deepLink: `/loans/${loan.id}`,
      },
      channelId: 'loans',
    });
  }
}
```

### Broadcast System Announcement

```typescript
async function sendSystemAnnouncement(title: string, message: string) {
  await notificationService.sendBroadcast({
    type: 'system_announcement',
    title,
    body: message,
    data: {
      deepLink: '/notifications',
    },
    channelId: 'default',
    priority: 'default',
  });
}

// Usage
await sendSystemAnnouncement(
  'System Maintenance',
  'SmartPay will be under maintenance on March 20, 2026 from 2:00 AM to 4:00 AM'
);
```

---

## 6. Webhook Integration (Optional)

### Handle Transaction Events

```typescript
// After successful payment transaction
app.post('/webhooks/payment-success', async (req, res) => {
  const { senderId, recipientId, amount, transactionId } = req.body;

  // Notify sender
  await notificationService.sendToUser({
    userId: senderId,
    type: 'payment_sent',
    title: 'Payment Sent',
    body: `Successfully sent N$${amount.toFixed(2)}`,
    data: { transactionId, deepLink: `/transactions/${transactionId}` },
  });

  // Notify recipient
  await notificationService.sendToUser({
    userId: recipientId,
    type: 'payment_received',
    title: 'Payment Received',
    body: `You received N$${amount.toFixed(2)}`,
    data: { transactionId, deepLink: `/transactions/${transactionId}` },
  });

  res.json({ success: true });
});

// After failed transaction
app.post('/webhooks/payment-failed', async (req, res) => {
  const { userId, amount, recipientName, errorMessage } = req.body;

  await notificationService.sendToUser({
    userId,
    type: 'transaction_failed',
    title: 'Transaction Failed',
    body: `Failed to send N$${amount.toFixed(2)} to ${recipientName}. ${errorMessage}`,
    data: { amount, recipientName, errorMessage },
  });

  res.json({ success: true });
});
```

---

## 7. Scheduled Notifications (Cron Jobs)

### Node-Cron Example

```typescript
import cron from 'node-cron';
import { notificationService } from './services/notificationService';

// Daily at 9:00 AM - Check proof-of-life expirations
cron.schedule('0 9 * * *', async () => {
  console.log('Running proof-of-life reminder job');
  await sendProofOfLifeReminders();
});

// Daily at 10:00 AM - Check loan payment due dates
cron.schedule('0 10 * * *', async () => {
  console.log('Running loan payment reminder job');
  await sendLoanPaymentReminders();
});

// Every hour - Check low wallet balances
cron.schedule('0 * * * *', async () => {
  console.log('Running low balance check');
  await checkLowBalances();
});

async function checkLowBalances() {
  const lowBalanceUsers = await db.query(`
    SELECT w.user_id, w.balance, w.id as wallet_id
    FROM wallets w
    WHERE w.balance < 50
      AND w.user_id NOT IN (
        SELECT user_id FROM notification_history
        WHERE notification_type = 'wallet_low_balance'
          AND sent_at > NOW() - INTERVAL '24 hours'
      )
  `);

  for (const wallet of lowBalanceUsers.rows) {
    await notificationService.sendToUser({
      userId: wallet.user_id,
      type: 'wallet_low_balance',
      title: 'Low Balance',
      body: `Your wallet balance is N$${wallet.balance.toFixed(2)}`,
      data: {
        walletId: wallet.wallet_id,
        balance: wallet.balance,
        deepLink: `/wallets/${wallet.wallet_id}`,
      },
    });
  }
}
```

---

## 8. Error Handling & Retry Logic

```typescript
async function sendNotificationWithRetry(
  payload: NotificationPayload,
  maxRetries: number = 3
): Promise<boolean> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await notificationService.sendToUser(payload);
      return true;
    } catch (error) {
      lastError = error as Error;
      console.error(`Notification send attempt ${attempt + 1} failed:`, error);
      
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error('All notification send attempts failed:', lastError);
  return false;
}
```

---

## 9. Notification Templates

### Create Reusable Templates

```typescript
export const notificationTemplates = {
  paymentReceived: (amount: number, sender: string, txnId: string) => ({
    type: 'payment_received',
    title: 'Payment Received',
    body: `You received N$${amount.toFixed(2)} from ${sender}`,
    data: { transactionId: txnId, deepLink: `/transactions/${txnId}` },
  }),

  kycApproved: () => ({
    type: 'kyc_status_update',
    title: 'KYC Approved',
    body: 'Your identity has been verified! You can now access all features.',
    data: { kycStatus: 'approved', deepLink: '/kyc' },
  }),

  proofOfLifeExpiring: (days: number) => ({
    type: 'proof_of_life_reminder',
    title: 'Proof-of-Life Reminder',
    body: `Your proof-of-life expires in ${days} day${days > 1 ? 's' : ''}. Please verify.`,
    data: { daysRemaining: days, deepLink: '/proof-of-life' },
  }),

  loanApproved: (amount: number, loanId: string) => ({
    type: 'loan_status_update',
    title: 'Loan Approved',
    body: `Your loan of N$${amount.toFixed(2)} has been approved!`,
    data: { loanId, amount, deepLink: `/loans/${loanId}` },
  }),
};

// Usage
await notificationService.sendToUser({
  userId,
  ...notificationTemplates.paymentReceived(100, 'John Doe', 'txn-123'),
});
```

---

## 10. Testing

### Test with Expo Push Tool

```bash
# Install globally
npm install -g expo-cli

# Send test notification
npx expo-cli push:android:send \
  --token "ExponentPushToken[...]" \
  --message "Test notification"
```

### Test with curl

```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "to": "ExponentPushToken[...]",
    "title": "Test",
    "body": "Testing SmartPay notifications",
    "data": {
      "type": "system_announcement",
      "metadata": {}
    },
    "channelId": "default"
  }'
```

### Test with Postman

```
POST https://exp.host/--/api/v2/push/send
Content-Type: application/json

{
  "to": "ExponentPushToken[...]",
  "title": "Payment Received",
  "body": "You received N$100.00",
  "data": {
    "type": "payment_received",
    "metadata": {
      "transactionId": "test-123",
      "amount": 100.00
    }
  },
  "sound": "notification.wav",
  "badge": 1,
  "channelId": "payments"
}
```

---

## 11. Monitoring

### Track Notification Metrics

```typescript
async function getNotificationMetrics(userId: string, days: number = 7) {
  const metrics = await db.query(`
    SELECT
      notification_type,
      COUNT(*) as total_sent,
      SUM(CASE WHEN delivered THEN 1 ELSE 0 END) as delivered,
      SUM(CASE WHEN opened THEN 1 ELSE 0 END) as opened,
      ROUND(AVG(CASE WHEN opened THEN 1 ELSE 0 END) * 100, 2) as open_rate
    FROM notification_history
    WHERE user_id = $1
      AND sent_at > NOW() - INTERVAL '${days} days'
    GROUP BY notification_type
  `, [userId]);

  return metrics.rows;
}
```

### Error Rate Monitoring

```typescript
async function getNotificationErrors(hours: number = 24) {
  const errors = await db.query(`
    SELECT
      notification_type,
      error,
      COUNT(*) as error_count,
      MAX(sent_at) as last_error_at
    FROM notification_history
    WHERE error IS NOT NULL
      AND sent_at > NOW() - INTERVAL '${hours} hours'
    GROUP BY notification_type, error
    ORDER BY error_count DESC
  `);

  return errors.rows;
}
```

---

## 12. Rate Limiting

Protect against notification spam:

```typescript
async function canSendNotification(
  userId: string,
  type: string,
  minIntervalMinutes: number = 5
): Promise<boolean> {
  const recent = await db.query(`
    SELECT id FROM notification_history
    WHERE user_id = $1
      AND notification_type = $2
      AND sent_at > NOW() - INTERVAL '${minIntervalMinutes} minutes'
    LIMIT 1
  `, [userId, type]);

  return recent.rows.length === 0;
}

// Usage
if (await canSendNotification(userId, 'wallet_low_balance', 60)) {
  await notificationService.sendToUser({...});
}
```

---

## 13. Batch Notifications

Send notifications efficiently in batches:

```typescript
async function sendBatchNotifications(
  notifications: Array<{ userId: string; payload: any }>
) {
  const batchSize = 100;
  
  for (let i = 0; i < notifications.length; i += batchSize) {
    const batch = notifications.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(({ userId, payload }) =>
        notificationService.sendToUser({ userId, ...payload })
      )
    );

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

---

## 14. API Documentation

### POST /api/notifications/register

**Request:**
```json
{
  "pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "deviceId": "ios-1234567890-abc123",
  "userId": "user-uuid",
  "platform": "ios",
  "deviceName": "John's iPhone",
  "modelName": "iPhone 14 Pro",
  "osVersion": "17.0"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device registered successfully"
}
```

### POST /api/notifications/unregister

**Request:**
```json
{
  "deviceId": "ios-1234567890-abc123",
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device unregistered successfully"
}
```

### POST /api/notifications/send (Internal API)

**Request:**
```json
{
  "userId": "user-uuid",
  "type": "payment_received",
  "title": "Payment Received",
  "body": "You received N$100.00 from John Doe",
  "data": {
    "transactionId": "txn-123",
    "amount": 100.00,
    "currency": "NAD"
  },
  "badge": 1,
  "channelId": "payments"
}
```

**Response:**
```json
{
  "success": true,
  "tickets": [
    {
      "status": "ok",
      "id": "ticket-id"
    }
  ]
}
```

---

## 15. Security Considerations

### Authentication
```typescript
// Require authentication for device registration
router.post('/register', authenticateUser, async (req, res) => {
  // Verify req.user.id matches req.body.userId
  if (req.user.id !== req.body.userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  // ... proceed with registration
});
```

### Validate Push Tokens
```typescript
if (!Expo.isExpoPushToken(pushToken)) {
  return res.status(400).json({ error: 'Invalid push token' });
}
```

### Rate Limit Registration
```typescript
import rateLimit from 'express-rate-limit';

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 registrations per window
  message: 'Too many registration attempts',
});

router.post('/register', registerLimiter, async (req, res) => {
  // ... registration logic
});
```

---

## 16. Production Checklist

- [ ] Database tables created
- [ ] API endpoints implemented and tested
- [ ] Expo push notification service initialized
- [ ] Device registration working
- [ ] Push token validation implemented
- [ ] Error handling and logging configured
- [ ] Rate limiting applied
- [ ] Webhook integrations set up
- [ ] Cron jobs scheduled (reminders)
- [ ] Notification templates created
- [ ] Monitoring and metrics tracking
- [ ] Receipt checking implemented
- [ ] Security middleware applied
- [ ] Load testing completed
- [ ] Production push credentials configured

---

## 17. Monitoring & Alerting

Set up alerts for:
- High notification error rate (>5%)
- Failed device registrations
- Expo API downtime
- Invalid push tokens
- Notification delivery delays

---

## Resources

- Expo Push Notification Documentation: https://docs.expo.dev/push-notifications/overview/
- Expo Server SDK: https://github.com/expo/expo-server-sdk-node
- Firebase Cloud Messaging: https://firebase.google.com/docs/cloud-messaging
- APNs Documentation: https://developer.apple.com/documentation/usernotifications

---

**Backend implementation complete!** The mobile app is ready to receive and handle push notifications from your server.
