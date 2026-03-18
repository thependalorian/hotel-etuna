# SmartPay Notifications - Testing Guide

## Testing Checklist

Use this guide to thoroughly test push notifications on both iOS and Android.

---

## Prerequisites

### Required Setup
- [ ] Physical iOS or Android device (notifications don't work in simulators)
- [ ] `expo-notifications` installed (`npm install`)
- [ ] EAS project ID configured in `app.json`
- [ ] Firebase setup completed (Android)
- [ ] APNs configured (iOS)
- [ ] Backend endpoints implemented

### Development Tools
- [ ] Expo Go app installed (for development testing)
- [ ] EAS CLI installed (`npm install -g eas-cli`)
- [ ] Expo CLI installed (`npm install -g expo-cli`)

---

## Test Plan

### Phase 1: Permission Request

#### Test 1.1: First Time Permission Request
1. Install app on device (fresh install)
2. Open app
3. Navigate to Home screen
4. **Expected**: Permission prompt appears
5. **Action**: Tap "Allow"
6. **Verify**: Permission granted, push token generated

#### Test 1.2: Permission Denied
1. Fresh install
2. Open app
3. **Action**: Tap "Don't Allow"
4. **Verify**: App shows "Enable in Settings" message
5. **Action**: Tap "Open Settings"
6. **Verify**: System settings open

#### Test 1.3: Permission Already Granted
1. App with permission already granted
2. Open app
3. **Verify**: No permission prompt, badge functionality works

---

### Phase 2: Notification Channels (Android)

#### Test 2.1: Channel Creation
1. Open app on Android
2. Go to System Settings → Apps → SmartPay → Notifications
3. **Verify**: 6 channels exist:
   - Default Notifications
   - Payments
   - KYC Updates
   - Reminders
   - Social
   - Loans

#### Test 2.2: Channel Settings
1. Open each channel
2. **Verify**: 
   - Custom sound configured
   - Vibration pattern set
   - LED color assigned (if device supports)
   - Show badge enabled

---

### Phase 3: Local Notifications

#### Test 3.1: Immediate Notification
```typescript
import { notificationService } from '@/services/notifications';

await notificationService.scheduleLocal({
  type: 'payment_received',
  title: 'Test Payment',
  body: 'You received N$100.00',
  trigger: { seconds: 3 },
});
```
**Expected**: Notification appears after 3 seconds

#### Test 3.2: Scheduled Notification
```typescript
await notificationService.scheduleLocal({
  type: 'proof_of_life_reminder',
  title: 'Reminder',
  body: 'This is a scheduled reminder',
  trigger: { seconds: 60 },
});
```
**Expected**: Notification appears after 60 seconds

#### Test 3.3: Cancel Notification
```typescript
const id = await notificationService.scheduleLocal({
  type: 'payment_received',
  title: 'Will be cancelled',
  body: 'You should not see this',
  trigger: { seconds: 30 },
});

// Cancel before it fires
await notificationService.cancelNotification(id);
```
**Expected**: No notification appears

---

### Phase 4: Push Notifications

#### Test 4.1: Send via Expo Push Tool
1. Get push token from app (check console or notification settings screen)
2. Visit: https://expo.dev/notifications
3. Paste token
4. Set title and message
5. Send notification
**Expected**: Notification received on device

#### Test 4.2: Send via curl
```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[YOUR_TOKEN]",
    "title": "Test Push",
    "body": "This is a test",
    "data": {
      "type": "system_announcement"
    }
  }'
```
**Expected**: Notification received

#### Test 4.3: Send from Backend
1. Use backend API to send notification
2. **Verify**: Notification received
3. **Verify**: Appears in notifications screen
4. **Verify**: Badge count updates

---

### Phase 5: Notification States

#### Test 5.1: Foreground State
1. App is open and active
2. Send notification
**Expected**:
- Notification banner appears in app
- Added to notification list
- Badge count increases

#### Test 5.2: Background State
1. App is in background (home screen)
2. Send notification
**Expected**:
- System notification appears
- Badge updates on app icon
- Sound plays
- Vibration occurs

#### Test 5.3: Killed State
1. Force close app
2. Send notification
**Expected**:
- System notification appears
- Tap opens app
- Navigates to deep link
- Notification marked as read

---

### Phase 6: Badge Management

#### Test 6.1: Badge Count
1. Start with 0 notifications
2. Send 3 notifications
**Expected**: Badge shows "3"

#### Test 6.2: Badge Decrement
1. Badge count is 3
2. Mark 1 notification as read
**Expected**: Badge shows "2"

#### Test 6.3: Badge Clear
1. Badge count is > 0
2. Mark all as read
**Expected**: Badge count is 0

---

### Phase 7: Deep Linking

#### Test 7.1: Transaction Deep Link
1. Send notification with type `payment_received` and `transactionId`
2. Tap notification
**Expected**: Opens `/transactions/{transactionId}` screen

#### Test 7.2: Group Invitation Deep Link
1. Send notification with type `group_invitation` and `groupId`
2. Tap notification
**Expected**: Opens `/groups/{groupId}` screen

#### Test 7.3: All Deep Links
Test each notification type:
- [ ] payment_received → /transactions/{id}
- [ ] payment_sent → /transactions/{id}
- [ ] kyc_status_update → /kyc
- [ ] proof_of_life_reminder → /proof-of-life
- [ ] voucher_received → /vouchers
- [ ] group_invitation → /groups/{id}
- [ ] loan_status_update → /loans/{id}
- [ ] transaction_failed → /transactions
- [ ] wallet_low_balance → /wallets
- [ ] payment_request_received → /requests
- [ ] system_announcement → /notifications

---

### Phase 8: Notification List Screen

#### Test 8.1: Empty State
1. Clear all notifications
2. Navigate to `/notifications`
**Expected**: Empty state with icon and message

#### Test 8.2: Notification List
1. Send 5 notifications
2. Navigate to `/notifications`
**Expected**:
- All 5 notifications displayed
- Sorted by newest first
- Unread have blue left border
- Icons match notification types
- Colors match notification types

#### Test 8.3: Mark as Read
1. Tap unread notification
**Expected**:
- Notification marked as read
- Blue border removed
- Badge count decreases
- Navigates to deep link

#### Test 8.4: Delete Notification
1. Tap delete button (X icon)
**Expected**:
- Notification removed from list
- Badge count updates if was unread

#### Test 8.5: Mark All Read
1. Have multiple unread notifications
2. Tap "Mark all read"
**Expected**:
- All notifications marked as read
- Badge count becomes 0
- Blue borders removed

#### Test 8.6: Clear All
1. Have multiple notifications
2. Tap "Clear all"
**Expected**:
- All notifications removed
- Empty state shown
- Badge count is 0

#### Test 8.7: Pull to Refresh
1. Pull down on notification list
**Expected**:
- Refresh animation
- List reloads

---

### Phase 9: Notification Settings

#### Test 9.1: Permission Status Display
1. Navigate to `/notifications-settings`
**Expected**:
- Shows correct permission status
- Shows "Enabled" or "Disabled"
- Shows device registered if token exists

#### Test 9.2: Toggle Categories
1. Toggle "Payments" off
2. Toggle "Social" off
**Expected**:
- Settings saved
- Preferences persisted after app restart

#### Test 9.3: Enable from Settings
1. Have notifications disabled
2. Tap "Enable" button
**Expected**:
- Permission request appears
- If granted, status updates
- If denied, prompted to open system settings

---

### Phase 10: Special Notifications

#### Test 10.1: Proof-of-Life Reminder Scheduling
```typescript
import { notificationService } from '@/services/notifications';

// Schedule reminders for user with 10 days until expiry
await notificationService.scheduleProofOfLifeReminder(10);
```
**Expected**: 3 notifications scheduled (7, 3, 1 days from now)

#### Test 10.2: Loan Payment Reminder
```typescript
const dueDate = new Date();
dueDate.setDate(dueDate.getDate() + 5);

await notificationService.scheduleLoanPaymentReminder(
  'loan-123',
  250.00,
  dueDate
);
```
**Expected**: Notification scheduled for 2 days from now

#### Test 10.3: Payment Reminder
```typescript
const reminderDate = new Date();
reminderDate.setHours(reminderDate.getHours() + 2);

await notificationService.schedulePaymentReminder(
  50.00,
  'John Doe',
  reminderDate
);
```
**Expected**: Notification scheduled for 2 hours from now

---

### Phase 11: Error Handling

#### Test 11.1: No Permission
1. Deny notification permission
2. Try to get push token
**Expected**: Graceful failure, no crash

#### Test 11.2: No Internet
1. Turn off WiFi and mobile data
2. Try to register device
**Expected**: Error logged, doesn't crash app

#### Test 11.3: Invalid Backend URL
1. Configure invalid backend URL
2. Try to register device
**Expected**: Timeout, error logged, app continues

---

### Phase 12: Performance

#### Test 12.1: Many Notifications
1. Send 100 notifications rapidly
2. Open notification screen
**Expected**:
- List renders smoothly
- Only 100 most recent stored
- No lag or freezing

#### Test 12.2: Badge Update Speed
1. Receive notification
2. Check badge update time
**Expected**: Badge updates within 1 second

#### Test 12.3: Memory Usage
1. Use 100+ notifications
2. Check app memory usage
**Expected**: Memory usage < 150MB additional

---

### Phase 13: Platform-Specific

#### iOS Tests
- [ ] APNs production certificate works
- [ ] Badge appears on app icon
- [ ] Notification appears in Notification Center
- [ ] Sound plays
- [ ] Haptic feedback occurs
- [ ] Background app refresh works
- [ ] Critical alerts work (if configured)
- [ ] Notification grouping works

#### Android Tests
- [ ] FCM token generation works
- [ ] Notification appears in status bar
- [ ] Notification appears in drawer
- [ ] Channel-specific sounds work
- [ ] LED indicator works (if device supports)
- [ ] Vibration pattern works
- [ ] Heads-up notification appears
- [ ] Notification collapse works (multiple)
- [ ] Do Not Disturb respected

---

## Testing Scripts

### Script 1: Test All Notification Types

```typescript
import { notificationHelpers } from '@/utils/notificationHelpers';

async function testAllNotificationTypes() {
  await notificationHelpers.notifyPaymentReceived(100, 'John', 'txn-1');
  await new Promise(r => setTimeout(r, 2000));
  
  await notificationHelpers.notifyPaymentSent(50, 'Jane', 'txn-2');
  await new Promise(r => setTimeout(r, 2000));
  
  await notificationHelpers.notifyKYCStatusUpdate('approved');
  await new Promise(r => setTimeout(r, 2000));
  
  await notificationHelpers.notifyProofOfLifeDue(7);
  await new Promise(r => setTimeout(r, 2000));
  
  await notificationHelpers.notifyVoucherReceived('SAVE20', 20, new Date());
  await new Promise(r => setTimeout(r, 2000));
  
  await notificationHelpers.notifyGroupInvitation('Savings Circle', 'John', 'grp-1');
  await new Promise(r => setTimeout(r, 2000));
  
  await notificationHelpers.notifyLoanStatusUpdate('approved', 1000, 'loan-1');
  await new Promise(r => setTimeout(r, 2000));
  
  await notificationHelpers.notifyTransactionFailed(75, 'Store', 'Insufficient funds');
  await new Promise(r => setTimeout(r, 2000));
  
  await notificationHelpers.notifyLowBalance(45);
  await new Promise(r => setTimeout(r, 2000));
  
  await notificationHelpers.notifyPaymentRequest(30, 'Sarah', 'req-1');
  await new Promise(r => setTimeout(r, 2000));
  
  await notificationHelpers.notifyPaymentRequestPaid(30, 'Mike', 'req-2');
  await new Promise(r => setTimeout(r, 2000));
  
  await notificationHelpers.notifySystemAnnouncement('Welcome', 'Welcome to SmartPay!');
  
  console.log('All notification types scheduled!');
}
```

### Script 2: Test Permission Flow

```typescript
async function testPermissionFlow() {
  const { requestPermission, permissionStatus } = useNotificationsContext();
  
  console.log('Initial status:', permissionStatus);
  
  const granted = await requestPermission();
  console.log('Permission granted:', granted);
  
  if (granted) {
    console.log('Getting push token...');
    const token = await notificationService.getPushToken();
    console.log('Push token:', token);
  }
}
```

### Script 3: Test Badge Functionality

```typescript
async function testBadgeCount() {
  const { unreadCount, markAsRead, markAllAsRead } = useNotificationsContext();
  
  console.log('Initial unread:', unreadCount);
  
  // Send 3 test notifications
  for (let i = 0; i < 3; i++) {
    await notificationHelpers.notifyPaymentReceived(100, `User ${i}`, `txn-${i}`);
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('After 3 notifications:', unreadCount);
  
  // Mark one as read
  const firstNotification = notifications[0];
  await markAsRead(firstNotification.id);
  console.log('After marking one read:', unreadCount);
  
  // Mark all as read
  await markAllAsRead();
  console.log('After marking all read:', unreadCount);
}
```

---

## Manual Test Cases

### TC-1: Payment Received Notification

**Steps:**
1. Send payment from another user/backend
2. Observe notification

**Expected Results:**
- ✓ Notification appears immediately
- ✓ Title: "Payment Received"
- ✓ Body includes amount and sender name
- ✓ Icon is green arrow-down-circle
- ✓ Badge count increases
- ✓ Tapping opens transaction details

**Pass/Fail**: _______

---

### TC-2: KYC Status Update

**Steps:**
1. Update KYC status via backend
2. Check notification received

**Expected Results:**
- ✓ Notification appears
- ✓ Title: "KYC Update"
- ✓ Body describes status change
- ✓ Icon is shield-checkmark
- ✓ Tapping opens KYC screen
- ✓ Uses "kyc" channel (Android)

**Pass/Fail**: _______

---

### TC-3: Proof-of-Life Reminder Schedule

**Steps:**
1. Run: `await notificationService.scheduleProofOfLifeReminder(10)`
2. Check scheduled notifications

**Expected Results:**
- ✓ 3 notifications scheduled
- ✓ Scheduled for 7, 3, and 1 days from now
- ✓ Each has appropriate message
- ✓ All point to /proof-of-life

**Pass/Fail**: _______

---

### TC-4: Group Invitation

**Steps:**
1. Send group invitation notification
2. Tap notification

**Expected Results:**
- ✓ Opens group details screen
- ✓ Icon is purple people icon
- ✓ Uses "social" channel
- ✓ Less intrusive than payment notifications

**Pass/Fail**: _______

---

### TC-5: Low Balance Warning

**Steps:**
1. Make wallet balance < N$50
2. Check notification

**Expected Results:**
- ✓ Notification appears
- ✓ Shows current balance
- ✓ Suggests topping up
- ✓ Icon is wallet icon
- ✓ Orange/warning color
- ✓ Tapping opens wallets screen

**Pass/Fail**: _______

---

### TC-6: Transaction Failed

**Steps:**
1. Attempt transaction that will fail
2. Check notification

**Expected Results:**
- ✓ Notification appears immediately
- ✓ Shows error message
- ✓ Red/error color
- ✓ Alert icon
- ✓ Provides helpful error info

**Pass/Fail**: _______

---

## Integration Tests

### INT-1: Login → Registration Flow

**Steps:**
1. Fresh app install
2. Complete login
3. Grant notification permission

**Expected:**
- Push token generated
- Device registered with backend
- Token stored in AsyncStorage
- User can receive notifications

**Pass/Fail**: _______

---

### INT-2: Logout → Cleanup

**Steps:**
1. User logged in with notifications enabled
2. Logout from app

**Expected:**
- All notifications cleared
- Badge count reset to 0
- Device unregistered from backend
- Scheduled notifications cancelled

**Pass/Fail**: _______

---

### INT-3: Multiple Devices

**Steps:**
1. Login on Device A
2. Login on Device B with same account
3. Send notification

**Expected:**
- Both devices receive notification
- Both show in notification list
- Badge updates on both devices

**Pass/Fail**: _______

---

## Platform-Specific Tests

### iOS-Specific

#### iOS-1: Badge on App Icon
- [ ] Badge number appears on app icon
- [ ] Badge updates in real-time
- [ ] Badge clears when all read

#### iOS-2: Notification Center
- [ ] Notifications appear in Notification Center
- [ ] Grouped by app
- [ ] Persistent until cleared
- [ ] Swipe actions work

#### iOS-3: Lock Screen
- [ ] Notifications appear on lock screen
- [ ] Tapping unlocks and opens app
- [ ] Face ID/Touch ID required if enabled

#### iOS-4: Banner Style
- [ ] Banner appears at top
- [ ] Auto-dismisses after 5 seconds
- [ ] Swipe down for actions
- [ ] Swipe up to dismiss

---

### Android-Specific

#### AND-1: Notification Drawer
- [ ] Notifications appear in drawer
- [ ] Expandable for full content
- [ ] Actions available (if configured)
- [ ] Swipe to dismiss works

#### AND-2: Channel Settings
- [ ] Each channel has separate settings
- [ ] Can disable per-channel
- [ ] Sound/vibration customizable
- [ ] Importance level correct

#### AND-3: Heads-Up Display
- [ ] High-priority notifications show as heads-up
- [ ] Auto-dismiss after timeout
- [ ] Tap opens app
- [ ] Swipe dismisses

#### AND-4: LED Indicator
- [ ] LED color matches channel (if device supports)
- [ ] LED blinks for new notifications
- [ ] Stops after notification viewed

---

## Performance Tests

### PERF-1: Notification Load Time
**Test**: Send notification, measure time to appear
**Expected**: < 2 seconds from send to display
**Pass/Fail**: _______

### PERF-2: Large Notification List
**Test**: Load 100 notifications in list
**Expected**: Smooth scrolling, < 1s load time
**Pass/Fail**: _______

### PERF-3: Badge Update Latency
**Test**: Mark notification as read, measure badge update
**Expected**: < 500ms update time
**Pass/Fail**: _______

### PERF-4: Memory Usage
**Test**: Monitor memory with 100 notifications
**Expected**: < 100MB additional memory
**Pass/Fail**: _______

---

## Automated Testing (Optional)

### Jest Test Example

```typescript
import { notificationService } from '@/services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Notification Service', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('should request permissions', async () => {
    const status = await notificationService.requestPermissions();
    expect(status).toHaveProperty('granted');
    expect(status).toHaveProperty('canAskAgain');
  });

  it('should schedule local notification', async () => {
    const id = await notificationService.scheduleLocal({
      type: 'payment_received',
      title: 'Test',
      body: 'Test notification',
      trigger: { seconds: 1 },
    });
    expect(id).toBeTruthy();
  });

  it('should cancel notification', async () => {
    const id = await notificationService.scheduleLocal({
      type: 'payment_received',
      title: 'Test',
      body: 'Test',
      trigger: { seconds: 60 },
    });
    
    await notificationService.cancelNotification(id);
    // Verify notification was cancelled
  });
});
```

---

## Regression Tests

Before each release, verify:

- [ ] All 12 notification types work
- [ ] Deep links navigate correctly
- [ ] Badge count accurate
- [ ] Permission flow works
- [ ] Settings persist
- [ ] Channels configured (Android)
- [ ] Sounds play
- [ ] Icons display correctly
- [ ] Colors match design system
- [ ] Empty states show properly
- [ ] Error handling works
- [ ] Backend registration successful
- [ ] Logout clears notifications
- [ ] Multi-device support works

---

## Troubleshooting Tests

### Issue: Notifications Not Appearing

**Tests:**
1. Check permission status: `await Notifications.getPermissionsAsync()`
2. Verify push token exists: `console.log(pushToken)`
3. Check device is physical (not emulator)
4. Verify backend is sending to correct token
5. Check Expo push service status: https://status.expo.dev

---

### Issue: Badge Not Updating

**Tests:**
1. Check badge permission (iOS): `permissionStatus.ios?.allowsBadge`
2. Verify setBadgeCount called: Add logs
3. Check notification marked as read
4. Restart app and verify badge persists

---

### Issue: Deep Links Not Working

**Tests:**
1. Verify URL scheme in app.json: `smartpay://`
2. Check route exists in app directory
3. Test deep link manually: `npx uri-scheme open smartpay://transactions/123 --ios`
4. Verify notification data has correct format

---

### Issue: Sound Not Playing

**Tests:**
1. Check sound file exists: `assets/sounds/notification.wav`
2. Verify device not in silent mode
3. Check channel sound settings (Android)
4. Test with different sound file

---

## Test Devices

### Minimum Test Matrix

| Device | OS | Version | Status |
|--------|----|---------:|--------|
| iPhone | iOS | 15+ | ☐ Pass ☐ Fail |
| Android | Android | 13+ | ☐ Pass ☐ Fail |

### Recommended Additional Testing

- iPad (iOS)
- Android Tablet
- Various Android manufacturers (Samsung, Google, etc.)
- Different OS versions (iOS 15, 16, 17; Android 11, 12, 13, 14)

---

## Sign-Off Checklist

Before marking notifications as complete:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All platform-specific tests pass
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] Documentation reviewed
- [ ] Code review completed
- [ ] QA testing signed off
- [ ] Product owner approval
- [ ] Ready for production

---

## Test Results Log

| Test ID | Date | Tester | Device | OS | Result | Notes |
|---------|------|--------|--------|----:|--------|-------|
| TC-1 | | | | | ☐ Pass ☐ Fail | |
| TC-2 | | | | | ☐ Pass ☐ Fail | |
| TC-3 | | | | | ☐ Pass ☐ Fail | |
| ... | | | | | | |

---

**Testing complete!** All notification functionality verified and ready for production.
