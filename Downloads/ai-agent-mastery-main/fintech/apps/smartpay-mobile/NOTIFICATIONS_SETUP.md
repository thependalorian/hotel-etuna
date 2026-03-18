# SmartPay Push Notifications Setup

## Overview
Push notifications are now fully configured for SmartPay mobile app using `expo-notifications`.

## Installation
The dependency has been added to `package.json`. Run:
```bash
npm install
```

## Configuration

### 1. App.json Updates
- **iOS**: Added APNs entitlements and background modes
- **Android**: Added POST_NOTIFICATIONS permission and notification channels
- **Plugin**: expo-notifications configured with custom icon, color, and sounds

### 2. Notification Channels (Android)
- **default**: General notifications
- **payments**: Payment received/sent notifications (high priority)
- **kyc**: KYC status updates (high priority)
- **reminders**: Proof-of-life and important reminders (high priority)
- **social**: Group invitations and social updates (default priority)
- **loans**: Loan status and payment reminders (high priority)

## Notification Types

```typescript
export type NotificationType = 
  | 'payment_received'
  | 'payment_sent'
  | 'kyc_status_update'
  | 'proof_of_life_reminder'
  | 'voucher_received'
  | 'group_invitation'
  | 'loan_status_update'
  | 'transaction_failed'
  | 'wallet_low_balance'
  | 'payment_request_received'
  | 'payment_request_paid'
  | 'system_announcement';
```

### Deep Link Mapping
- `payment_received/sent/failed` → `/transactions/{id}` or `/transactions`
- `kyc_status_update` → `/kyc`
- `proof_of_life_reminder` → `/proof-of-life`
- `voucher_received` → `/vouchers`
- `group_invitation` → `/groups/{id}` or `/groups`
- `loan_status_update` → `/loans/{id}` or `/loans`
- `payment_request_*` → `/requests`
- `wallet_low_balance` → `/wallets`
- `system_announcement` → `/notifications`

## Usage

### Basic Integration with AppHeader

```typescript
import { useNotificationsContext } from '@/contexts/NotificationsContext';

export default function MyScreen() {
  const { unreadCount } = useNotificationsContext();

  return (
    <AppHeader
      onNotificationPress={() => router.push('/notifications')}
      notificationBadge={unreadCount > 0}
      // ... other props
    />
  );
}
```

### Using the Notification Hook

```typescript
import { useNotifications } from '@/hooks/useNotifications';

export default function MyComponent() {
  const {
    permissionStatus,
    pushToken,
    requestPermission,
    setupNotifications,
  } = useNotifications();

  // Request permission on mount
  useEffect(() => {
    if (!permissionStatus?.granted) {
      requestPermission();
    }
  }, []);

  return <View>...</View>;
}
```

### Using the Notifications Context

```typescript
import { useNotificationsContext } from '@/contexts/NotificationsContext';

export default function MyComponent() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    addNotification,
  } = useNotificationsContext();

  // Mark notification as read
  const handleNotificationTap = async (id: string) => {
    await markAsRead(id);
  };

  // Clear all notifications
  const handleClearAll = async () => {
    await clearAll();
  };

  return <View>...</View>;
}
```

### Scheduling Local Notifications

```typescript
import { notificationService } from '@/services/notifications';

// Schedule a proof-of-life reminder
await notificationService.scheduleProofOfLifeReminder(7); // 7 days until expiry

// Schedule a payment reminder
await notificationService.schedulePaymentReminder(
  100.00,
  'John Doe',
  new Date('2026-03-20T10:00:00')
);

// Schedule a loan payment reminder
await notificationService.scheduleLoanPaymentReminder(
  'loan-123',
  250.00,
  new Date('2026-03-25T00:00:00')
);

// Schedule a custom notification
await notificationService.scheduleLocal({
  type: 'wallet_low_balance',
  title: 'Low Balance Alert',
  body: 'Your wallet balance is below N$50',
  trigger: {
    seconds: 3600, // 1 hour from now
    repeats: false,
  },
});
```

### Registering Device with Backend

```typescript
import { notificationService } from '@/services/notifications';

const token = await notificationService.getPushToken();
if (token) {
  await notificationService.registerDevice(
    token,
    userId,
    'https://api.smartpay.com'
  );
}
```

## Backend Integration

Your backend should send push notifications in this format:

```json
{
  "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "sound": "notification.wav",
  "title": "Payment Received",
  "body": "You received N$100.00 from John Doe",
  "data": {
    "type": "payment_received",
    "metadata": {
      "transactionId": "txn-123",
      "amount": 100.00,
      "currency": "NAD",
      "userId": "user-456",
      "deepLink": "/transactions/txn-123"
    }
  },
  "badge": 1,
  "channelId": "payments"
}
```

### Backend Endpoints Required

1. **POST /api/notifications/register**
   - Register device push token
   - Body: `{ pushToken, deviceId, userId, platform, deviceName, modelName, osVersion }`

