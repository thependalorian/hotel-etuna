# Bank OAuth Client Registration Guide

Use this document when registering SmartPay as an OAuth client with Namibian banks.

---

## Application Details

### Basic Information

**Application Name:** SmartPay  
**Company:** SmartPay Namibia  
**Application Type:** Mobile App (iOS + Android)  
**Use Case:** Open Banking - Account Information Service (AIS)

---

## OAuth Configuration

### Redirect URIs

**Development:**
```
smartpay://oauth-callback
```

**Production:**
```
https://smartpay.com.na/oauth-callback
smartpay://oauth-callback
```

**Note:** Both URIs should be registered for production (web + app).

---

### OAuth Grant Type

```
Authorization Code with PKCE (Proof Key for Code Exchange)
```

**Standards:**
- OAuth 2.0 (RFC 6749)
- PKCE (RFC 7636)

---

### Requested Scopes

```
accounts
balances
transactions
```

**Scope Descriptions:**
- `accounts` - Read account information (account number, type, currency)
- `balances` - Read current and available balances
- `transactions` - Read transaction history

---

### PKCE Configuration

**Code Challenge Method:**
```
S256
```

**Code Challenge:** SHA256 hash of code_verifier (Base64 URL encoded)

**Code Verifier Length:** 43-128 characters (random)

---

### Token Configuration

**Access Token Lifetime:** 3600 seconds (1 hour) recommended  
**Refresh Token Lifetime:** 2592000 seconds (30 days) recommended  
**Token Type:** Bearer

---

## Platform Details

### iOS

**Bundle Identifier:**
```
com.thependalorian.smartpay
```

**Associated Domains:**
```
smartpay.com.na
```

**Universal Links:**
```
https://smartpay.com.na/oauth-callback
```

**Custom URL Scheme:**
```
smartpay://
```

---

### Android

**Package Name:**
```
com.thependalorian.smartpay
```

**App Links:**
```
https://smartpay.com.na/oauth-callback
```

**Custom URL Scheme:**
```
smartpay://
```

**SHA-256 Fingerprint:**
```
[To be provided after app signing]
```

---

## API Endpoints

### Authorization Endpoint

**Expected Format:**
```
https://[bank-domain]/oauth/authorize
```

**Parameters:**
- `response_type=code`
- `client_id={client_id}`
- `redirect_uri={redirect_uri}`
- `scope={scopes}`
- `state={random_state}`
- `code_challenge={code_challenge}`
- `code_challenge_method=S256`

**Example:**
```
https://openapi.fnb.com.na/oauth/authorize
  ?response_type=code
  &client_id=smartpay-client-id
  &redirect_uri=smartpay://oauth-callback
  &scope=accounts%20balances%20transactions
  &state=abc123
  &code_challenge=xyz789
  &code_challenge_method=S256
```

---

### Token Endpoint

**Expected Format:**
```
https://[bank-domain]/oauth/token
```

**Method:** POST  
**Content-Type:** application/x-www-form-urlencoded

**Parameters:**
- `grant_type=authorization_code`
- `code={authorization_code}`
- `redirect_uri={redirect_uri}`
- `client_id={client_id}`
- `code_verifier={code_verifier}`

**Expected Response:**
```json
{
  "access_token": "eyJhbG...",
  "refresh_token": "eyJhbG...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "accounts balances transactions"
}
```

---

### Refresh Token Endpoint

**Endpoint:** Same as Token Endpoint  
**Method:** POST

**Parameters:**
- `grant_type=refresh_token`
- `refresh_token={refresh_token}`
- `client_id={client_id}`

**Expected Response:**
```json
{
  "access_token": "eyJhbG...",
  "refresh_token": "eyJhbG...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "accounts balances transactions"
}
```

---

### Revoke Token Endpoint

**Expected Format:**
```
https://[bank-domain]/oauth/revoke
```

**Method:** POST  
**Content-Type:** application/x-www-form-urlencoded

**Parameters:**
- `token={access_or_refresh_token}`
- `client_id={client_id}`

---

## Open Banking API Endpoints

### Get Accounts

**Endpoint:** `GET /accounts`  
**Authorization:** Bearer {access_token}

**Expected Response:**
```json
{
  "accounts": [
    {
      "accountId": "ACC123456",
      "accountNumber": "1234567890",
      "accountType": "savings",
      "accountName": "My Savings Account",
      "currency": "NAD",
      "status": "enabled"
    }
  ]
}
```

---

### Get Account Balances

**Endpoint:** `GET /accounts/{accountId}/balances`  
**Authorization:** Bearer {access_token}

**Expected Response:**
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

---

### Get Account Transactions

**Endpoint:** `GET /accounts/{accountId}/transactions`  
**Authorization:** Bearer {access_token}

**Query Parameters:**
- `fromDate` (optional): ISO 8601 date (YYYY-MM-DD)
- `toDate` (optional): ISO 8601 date (YYYY-MM-DD)
- `limit` (optional): Number of transactions

