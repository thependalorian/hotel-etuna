# Smartpay Navigation Flow - Wallets & Cash-Out

## Quick Reference

### **Wallets Navigation Tree**

```
┌─────────────────────────────────────────────────────────────┐
│                         Home Screen                          │
│                    (tabs)/index.tsx                          │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Services Grid (3×3)                          │  │
│  │  ┌────────┬────────┬────────┐                        │  │
│  │  │ Proof  │Receive │WALLETS │ ← Tap "Wallets"       │  │
│  │  │  Life  │        │        │                        │  │
│  │  ├────────┼────────┼────────┤                        │  │
│  │  │ CASH   │Vouchers│ Agent  │                        │  │
│  │  │  OUT   │        │        │                        │  │
│  │  └────────┴────────┴────────┘                        │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌───────────────┐              ┌────────────────┐
│   Wallets     │              │   Cash Out     │
│     List      │              │      Hub       │
│  /wallets     │              │  /cash-out     │
│               │              │                │
│ • Main        │              │ • At Till      │
│ • Savings     │              │ • At Agent     │
│ • Business    │              │ • At Merchant  │
│ [Add Wallet]  │              │ • At ATM       │
└───────┬───────┘              │ • Bank         │
        │                       └────┬───────────┘
        │                            │
    Tap Wallet                    Select
        │                          Method
        ▼                            │
┌──────────────────┐                 │
│  Wallet Detail   │                 │
│ /wallets/[id]    │                 │
│                  │     ┌───────────┴───────────┬──────────┬──────────┐
│ BalanceCard      │     │                       │          │          │
│ Quick Actions:   │     ▼                       ▼          ▼          ▼
│ • Cash Out ──────┼──►Till/Agent/Merchant    ATM        Bank     Success
│ • Send Money     │   /cash-out/till      /cash-out/ /cash-out/ /cash-out/
│ • Add Money      │                         atm         bank      success
│ • Settings       │   Steps:               Steps:     Steps:     
│                  │   1. Scan QR           1. Scan    1. Select  • Amount
│ Transactions     │   2. Amount              OR Code   Account   • Method
│ (filtered)       │   3. Confirm           2. Amount  2. Amount  • Details
└──────────────────┘   4. 2FA               3. Confirm 3. Confirm • Receipt
                       5. Success           4. 2FA     4. 2FA     [Done] → Home
                                            5. Success 5. Success
                                            (+ code)   (+ ref)

                    Tap Add Wallet
                         ↓
                ┌──────────────────┐
                │   Add Wallet     │
                │  /wallets/add    │
                │                  │
                │ • Name           │
                │ • Icon (12)      │
                │ • Color (8)      │
                │ • Type (4)       │
                │ • Goal (opt)     │
                │ • Preview        │
                │ [Create]         │
                └────────┬─────────┘
                         │
                    Success → Back to List
```

---

## Route Patterns

### **Wallets Routes**
```typescript
/wallets                          // List screen
/wallets/[id]                     // Detail screen (dynamic route)
/wallets/add                      // Create screen
```

### **Cash-Out Routes**
```typescript
/cash-out                         // Hub screen
/cash-out/till                    // Till (default)
/cash-out/till?type=agent         // Agent variant
/cash-out/till?type=merchant      // Merchant variant
/cash-out/atm                     // ATM screen
/cash-out/bank                    // Bank screen
/cash-out/success                 // Success screen (with params)
```

---

## Navigation Parameters

### **Wallet Detail**
```typescript
router.push('/wallets/[id]');
// Params: { id: string }
```

### **Cash-Out Success**
```typescript
router.replace({
  pathname: '/cash-out/success',
  params: {
    amount: string,          // "100.00"
    method: string,          // "ATM Withdrawal"
    recipient?: string,      // "ATM #123"
    code?: string,           // "ABC12345" (ATM only)
    reference?: string,      // "BNK-REF123" (Bank only)
    processingTime?: string, // "1-2 business days" (Bank only)
  },
});
```

### **Send Money (from Wallet)**
```typescript
router.push('/send-money?fromWalletId={walletId}');
// Query: { fromWalletId: string }
```

---

## Screen States

### **All Screens Support:**
- ✅ Loading state (spinner)
- ✅ Error state (alert or inline)
- ✅ Empty state (icon + message)
- ✅ Success state (checkmark animation)

### **Common Patterns:**
1. **List Screens**: Loading → Empty/List
2. **Form Screens**: Input → Validate → Submit → Loading → Success/Error
3. **Multi-Step Flows**: Step 1 → Step 2 → Step 3 → 2FA → Success

---

## Component Reuse

