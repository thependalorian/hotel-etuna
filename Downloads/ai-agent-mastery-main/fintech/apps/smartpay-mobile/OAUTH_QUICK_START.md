# OAuth Quick Start Guide

## Setup (5 minutes)

### 1. Install Dependencies ✅

Already installed:
- `expo-auth-session` ✅
- `expo-web-browser` ✅
- `expo-secure-store` ✅
- `expo-crypto` ✅

### 2. Configure Deep Linking ✅

Already configured in `app.json`:
- Scheme: `smartpay` ✅
- iOS Associated Domains ✅
- Android Intent Filters ✅

### 3. Environment Variables

Create `.env` file (optional for test mode):

```bash
# Only needed for production
EXPO_PUBLIC_FNB_CLIENT_ID=your_client_id
EXPO_PUBLIC_BANK_WINDHOEK_CLIENT_ID=your_client_id
EXPO_PUBLIC_STANDARD_BANK_CLIENT_ID=your_client_id
EXPO_PUBLIC_NEDBANK_CLIENT_ID=your_client_id
EXPO_PUBLIC_NAMPOST_CLIENT_ID=your_client_id
EXPO_PUBLIC_API_BASE_URL=https://api.smartpay.com.na
```

**Without env vars**: App runs in **test mode** automatically.

---

## Files Created

### Service

```
services/openBanking.ts
├── initiateConsent()          - Start OAuth flow
├── handleOAuthCallback()      - Process callback
├── getLinkedAccounts()        - Get linked accounts
├── getAccountBalances()       - Get balance
├── getAccountTransactions()   - Get transactions
├── disconnectBank()           - Revoke consent
└── NAMIBIAN_BANKS            - Bank configurations
```

### Screens

```
app/(authenticated)/banking/
├── link-bank.tsx              - Select bank to link
├── oauth-callback.tsx         - Handle OAuth redirect
├── linked-accounts.tsx        - View linked accounts
└── account-details/
    └── [id].tsx              - Account details & transactions
```

### Updated

```
app/(authenticated)/cash-out/bank.tsx
└── Now uses real OAuth accounts instead of mock data
```

---

## Usage

### Link a Bank Account

```typescript
import { router } from 'expo-router';

// Navigate to link bank screen
router.push('/banking/link-bank');
```

**User Flow:**
1. User selects a bank (FNB, Bank Windhoek, etc.)
2. Opens bank's OAuth page in browser
3. User logs in and authorizes
4. Redirects back to app
5. App exchanges code for tokens
6. Fetches linked accounts
7. Success! Shows linked accounts

### View Linked Accounts

```typescript
import { router } from 'expo-router';

// Navigate to linked accounts
router.push('/banking/linked-accounts');
```

### Use in Cash-Out Flow

The cash-out bank transfer flow (`/cash-out/bank`) automatically uses OAuth-linked accounts.

---

## API Reference

### `initiateConsent(bankId, returnTo?)`

Starts OAuth consent flow.

```typescript
import { initiateConsent } from '@/services/openBanking';

const result = await initiateConsent('fnb');
if (result.type === 'success') {
  // Handle success
}
```

**Parameters:**
- `bankId`: `'fnb' | 'bank_windhoek' | 'standard_bank' | 'nedbank' | 'nampost'`
- `returnTo`: Optional return path after linking

**Returns:** `AuthSession.AuthSessionResult`

---

### `handleOAuthCallback(url)`

Processes OAuth callback and exchanges code for tokens.

```typescript
import { handleOAuthCallback } from '@/services/openBanking';

const result = await handleOAuthCallback(callbackUrl);
if (result.success) {
  console.log('Linked:', result.bankId, result.accountId);
}
```

**Parameters:**
- `url`: Callback URL from OAuth redirect

**Returns:**
```typescript
{
  success: boolean;
  bankId?: NamibianBank;
  accountId?: string;
  error?: string;
}
```

---

### `getLinkedAccounts()`

Gets all linked bank accounts.

```typescript
import { getLinkedAccounts } from '@/services/openBanking';

const accounts = await getLinkedAccounts();
// Returns: LinkedBankAccount[]
```

**Returns:** `LinkedBankAccount[]`

```typescript
type LinkedBankAccount = {
  id: string;                    // 'fnb_ACC123456'
  bankId: NamibianBank;         // 'fnb'
  bankName: string;             // 'FNB Namibia'
  accountId: string;            // 'ACC123456'
  accountNumber: string;        // '****1234'
  accountType: 'savings' | 'current' | 'transmission' | 'credit';
  accountName?: string;
  currency: string;             // 'NAD'
  linkedAt: string;             // ISO date
  status: 'active' | 'expired' | 'revoked';
};
```

---

### `getAccountBalances(accountId)`