2. **POST /api/notifications/unregister**
   - Unregister device
   - Body: `{ deviceId, userId }`

3. **POST /api/notifications/send** (Server-side only)
   - Send push notification to user
   - Body: Push notification payload (see format above)

## Screens Created

1. **`/notifications`**: Main notifications screen
   - Shows all notifications with read/unread status
   - Supports mark as read, mark all read, clear all
   - Pull-to-refresh
   - Deep linking on notification tap
   - Swipe-to-delete

2. **`/notifications-settings`**: Notification preferences
   - Permission status
   - Enable/disable by category
   - Link to system settings

## Components Created

1. **`NotificationBell`**: Standalone notification bell with badge
   - Shows unread count badge
   - Navigates to `/notifications` on tap
   - Use in any screen header

## Files Created/Modified

### Created:
- `types/notifications.ts` - TypeScript types and interfaces
- `services/notifications.ts` - Notification service with all methods
- `hooks/useNotifications.ts` - Notification hook for components
- `contexts/NotificationsContext.tsx` - Global notification state
- `components/notifications/NotificationBell.tsx` - Notification bell component
- `components/notifications/index.ts` - Barrel export
- `app/notifications.tsx` - Notifications list screen
- `app/notifications-settings.tsx` - Settings screen

### Modified:
- `package.json` - Added expo-notifications dependency
- `app.json` - Added notification permissions and plugin
- `contexts/AppProviders.tsx` - Added NotificationsProvider
- `hooks/index.ts` - Exported useNotifications hook

## Example: Integrating with Home Screen

Update your home screen to show notification badge:

```typescript
import { useNotificationsContext } from '@/contexts/NotificationsContext';

export default function HomeScreen() {
  const { unreadCount } = useNotificationsContext();

  return (
    <AppHeader
      showSearch
      searchPlaceholder="Search or ask Copilot..."
      onNotificationPress={() => router.push('/notifications')}
      onAvatarPress={() => router.push('/(tabs)/profile')}
      notificationBadge={unreadCount > 0}
      // ... other props
    />
  );
}
```

## Testing Notifications

### Test Push Notifications with Expo
```bash
# Get your push token from the app
# Then send a test notification:
curl -H "Content-Type: application/json" \
  -X POST https://exp.host/--/api/v2/push/send \
  -d '{
    "to": "ExponentPushToken[your-token-here]",
    "title": "Test Notification",
    "body": "This is a test",
    "data": {
      "type": "payment_received",
      "metadata": {
        "transactionId": "test-123"
      }
    }
  }'
```

### Test Local Notifications
```typescript
import { notificationService } from '@/services/notifications';

// Schedule immediate notification
await notificationService.scheduleLocal({
  type: 'payment_received',
  title: 'Test Payment',
  body: 'You received N$100.00',
  trigger: { seconds: 1 },
});
```

## Permission Handling

The notification system handles all permission states:
- **Granted**: Full functionality enabled
- **Denied**: Shows prompt to enable in settings
- **Can't ask again**: Directs user to system settings
- **Not determined**: Prompts for permission

## Background Handling

Notifications work in three states:
1. **Foreground**: App is open and active
   - Shows in-app notification banner
   - Updates notification list immediately
   - Plays sound and haptics

2. **Background**: App is in background
   - Shows system notification
   - Updates badge count
   - Plays notification sound

3. **Killed**: App is not running
   - Shows system notification
   - Opens app and navigates to deep link when tapped

## Badge Management

Badge count automatically updates based on unread notifications:
- Increments when new notification arrives
- Decrements when notification marked as read
- Clears when all notifications marked as read or cleared

## Next Steps

1. **Run npm install** to install expo-notifications
2. **Configure EAS Project ID** in app.json for push tokens:
   ```json
   "extra": {
     "eas": {
       "projectId": "your-project-id"
     }
   }
   ```
3. **Set up Firebase Cloud Messaging (FCM)** for Android:
   - Download `google-services.json` from Firebase Console
   - Place in root directory
   
4. **Set up Apple Push Notification Service (APNs)** for iOS:
   - Configure in Apple Developer Portal
   - Add APNs key to EAS

5. **Implement backend endpoints** for device registration and push sending

6. **Test on physical device** (push notifications don't work in simulator/emulator)

## Security Notes

- Push tokens are stored securely in AsyncStorage
- Device registration requires user ID for authentication
- Notification preferences stored locally
- Backend should validate user permissions before sending notifications

## Troubleshooting

### Notifications not appearing:
1. Check permission status in app settings
2. Verify push token is generated (physical device only)
3. Check notification channel is properly configured (Android)
4. Verify backend is sending to correct push token

### Badge not updating:
1. Ensure `setBadgeCount` is called after marking as read
2. Check iOS badge permission is granted
3. Verify notification context is properly initialized

### Deep links not working:
1. Check URL scheme in app.json matches deep link format
2. Verify routes exist in app directory
3. Check notification payload includes correct metadata