### **Shared Components Used:**
```typescript
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { BalanceCard } from '@/components/home/BalanceCard';
import { AmountInput } from '@/components/shared/AmountInput';
import { TwoFAModal } from '@/components/modals/TwoFAModal';
import { WalletCard } from '@/components/home/WalletCard';
```

### **Header Configurations:**

**Back Button (Stack Screens):**
```tsx
<AppHeader
  title="Wallets"
  showBackButton
  onBackPress={() => router.back()}
/>
```

**Search (Tab Screens):**
```tsx
<AppHeader
  showSearch
  searchPlaceholder="Search or ask Copilot..."
  searchValue={search}
  onSearchChange={setSearch}
  onNotificationPress={() => router.push('/notifications')}
  onAvatarPress={() => router.push('/profile')}
/>
```

---

## User Flows Summary

### **Create Wallet Flow**
```
Home → Wallets List → [Add Wallet] → Fill Form → [Create] → Success → Back to List
Time: ~30 seconds
Steps: 3 screens
```

### **Cash Out at Till Flow**
```
Wallet Detail → [Cash Out] → [At Till] → Scan QR → Enter Amount → Confirm → 2FA → Success
Time: ~45 seconds
Steps: 6 screens + modal
```

### **Cash Out at ATM Flow**
```
Wallet Detail → [Cash Out] → [At ATM] → Scan/Code → Enter Amount → Confirm → 2FA → Success (with code)
Time: ~60 seconds
Steps: 6 screens + modal
```

### **Cash Out to Bank Flow**
```
Wallet Detail → [Cash Out] → [Bank] → Select Account → Enter Amount → Confirm → 2FA → Success (with reference)
Time: ~45 seconds
Steps: 6 screens + modal
```

---

## Entry Points

### **Wallets**
1. Home → Services Grid → "Wallets" tile
2. Direct link: `/wallets`

### **Cash-Out**
1. Home → Services Grid → "Cash Out" tile → `/cash-out`
2. Wallet Detail → Quick Actions → "Cash Out" → `/cash-out`
3. Direct link: `/cash-out`

---

## Exit Points

### **All Flows Exit To:**
- **Success screens**: Always navigate to Home or parent screen
- **Error states**: Stay on current screen with retry option
- **Cancel actions**: Navigate back (router.back())
- **"Done" buttons**: Navigate to Home (replace, not push)

---

## Deep Linking Support

### **Supported Deep Links:**
```typescript
// Wallets
smartpay://wallets
smartpay://wallets/[id]
smartpay://wallets/add

// Cash-Out
smartpay://cash-out
smartpay://cash-out/till?type=agent
smartpay://cash-out/atm
smartpay://cash-out/bank
```

---

## Testing Scenarios

### **Happy Path - Wallets**
1. Open app
2. Tap "Wallets" on home
3. See list of wallets
4. Tap "Main" wallet
5. See wallet detail with balance
6. Tap "Cash Out"
7. Select "At Till"
8. Scan QR (simulated)
9. Enter amount: N$50
10. Tap "Continue"
11. Review and tap "Confirm"
12. Enter PIN in 2FA modal
13. See success screen
14. Tap "Done" → Back to home

### **Edge Cases**
1. Empty wallet list → Show empty state with "Add Wallet" CTA
2. No linked bank accounts → Show "Link Bank Account" in bank flow
3. Insufficient balance → Show error, disable Continue button
4. 2FA failure → Show error in modal, allow retry
5. Network error → Show error state, allow retry
6. Invalid QR code → Show error, allow rescan

---

## Performance Notes

### **Screen Load Times (Target)**
- List screens: < 500ms
- Detail screens: < 300ms
- Form screens: < 200ms
- Success screens: Instant (local data)

### **Optimization**
- Use React.memo for list items
- Lazy load images
- Cache wallet data
- Debounce search input
- Optimize re-renders

---

## Accessibility Navigation

### **Screen Reader Flow**
1. Header announced first
2. Main content second
3. Action buttons last
4. Focus moves logically top-to-bottom
5. Modal traps focus within

### **Keyboard Navigation** (Android TV/Web)
- Tab moves forward
- Shift+Tab moves backward
- Enter/Space activates buttons
- Escape closes modals
- Arrow keys navigate lists

---

## Analytics Events

### **Track These Events:**
```typescript
// Wallets
'wallet_list_viewed'
'wallet_detail_viewed'
'wallet_create_started'
'wallet_created'
'wallet_updated'
'wallet_deleted'

// Cash-Out
'cashout_hub_viewed'
'cashout_method_selected'
'cashout_amount_entered'
'cashout_confirmed'
'cashout_2fa_completed'
'cashout_success'
'cashout_failed'
```

---

**Last Updated:** March 17, 2026
**Version:** 1.0.0
**Status:** ✅ Complete
