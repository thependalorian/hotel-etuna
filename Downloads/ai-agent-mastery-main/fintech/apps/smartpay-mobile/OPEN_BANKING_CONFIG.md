# SmartPay Open Banking Configuration

## Overview

SmartPay implements **Namibia Open Banking Standards v1.0 (OBS 2025)** for secure bank account linking using OAuth 2.0 with PKCE (Proof Key for Code Exchange).

## Features

- ✅ OAuth 2.0 with PKCE for secure authorization
- ✅ AIS (Account Information Service) - Read account balances and transactions
- ✅ PISP support ready (Payment Initiation Service Provider)
- ✅ Secure token storage using expo-secure-store
- ✅ Automatic token refresh
- ✅ Test mode for development
- ✅ Deep linking for OAuth callbacks
- ✅ Universal links (production)

---

## Supported Banks

### 1. FNB Namibia
- **Bank ID**: `fnb`
- **Color**: `#003D7A`
- **Authorization Endpoint**: `https://openapi.fnb.com.na/oauth/authorize`
- **Token Endpoint**: `https://openapi.fnb.com.na/oauth/token`
- **Revoke Endpoint**: `https://openapi.fnb.com.na/oauth/revoke`
- **API Base URL**: `https://openapi.fnb.com.na/v1`
- **Scopes**: `accounts`, `balances`, `transactions`

### 2. Bank Windhoek
- **Bank ID**: `bank_windhoek`
- **Color**: `#00A859`
- **Authorization Endpoint**: `https://openbanking.bankwindhoek.com.na/authorize`
- **Token Endpoint**: `https://openbanking.bankwindhoek.com.na/token`
- **Revoke Endpoint**: `https://openbanking.bankwindhoek.com.na/revoke`
- **API Base URL**: `https://openbanking.bankwindhoek.com.na/api/v1`
- **Scopes**: `accounts`, `balances`, `transactions`

### 3. Standard Bank Namibia
- **Bank ID**: `standard_bank`
- **Color**: `#003F87`
- **Authorization Endpoint**: `https://api.standardbank.com.na/oauth2/authorize`
- **Token Endpoint**: `https://api.standardbank.com.na/oauth2/token`
- **Revoke Endpoint**: `https://api.standardbank.com.na/oauth2/revoke`
- **API Base URL**: `https://api.standardbank.com.na/openbanking/v1`
- **Scopes**: `accounts`, `balances`, `transactions`

### 4. Nedbank Namibia
- **Bank ID**: `nedbank`
- **Color**: `#007A3D`
- **Authorization Endpoint**: `https://openapi.nedbank.com.na/oauth/authorize`
- **Token Endpoint**: `https://openapi.nedbank.com.na/oauth/token`
- **Revoke Endpoint**: `https://openapi.nedbank.com.na/oauth/revoke`
- **API Base URL**: `https://openapi.nedbank.com.na/api/v1`
- **Scopes**: `accounts`, `balances`, `transactions`

### 5. NamPost Savings Bank
- **Bank ID**: `nampost`
- **Color**: `#ED1C24`
- **Authorization Endpoint**: `https://api.nampost.com.na/oauth/authorize`
- **Token Endpoint**: `https://api.nampost.com.na/oauth/token`
- **Revoke Endpoint**: `https://api.nampost.com.na/oauth/revoke`
- **API Base URL**: `https://api.nampost.com.na/openbanking/v1`
- **Scopes**: `accounts`, `balances`, `transactions`

---

## Environment Variables

Add these to your `.env` file:

```bash
# FNB Namibia
EXPO_PUBLIC_FNB_CLIENT_ID=your_fnb_client_id_here

# Bank Windhoek
EXPO_PUBLIC_BANK_WINDHOEK_CLIENT_ID=your_bank_windhoek_client_id_here

# Standard Bank
EXPO_PUBLIC_STANDARD_BANK_CLIENT_ID=your_standard_bank_client_id_here

# Nedbank
EXPO_PUBLIC_NEDBANK_CLIENT_ID=your_nedbank_client_id_here

# NamPost
EXPO_PUBLIC_NAMPOST_CLIENT_ID=your_nampost_client_id_here

# Backend API (for syncing linked accounts)
EXPO_PUBLIC_API_BASE_URL=https://api.smartpay.com.na
```

