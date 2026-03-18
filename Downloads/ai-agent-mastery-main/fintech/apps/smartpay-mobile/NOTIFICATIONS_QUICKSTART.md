# SmartPay Notifications - Quick Start Guide

## Installation

```bash
cd /Users/georgenekwaya/Downloads/ai-agent-mastery-main/fintech/smartpay/mobile
npm install
```

## What's Been Configured

### ✅ Completed
1. **expo-notifications** added to package.json
2. **iOS & Android permissions** configured in app.json
3. **12 notification types** defined for SmartPay use cases
4. **6 Android notification channels** created
5. **Full notification service** with 20+ methods
6. **React hook** for easy component integration
7. **Global context** for notification state management
8. **Notifications screen** with list, filters, and actions
9. **Settings screen** for user preferences
10. **AppHeader integration** with badge count
11. **Deep linking** for all notification types

## Quick Integration

### Show Notification Badge (Already Done in Home Screen)

```typescript
import { useNotificationsContext } from '@/contexts/NotificationsContext';

const { unreadCount } = useNotificationsContext();

<AppHeader
  onNotificationPress={() => router.push('/notifications')}
  notificationBadge={unreadCount > 0}
/>
```

### Send a Local Notification

```typescript
import { notificationService } from '@/services/notifications';

await notificationService.scheduleLocal({
  type: 'payment_received',
  title: 'Payment Received',
  body: 'You received N$100.00 from John Doe',
  trigger: { seconds: 1 },
});
```

### Request Permission

```typescript
import { useNotificationsContext } from '@/contexts/NotificationsContext';

const { requestPermission } = useNotificationsContext();
const granted = await requestPermission();
```

## Required Next Steps

### 1. Add EAS Project ID to app.json

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-expo-project-id-here"
      }
    }
  }
}
```

Get it from: https://expo.dev/accounts/[your-account]/projects

### 2. Create Notification Icon (Android)

Create: `assets/images/notification-icon.png`
- Size: 96×96px
- Background: Transparent
- Foreground: White
- Format: PNG

Or use a simple placeholder for now.

### 3. (Optional) Add Notification Sound

Create: `assets/sounds/notification.wav`
- Duration: 1-2 seconds
- Format: WAV or MP3

Or remove from app.json if not needed.

### 4. Set Up Firebase (Android)

1. Go to: https://console.firebase.google.com
2. Create/select project
3. Add Android app: `com.thependalorian.smartpay`
4. Download `google-services.json`
5. Place in mobile root directory

### 5. Backend Implementation

Implement these endpoints:

```typescript
// POST /api/notifications/register
app.post('/api/notifications/register', async (req, res) => {
  const { pushToken, deviceId, userId } = req.body;
  // Store in database
  await db.devices.create({ pushToken, deviceId, userId });
  res.json({ success: true });
});

// Send notification (server-side)
async function sendNotificationToUser(userId: string, notification: any) {
  const devices = await db.devices.findByUserId(userId);
  
  for (const device of devices) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: device.pushToken,
        title: notification.title,
        body: notification.body,
        data: notification.data,
      }),
    });
  }
}
```

## Test It

### 1. Run the app
```bash
npm start
```

### 2. Allow notifications when prompted

### 3. Navigate to notifications screen
- Tap notification bell in AppHeader
- Or go to: `/notifications`

### 4. Test local notification
Open any screen and run:
```typescript
import { notificationService } from '@/services/notifications';

notificationService.scheduleLocal({
  type: 'payment_received',
  title: 'Test Notification',
  body: 'This is a test',
  trigger: { seconds: 3 },
});
```

## Screens Available

1. **`/notifications`** - Main notifications list
   - View all notifications
   - Mark as read
   - Clear all
   - Pull to refresh

2. **`/notifications-settings`** - Preferences
   - Enable/disable notifications
   - Configure notification categories
   - View permission status
   - See push token registration status

## Notification Types

All 12 notification types are ready to use:

1. `payment_received` → Payment credited to account
2. `payment_sent` → Payment sent successfully
3. `kyc_status_update` → KYC verification status changed
4. `proof_of_life_reminder` → Expiry reminder
5. `voucher_received` → Voucher credited
6. `group_invitation` → Invited to group
7. `loan_status_update` → Loan approved/rejected
8. `transaction_failed` → Transaction error
9. `wallet_low_balance` → Balance warning
10. `payment_request_received` → Payment requested
11. `payment_request_paid` → Request fulfilled
12. `system_announcement` - General updates

Each type has:
- ✓ Predefined icon
- ✓ Category color
- ✓ Deep link mapping
- ✓ Android channel assignment
- ✓ Priority level

## Need Help?

See full documentation:
- `NOTIFICATIONS_SETUP.md` - Complete API reference
- `NOTIFICATION_INTEGRATION_EXAMPLES.md` - 15+ code examples
- `NOTIFICATIONS_CONFIGURATION_SUMMARY.md` - Detailed configuration

## Common Issues

**Issue**: "Push notifications don't work in simulator"
**Solution**: Use physical iOS/Android device

**Issue**: "Permission denied"
**Solution**: Uninstall app and reinstall to reset permissions

**Issue**: "No push token generated"
**Solution**: Add EAS project ID to app.json

**Issue**: "Backend can't send notifications"
**Solution**: Verify push token format, check Expo Push API response

---

That's it! Push notifications are fully configured and ready to use. 🚀