**Expected Response:**
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
        "amount": 5500.00,
        "currency": "NAD"
      },
      "transactionReference": "REF123",
      "proprietaryBankTransactionCode": {
        "code": "Transfer"
      }
    }
  ]
}
```

---

## Security Requirements

### Data Access

**SmartPay requests READ-ONLY access to:**
- Account information
- Account balances
- Transaction history

**SmartPay DOES NOT:**
- Store user bank credentials
- Initiate payments without explicit consent
- Access PII beyond account information
- Share data with third parties

---

### Data Storage

**User Credentials:** Never stored  
**OAuth Tokens:** Encrypted in device secure storage  
**Account Data:** Cached locally (encrypted)  
**Transaction Data:** Cached locally (encrypted)

---

### Compliance

**Standards:**
- Namibia Open Banking Standards v1.0 (OBS 2025)
- OAuth 2.0 (RFC 6749)
- PKCE (RFC 7636)
- PCI DSS (where applicable)

---

## Contact Information

**Technical Contact:**  
Name: [Your Name]  
Email: [your.email@smartpay.com.na]  
Phone: [+264 XX XXX XXXX]

**Business Contact:**  
Name: [Business Contact]  
Email: [business@smartpay.com.na]  
Phone: [+264 XX XXX XXXX]

**Support:**  
Email: support@smartpay.com.na  
Website: https://smartpay.com.na

---

## Bank-Specific Registration Forms

### FNB Namibia

**Developer Portal:** https://developer.fnb.com.na  
**Expected Client ID Prefix:** `fnb-`

**Required Information:**
- [ ] Application Name
- [ ] Redirect URIs (dev + prod)
- [ ] Bundle Identifier (iOS)
- [ ] Package Name (Android)
- [ ] Requested Scopes
- [ ] PKCE Support: Yes (S256)

---

### Bank Windhoek

**Developer Portal:** https://developer.bankwindhoek.com.na  
**Expected Client ID Prefix:** `bw-`

**Required Information:**
- [ ] Application Name
- [ ] Redirect URIs (dev + prod)
- [ ] Bundle Identifier (iOS)
- [ ] Package Name (Android)
- [ ] Requested Scopes
- [ ] PKCE Support: Yes (S256)

---

### Standard Bank Namibia

**Developer Portal:** https://developer.standardbank.com.na  
**Expected Client ID Prefix:** `sb-`

**Required Information:**
- [ ] Application Name
- [ ] Redirect URIs (dev + prod)
- [ ] Bundle Identifier (iOS)
- [ ] Package Name (Android)
- [ ] Requested Scopes
- [ ] PKCE Support: Yes (S256)

---

### Nedbank Namibia

**Developer Portal:** https://developer.nedbank.com.na  
**Expected Client ID Prefix:** `ned-`

**Required Information:**
- [ ] Application Name
- [ ] Redirect URIs (dev + prod)
- [ ] Bundle Identifier (iOS)
- [ ] Package Name (Android)
- [ ] Requested Scopes
- [ ] PKCE Support: Yes (S256)

---

### NamPost Savings Bank

**Developer Portal:** https://developer.nampost.com.na  
**Expected Client ID Prefix:** `np-`

**Required Information:**
- [ ] Application Name
- [ ] Redirect URIs (dev + prod)
- [ ] Bundle Identifier (iOS)
- [ ] Package Name (Android)
- [ ] Requested Scopes
- [ ] PKCE Support: Yes (S256)

---

## Testing

### Sandbox Environment

**Request access to:**
- [ ] Sandbox client credentials
- [ ] Test user accounts
- [ ] API documentation
- [ ] Postman collection (if available)

**Test Accounts:**
- Savings account
- Current account
- Multiple transactions
- Various balances

---

### Production Environment

**Before production:**
- [ ] Complete integration testing
- [ ] Security audit
- [ ] User acceptance testing
- [ ] Load testing
- [ ] Error handling verification

---

## Deployment Checklist

### Registration

- [ ] Register with all 5 banks
- [ ] Obtain client IDs
- [ ] Configure redirect URIs
- [ ] Test sandbox environments
- [ ] Get production credentials

### Configuration

- [ ] Add client IDs to `.env`
- [ ] Configure universal links
- [ ] Set up App Links
- [ ] Update app.json
- [ ] Build production app

### Verification

- [ ] Test OAuth flow
- [ ] Test token refresh
- [ ] Test error handling
- [ ] Verify security
- [ ] User testing

---

## Support Contacts

### FNB Namibia

**Developer Support:** developer.support@fnb.com.na  
**Technical Issues:** [Support Portal]  
**Documentation:** https://docs.fnb.com.na

### Bank Windhoek

**Developer Support:** openbanking@bankwindhoek.com.na  
**Technical Issues:** [Support Portal]  
**Documentation:** https://docs.bankwindhoek.com.na

### Standard Bank Namibia

**Developer Support:** api.support@standardbank.com.na  
**Technical Issues:** [Support Portal]  
**Documentation:** https://docs.standardbank.com.na

### Nedbank Namibia

**Developer Support:** developers@nedbank.com.na  
**Technical Issues:** [Support Portal]  
**Documentation:** https://docs.nedbank.com.na

### NamPost Savings Bank

**Developer Support:** it.support@nampost.com.na  
**Technical Issues:** [Support Portal]  
**Documentation:** https://docs.nampost.com.na

---

## Notes

1. Client IDs are unique per bank
2. Some banks may require additional documentation
3. Approval process may take 2-4 weeks
4. Sandbox credentials are separate from production
5. Always test in sandbox before production
6. Keep client secrets secure (if provided)
7. Use PKCE for mobile apps (no client secrets)

---

## Appendix

### OAuth 2.0 Flow Diagram

```
User → SmartPay → Bank Authorization Page
                        ↓
                  User Grants Access
                        ↓
                  Redirect to App
                        ↓
SmartPay ← Authorization Code ← Bank
    ↓
Exchange Code for Tokens
    ↓
Bank → Access Token + Refresh Token
    ↓
SmartPay → API Requests with Access Token
```

### PKCE Flow Diagram

```
1. Generate code_verifier (random)
2. Generate code_challenge = SHA256(code_verifier)
3. Send code_challenge to bank
4. Bank returns authorization code
5. Exchange code + code_verifier for tokens
6. Bank validates: SHA256(code_verifier) == code_challenge
7. Bank returns tokens
```

---

Last Updated: March 17, 2026  
Version: 1.0.0