**Note**: If client IDs are not provided, the app will run in **test mode** with mock OAuth flows.

---

## OAuth Flow

### 1. Initiate Consent

```typescript
import { initiateConsent } from '@/services/openBanking';

const result = await initiateConsent('fnb');
// Opens bank's OAuth page in browser
```

### 2. User Authorizes

User logs into their bank and grants permission to SmartPay.

### 3. OAuth Callback

Bank redirects to: `smartpay://oauth-callback?code=xxx&state=xxx`

### 4. Token Exchange

```typescript
import { handleOAuthCallback } from '@/services/openBanking';

const result = await handleOAuthCallback(callbackUrl);
// Exchanges authorization code for access/refresh tokens
```

### 5. Fetch Accounts

```typescript
import { getLinkedAccounts } from '@/services/openBanking';

const accounts = await getLinkedAccounts();
```

---

## Deep Linking Configuration

### iOS (app.json)

```json
{
  "ios": {
    "bundleIdentifier": "com.thependalorian.smartpay",
    "associatedDomains": [
      "applinks:smartpay.com.na"
    ]
  }
}
```

### Android (app.json)

```json
{
  "android": {
    "package": "com.thependalorian.smartpay",
    "intentFilters": [
      {
        "action": "VIEW",
        "autoVerify": true,
        "data": [
          {
            "scheme": "https",
            "host": "smartpay.com.na",
            "pathPrefix": "/oauth-callback"
          },
          {
            "scheme": "smartpay",
            "host": "oauth-callback"
          }
        ],
        "category": ["BROWSABLE", "DEFAULT"]
      }
    ]
  }
}
```

### Redirect URIs

- **Development**: `smartpay://oauth-callback`
- **Production**: `https://smartpay.com.na/oauth-callback` (Universal Link)

---

## API Endpoints

### Get Accounts

```http
GET /accounts
Authorization: Bearer {access_token}
```

**Response:**

```json
{
  "accounts": [
    {
      "accountId": "ACC123456",
      "accountNumber": "1234567890",
      "accountType": "savings",
      "accountName": "My Savings",
      "currency": "NAD"
    }
  ]
}
```

### Get Balances

```http
GET /accounts/{accountId}/balances
Authorization: Bearer {access_token}
```

**Response:**

```json
{
  "balances": {
    "available": {
      "amount": 5000.00,
      "currency": "NAD"
    },
    "current": {
      "amount": 5200.00,
      "currency": "NAD"
    }
  }
}
```

### Get Transactions

```http
GET /accounts/{accountId}/transactions?fromDate=2024-01-01&toDate=2024-12-31
Authorization: Bearer {access_token}
```

**Response:**

```json
{
  "transactions": [
    {
      "transactionId": "TXN123",
      "bookingDateTime": "2024-03-15T10:30:00Z",
      "transactionInformation": "Payment from John Doe",
      "amount": {
        "amount": 500.00,
        "currency": "NAD"
      },
      "creditDebitIndicator": "Credit",
      "balanceAfterTransaction": {
        "amount": 5500.00
      },
      "transactionReference": "REF123"
    }
  ]
}
```

---

## Security

### PKCE (Proof Key for Code Exchange)

SmartPay implements PKCE (RFC 7636) to prevent authorization code interception:

1. **Code Verifier**: Random 43-128 character string
2. **Code Challenge**: SHA256 hash of code verifier (Base64 URL encoded)
3. **Challenge Method**: `S256`

### Token Storage

- Tokens are stored securely using `expo-secure-store`
- iOS: Keychain
- Android: EncryptedSharedPreferences

### Token Refresh

- Access tokens are automatically refreshed before expiration
- 5-minute buffer before expiry

---

## Screens

### 1. Link Bank (`/banking/link-bank`)

Shows list of available banks.

**Features:**
- Bank logos and colors
- Test mode indicator
- Security information

### 2. OAuth Callback (`/banking/oauth-callback`)

Handles OAuth redirect and token exchange.

**Features:**
- Loading state
- Success/error handling
- Auto-redirect

### 3. Linked Accounts (`/banking/linked-accounts`)

Lists all linked bank accounts.