Gets balance for a linked account.

```typescript
import { getAccountBalances } from '@/services/openBanking';

const balance = await getAccountBalances('fnb_ACC123456');
console.log(`Available: ${balance.available}`);
console.log(`Current: ${balance.current}`);
```

**Returns:** `AccountBalance | null`

```typescript
type AccountBalance = {
  accountId: string;
  available: number;
  current: number;
  currency: string;
  lastUpdated: string;
};
```

---

### `getAccountTransactions(accountId, fromDate?, toDate?)`

Gets transaction history.

```typescript
import { getAccountTransactions } from '@/services/openBanking';

const transactions = await getAccountTransactions(
  'fnb_ACC123456',
  '2024-01-01',
  '2024-12-31'
);
```

**Returns:** `BankTransaction[]`

```typescript
type BankTransaction = {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  balance: number;
  reference?: string;
  category?: string;
};
```

---

### `disconnectBank(accountId)`

Revokes consent and disconnects account.

```typescript
import { disconnectBank } from '@/services/openBanking';

const success = await disconnectBank('fnb_ACC123456');
if (success) {
  console.log('Disconnected');
}
```

**Returns:** `boolean`

---

### `getAvailableBanks()`

Gets list of supported banks.

```typescript
import { getAvailableBanks } from '@/services/openBanking';

const banks = getAvailableBanks();
// Returns: BankConfig[]
```

**Returns:** `BankConfig[]`

```typescript
type BankConfig = {
  id: NamibianBank;
  name: string;
  logo?: string;
  color: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revokeEndpoint: string;
  apiBaseUrl: string;
  clientId: string;
  scopes: string[];
  isTestMode: boolean;
};
```

---

## Test Mode

Without client IDs, the app runs in **test mode**:

✅ Mock OAuth flow  
✅ Mock tokens  
✅ Mock linked accounts  
✅ No real bank connections  
✅ Instant "linking" (no browser)  
✅ Test mode badge on bank cards  

Perfect for development and testing!

---

## Security

### PKCE Flow

1. Generate `code_verifier` (random 43-128 chars)
2. Generate `code_challenge` (SHA256 hash of verifier)
3. Send `code_challenge` to bank
4. Bank returns authorization code
5. Exchange code + `code_verifier` for tokens

**Why?** Prevents authorization code interception.

### Token Storage

- iOS: Keychain (expo-secure-store)
- Android: EncryptedSharedPreferences
- Automatic encryption
- Secure deletion on logout

### Auto-Refresh

Tokens are automatically refreshed before expiration (5-min buffer).

---

## Navigation Routes

```typescript
// Link a bank account
router.push('/banking/link-bank');

// View linked accounts
router.push('/banking/linked-accounts');

// View account details
router.push({
  pathname: '/banking/account-details/[id]',
  params: { id: 'fnb_ACC123456' }
});

// Cash-out to bank (uses OAuth accounts)
router.push('/cash-out/bank');
```

---

## Troubleshooting

### "OAuth state not found"

**Cause:** OAuth state was cleared or expired.  
**Fix:** Restart the OAuth flow.

### "State mismatch"

**Cause:** Possible CSRF attack or multiple OAuth flows.  
**Fix:** Restart the OAuth flow.

### "No accounts found"

**Cause:** Bank returned no accounts, or user has no eligible accounts.  
**Fix:** Check with bank or try another account.

### "Failed to exchange authorization code"

**Cause:** Network error, invalid code, or expired code.  
**Fix:** Check network connection and retry.

### "Token expired"

**Cause:** Access token expired and refresh failed.  
**Fix:** Re-link the bank account.

---

## Deep Link Testing

### iOS

```bash
xcrun simctl openurl booted "smartpay://oauth-callback?code=test&state=test"
```

### Android

```bash
adb shell am start -W -a android.intent.action.VIEW -d "smartpay://oauth-callback?code=test&state=test"
```

---

## Production Deployment

1. ✅ Get OAuth client IDs from banks
2. ✅ Add to `.env` file
3. ✅ Configure universal links (iOS)
4. ✅ Set up App Links (Android)
5. ✅ Test with real bank OAuth
6. ✅ Update privacy policy
7. ✅ Submit for bank approval
8. ✅ Deploy backend sync endpoints

---

## Support

**Questions?** Check:
- `OPEN_BANKING_CONFIG.md` - Full configuration
- `services/openBanking.ts` - Service implementation
- `app/(authenticated)/banking/` - Screen implementations

**Issues?** 
- Check expo logs: `npx expo start`
- Check device logs
- Check network requests

---

## Next Steps

1. Test in development (test mode)
2. Get OAuth client IDs from banks
3. Configure production environment
4. Test with real banks
5. Deploy!

🎉 **OAuth is ready to use in test mode!**