**Features:**
- Account balances
- Refresh balances
- Disconnect accounts
- Link more accounts

### 4. Account Details (`/banking/account-details/[id]`)

Shows detailed account information.

**Features:**
- Available/current balance
- Recent transactions
- Account information
- Disconnect option

### 5. Cash-Out Bank (`/cash-out/bank`)

Bank transfer flow (integrated with OAuth accounts).

**Features:**
- Select linked account
- Amount input
- 2FA verification
- Success confirmation

---

## Test Mode

If no client IDs are configured, the app runs in **test mode**:

- Mock OAuth flow
- Mock tokens
- Mock linked accounts
- No real bank connections

Test mode is indicated with a **"Test Mode"** badge on bank cards.

---

## Usage Examples

### Link a Bank Account

```typescript
import { initiateConsent } from '@/services/openBanking';
import { router } from 'expo-router';

async function linkBank() {
  const result = await initiateConsent('fnb');
  
  if (result.type === 'success') {
    router.push({
      pathname: '/banking/oauth-callback',
      params: { url: result.url },
    });
  }
}
```

### Get Account Balance

```typescript
import { getAccountBalances } from '@/services/openBanking';

const balance = await getAccountBalances('fnb_ACC123456');
console.log(`Available: NAD ${balance.available}`);
```

### Disconnect Bank

```typescript
import { disconnectBank } from '@/services/openBanking';

const success = await disconnectBank('fnb_ACC123456');
if (success) {
  console.log('Bank disconnected');
}
```

---

## Error Handling

### Common Errors

1. **consent_denied**: User cancelled OAuth flow
2. **invalid_grant**: Authorization code expired or invalid
3. **token_expired**: Access token expired (auto-refreshed)
4. **account_not_found**: Account was deleted or revoked
5. **network_error**: Network connectivity issues

### Error Response Example

```typescript
const result = await handleOAuthCallback(url);

if (!result.success) {
  console.error(result.error);
  // Handle error: 'State mismatch - possible CSRF attack'
}
```

---

## Backend Integration

The mobile app syncs linked accounts with the backend:

### Sync Endpoint

```http
POST /api/v1/mobile/banking/sync
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "accounts": [
    {
      "id": "fnb_ACC123456",
      "bankId": "fnb",
      "bankName": "FNB Namibia",
      "accountId": "ACC123456",
      "accountNumber": "****1234",
      "accountType": "savings",
      "currency": "NAD",
      "linkedAt": "2024-03-15T10:30:00Z",
      "status": "active"
    }
  ]
}
```

### Disconnect Endpoint

```http
POST /api/v1/mobile/banking/disconnect
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "accountId": "fnb_ACC123456"
}
```

---

## Compliance

### Namibia Open Banking Standards v1.0 (OBS 2025)

SmartPay complies with:

- ✅ OAuth 2.0 Authorization Framework (RFC 6749)
- ✅ PKCE (RFC 7636)
- ✅ AIS (Account Information Service)
- ✅ Data minimization (read-only access)
- ✅ User consent management
- ✅ Secure token storage
- ✅ Token revocation

### Data Access

SmartPay requests **read-only** access to:

- Account information (account numbers, types)
- Account balances
- Transaction history

**SmartPay NEVER:**
- Stores user bank credentials
- Initiates payments without explicit user consent
- Shares data with third parties

---

## Production Checklist

- [ ] Register OAuth clients with all banks
- [ ] Add client IDs to environment variables
- [ ] Configure universal links (iOS Associated Domains)
- [ ] Set up Android App Links verification
- [ ] Test OAuth flows with real banks
- [ ] Test token refresh logic
- [ ] Test error handling (network failures, denied consent)
- [ ] Set up backend sync endpoints
- [ ] Configure production redirect URIs
- [ ] Add analytics/monitoring
- [ ] Security audit
- [ ] User consent screens review
- [ ] Privacy policy update

---

## Support

For issues or questions:

- **Developer**: Check `services/openBanking.ts`
- **Screens**: `app/(authenticated)/banking/`
- **Backend API**: [API Documentation]
- **Open Banking Standards**: [Namibia OBS v1.0 Spec]

---

## License

Proprietary - SmartPay © 2024
