# SmartPay Mobile - API Integration Summary

**Date**: March 17, 2026  
**Status**: ✅ Complete - All services migrated to real backend endpoints

## Overview

All mobile services have been updated to use real API endpoints from the SmartPay backend (Node.js/Express). The integration includes:

- Centralized API client with interceptors
- Comprehensive TypeScript types
- JWT authentication with token refresh
- Proper error handling and retry logic
- Network status monitoring
- Development mode fallbacks

## Core Infrastructure

### 1. API Client (`services/api.ts`)

**Features:**
- Axios-based HTTP client with 30-second timeout
- Base URL from `EXPO_PUBLIC_API_BASE_URL`
- Automatic JWT token injection
- Token refresh on 401 errors
- Request/response logging in development
- Exponential backoff retry logic
- Network connectivity checks

**Interceptors:**
- **Request**: Adds JWT token, request ID, network check
- **Response**: Handles 401 (token refresh), 429 (rate limit), 400 (validation)

**Error Types:**
- `NetworkError` - No internet connection
- `UnauthorizedError` - 401, redirects to sign-in
- `RateLimitError` - 429, includes retry-after
- `ValidationError` - 400, includes field details

### 2. TypeScript Types (`types/api.ts`)

All API request/response types defined:
- Auth types (OTP, tokens, logout)
- User profile types
- Wallet types (CRUD operations)
- Transaction types (all transaction types)
- Send money types
- Cash out types (5 methods)
- KYC types
- Voucher types (3 redemption methods)
- Loan types (eligibility, application)
- Group types (members, splits)
- Proof of Life types
- Notification types

## API Endpoint Mappings

### Authentication (`services/auth.ts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/request-otp` | Request OTP for phone authentication |
| POST | `/api/v1/auth/verify-otp` | Verify OTP and get JWT tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Revoke tokens and sign out |

**Features:**
- OTP sent via SMS/email/both
- JWT tokens (access + refresh)
- Auto-create user on verify if not exists
- Test mode support (OTP: 123456)

### User Profile (`services/profile.ts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/mobile/user/profile` | Get user profile with Proof of Life status |
| PATCH | `/api/v1/mobile/user/profile` | Update firstName, lastName, photoUrl |
| POST | `/api/v1/mobile/user/proof-of-life` | Start Proof of Life verification |
| POST | `/api/v1/mobile/user/proof-of-life/verify` | Complete verification (SMS/biometric) |

**Features:**
- Profile includes KYC tier, credit score, wallet count
- Proof of Life status tracking (current/due_soon/overdue)
- 4 verification methods: SMS, biometric, agent, auto

### Wallets (`services/wallets.ts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/mobile/wallets` | List all user wallets |
| GET | `/api/v1/mobile/wallets/:id` | Get wallet details |
| POST | `/api/v1/mobile/wallets` | Create new wallet (max 10 per user) |
| PATCH | `/api/v1/mobile/wallets/:id` | Update wallet name/icon/color |
| DELETE | `/api/v1/mobile/wallets/:id` | Archive wallet (must have 0 balance) |

**Features:**
- 7 wallet types: main, savings, bills, emergency, travel, shopping, custom
- Balance tracking per currency
- Frozen/active status
- Icon and color customization

### Transactions (`services/transactions.ts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/mobile/transactions` | List transactions (sent + received) |
| GET | `/api/v1/mobile/transactions/:id` | Get transaction details |

**Query Parameters:**
- `limit` - Max results (default: 50, max: 100)
- `offset` - Pagination offset
- `walletId` - Filter by wallet
- `startDate` / `endDate` - Date range filter

**Transaction Types:**
- `p2p_transfer` - Person to person
- `cashout_bank` / `cashout_till` / `cashout_agent` / `cashout_merchant` / `cashout_atm`
- `voucher_redemption` / `voucher_redemption_nampost` / `voucher_redemption_smartpay`
- `loan_disbursement` / `loan_repayment`
- `split_payment` / `group_contribution`

### Send Money (`services/send.ts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/mobile/send-money` | P2P transfer to phone or walletId |

**Request:**
```json
{
  "amount": 100.00,
  "beneficiaryPhone": "+264811234567",
  "beneficiaryId": "wallet-uuid",
  "sourceWalletId": "wallet-uuid",
  "note": "Optional description"
}
```

**Features:**
- PSD-3 compliant limits (daily/monthly)
- PSD-10 fee calculation
- Buffr AI fraud detection (optional)
- Atomic transactions
- ETA §32 audit logging

### Receive Money (`services/receive.ts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| Client-side | N/A | Generate NAMQR for receiving money |

**Note:** NAMQR generation is handled **client-side** using the user's SmartPay ID from their profile. No backend API call is required.

**Features:**
- Uses `utils/namqr.ts` for NAMQR v5.0 generation
- Fetches SmartPay ID from user profile
- Generates EMV-compliant QR code
- Optional amount encoding
- Deep link generation for sharing
- QR validation before sending
- User lookup by SmartPay ID

**Functions:**
- `generateReceiveQR()` - Create QR for receiving money
- `validateReceiveQR()` - Parse and validate scanned QR
- `generatePaymentRequest()` - Create backend payment request (optional)

### Cash Out (`services/cashOut.ts`)

5 cash-out methods supported:

#### 1. Bank Transfer
- **Endpoint:** `POST /api/v1/mobile/cash-out/bank`
- **Processing:** 1-2 business days
- **Requires:** `bankAccount`, `bankCode`

#### 2. Till (Offline Code)
- **Endpoint:** `POST /api/v1/mobile/cash-out/till`
- **Processing:** Instant
- **Returns:** 6-digit offline code (24h expiry)

#### 3. Agent (QR Code)
- **Endpoint:** `POST /api/v1/mobile/cash-out/agent`
- **Processing:** Instant
- **Returns:** Signed QR code (1h expiry)

#### 4. Merchant POS
- **Endpoint:** `POST /api/v1/mobile/cash-out/merchant`
- **Processing:** Instant
- **Returns:** Auth code (30min expiry)

#### 5. ATM (NAMQR)
- **Endpoint:** `POST /api/v1/mobile/cash-out/atm`
- **Processing:** Instant
- **Returns:** NAMQR code (15min expiry)

### KYC (`services/kyc.ts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/kyc/status` | Get KYC tier and verification status |
| POST | `/api/v1/kyc/submit` | Submit KYC documents for tier upgrade |

**KYC Tiers:**
- `basic` - Default, limited transactions
- `standard` - After document submission
- `enhanced` - After full verification

**Required Fields:**
- `fullName` - As on ID
- `idNumber` - National ID or passport number
- `idType` - "national_id" or "passport"
- `dateOfBirth` - YYYY-MM-DD format
- `address` - Optional residential address

### Vouchers (`services/vouchers.ts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/mobile/vouchers` | List user's vouchers |
| GET | `/api/v1/mobile/vouchers/:id` | Get voucher details |
| POST | `/api/v1/mobile/vouchers/:id/redeem` | Redeem to wallet |
| POST | `/api/v1/mobile/vouchers/:id/redeem-nampost` | Generate NamPost collection code |
| POST | `/api/v1/mobile/vouchers/:id/redeem-smartpay` | Generate SmartPay agent collection code |

**Redemption Methods:**
1. **Wallet** - Instant credit to user wallet
2. **NamPost** - Collection code (7 days validity)
3. **SmartPay Agent** - Collection code (48 hours validity)

### Loans (`services/loans.ts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/mobile/loans/eligibility` | Check loan eligibility and get offer |
| POST | `/api/v1/mobile/loans/apply` | Apply for loan |
| GET | `/api/v1/mobile/loans` | Get loan history |

**Features:**
- Voucher-backed micro-loans
- Max 70% of expected voucher value
- Dynamic interest rates (2-15% based on KYC/credit score)
- Auto-repayment when voucher received
- Buffr AI credit assessment (optional)

### Groups (`services/groups.ts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/mobile/groups` | List user's groups |
| GET | `/api/v1/mobile/groups/:groupId` | Get group details with members |
| POST | `/api/v1/mobile/groups` | Create new group |
| POST | `/api/v1/mobile/groups/:groupId/members` | Invite member |
| POST | `/api/v1/mobile/groups/:groupId/join` | Accept invitation |
| DELETE | `/api/v1/mobile/groups/:groupId/members/:memberId` | Remove member |
| POST | `/api/v1/mobile/groups/:groupId/split` | Create split bill |
| POST | `/api/v1/mobile/groups/:groupId/splits/:splitId/pay` | Pay split share |
| POST | `/api/v1/mobile/groups/:groupId/splits/:splitId/remind` | Send payment reminder |
| DELETE | `/api/v1/mobile/groups/:groupId` | Delete group |

**Features:**
- Savings circles with shared wallet
- Split bills (equal or custom amounts)
- Member roles: admin, treasurer, member
- Payment tracking per member
- Reminder notifications

### Invite/Referral (`services/invite.ts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/mobile/invite/validate?code=XXX` | Validate referral code |
| POST | `/api/v1/mobile/invite/register` | Register with invite code |
| GET | `/api/v1/mobile/invite/me` | Get my referral code and stats |
| GET | `/api/v1/mobile/invite/referrals` | List my referrals |
| GET | `/api/v1/mobile/invite/leaderboard` | Get top referrers leaderboard |

**Features:**
- Unique invite codes per user
- Deep linking support
- Referral tracking and analytics
- Rewards system ready
- Public leaderboard

### Agents (`services/agents.ts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/mobile/agents/nearest` | Find nearest agents by GPS |
| GET | `/api/v1/mobile/agents/:agentCode` | Get agent details by code |
| GET | `/api/v1/mobile/agents/region/:region` | Get agents by region |

**Query Parameters (nearest):**
- `lat` / `lng` - GPS coordinates (required)
- `service` - Filter: cashout, voucher, ewallet, namqr, all
- `limit` - Max results (default: 5, max: 50)

**Features:**
- Haversine distance calculation
- Multiple agent types: NamPost, bank, retail, ATM, mobile
- Service capability flags
- Operating hours
- Distance in kilometers

### Incidents (`services/incidents.ts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/mobile/incidents` | Create incident report |
| GET | `/api/v1/mobile/incidents` | List user's incidents |
| GET | `/api/v1/mobile/incidents/:id` | Get incident details |

**Incident Types:**
- Transaction failure
- Fraud report
- Technical issue
- Account access
- Payment dispute
- Service complaint

**Compliance:** PSD-12 compliant incident tracking

### Notifications (`services/notifications.ts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/mobile/notifications` | Get user notifications |
| PATCH | `/api/v1/mobile/notifications/:id/read` | Mark as read |
| POST | `/api/v1/mobile/notifications/mark-all-read` | Mark all as read |
| DELETE | `/api/v1/mobile/notifications/:id` | Delete notification |

**Note:** Backend implementation pending, service ready for integration.

### Two-Factor Auth (`services/twoFactorAuth.ts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/users/pin` | Set/update PIN |
| POST | `/api/v1/users/verify-pin` | Verify PIN |

**Local Features:**
- Client-side PIN hashing (SHA-256)
- Biometric authentication (Face ID/Touch ID)
- Failed attempt tracking (3 = temp lock, 5 = permanent)
- 60-second 2FA tokens
- Security event logging
- Optional backend PIN sync for server-side verification

## Environment Configuration

### Development
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
```

### Staging
```env
EXPO_PUBLIC_API_BASE_URL=https://staging-api.smartpay.na
```

### Production
```env
EXPO_PUBLIC_API_BASE_URL=https://api.smartpay.na
```

## Error Handling Strategy

### Network Errors
- **Detection:** `@react-native-community/netinfo`
- **Action:** Show offline banner, queue requests
- **Retry:** Exponential backoff (1s, 2s, 4s)

### 401 Unauthorized
- **Detection:** Response status 401
- **Action:** 
  1. Attempt token refresh with refresh token
  2. If refresh fails, clear session
  3. Redirect to sign-in screen
- **Queue:** Pending requests retry with new token

### 429 Rate Limited
- **Detection:** Response status 429
- **Action:** Show rate limit message
- **Retry After:** Parse from `Retry-After` header

### 400 Validation Errors
- **Detection:** Response status 400
- **Action:** Show inline field errors
- **Details:** Extract from `error.details`

### 500 Server Errors
- **Detection:** Response status 500
- **Action:** Show generic error with retry button
- **Logging:** Log to error tracking service

## Security Features

### JWT Token Management
- **Storage:** expo-secure-store (encrypted)
- **Keys:** `smartpay_access_token`, `smartpay_refresh_token`
- **Expiry:** 4 hours for access token
- **Refresh:** Automatic on 401 errors
- **Revocation:** On logout or security events

### Request Security
- Request IDs for tracing
- Device fingerprinting (via headers)
- IP address tracking (server-side)
- Session ID management
- Idempotency keys for financial operations

### Data Validation
- Zod schemas on backend
- TypeScript types on frontend
- Input sanitization
- SQL injection prevention (parameterized queries)

## Rate Limiting

Backend applies rate limits per endpoint:

- **Strict:** 10 requests/minute (financial operations)
- **Moderate:** 30 requests/minute (reads)
- **Lenient:** 100 requests/minute (public endpoints)

Client handles 429 errors gracefully with retry-after.

## Testing Strategy

### Development Mode Features
- Mock data fallbacks when API unavailable
- Test user credentials from `.env`
- OTP code 123456 for test phone
- Request/response logging
- Network simulation

### Test User Configuration
```env
EXPO_PUBLIC_TEST_USER_PHONE=+264811234567
EXPO_PUBLIC_TEST_USER_FIRST_NAME=Pendapala
EXPO_PUBLIC_TEST_USER_LAST_NAME=Nekulilo
TEST_USER_EMAIL=pendanek@gmail.com
```

## Migration Checklist

✅ **Phase 1: Core Infrastructure**
- [x] Create `services/api.ts` with axios client
- [x] Create `types/api.ts` with all response types
- [x] Install axios and configure interceptors
- [x] Implement token refresh logic
- [x] Add network status monitoring

✅ **Phase 2: Service Updates**
- [x] Update `services/auth.ts` - OTP auth flow
- [x] Update `services/profile.ts` - User profile + Proof of Life
- [x] Update `services/wallets.ts` - Wallet CRUD
- [x] Update `services/transactions.ts` - Transaction history
- [x] Update `services/send.ts` - P2P transfers
- [x] Create `services/receive.ts` - NAMQR generation for receiving money
- [x] Update `services/cashOut.ts` - 5 cash-out methods
- [x] Update `services/kyc.ts` - KYC verification
- [x] Create `services/vouchers.ts` - Voucher redemption
- [x] Create `services/loans.ts` - Loan operations
- [x] Update `services/groups.ts` - Groups and splits
- [x] Create `services/invite.ts` - Referral system
- [x] Create `services/agents.ts` - Agent finder
- [x] Create `services/incidents.ts` - Incident reporting
- [x] Create `services/notifications.ts` - Push notifications
- [x] Update `services/twoFactorAuth.ts` - PIN backend sync
- [x] Create `services/index.ts` - Central export for all services

✅ **Phase 3: Error Handling**
- [x] Request interceptor with auth token
- [x] Response interceptor with error handling
- [x] Token refresh queue to prevent race conditions
- [x] Exponential backoff retry logic
- [x] Network error detection and handling
- [x] Validation error parsing
- [x] Rate limit handling with retry-after

✅ **Phase 4: TypeScript Types**
- [x] Common types (ApiResponse, ApiError, Paginated)
- [x] Auth types (OTP, tokens, logout)
- [x] User types (profile, proof of life)
- [x] Wallet types (CRUD)
- [x] Transaction types (all types)
- [x] Payment types (send money, cash out)
- [x] KYC types
- [x] Voucher types
- [x] Loan types
- [x] Group types
- [x] Notification types

## Backend API Health Check

**Endpoint:** `GET /api/v1/mobile/health`

**Response:**
```json
{
  "status": "ok",
  "service": "smartpay-mobile-api",
  "version": "1.0.0",
  "timestamp": "2026-03-17T13:00:00.000Z",
  "endpoints": {
    "sendMoney": "/api/v1/mobile/send-money",
    "cashOut": { ... },
    "vouchers": { ... },
    "loans": { ... },
    "groups": { ... },
    "invite": { ... },
    "proofOfLife": { ... },
    "incidents": { ... },
    "agents": { ... },
    "wallets": "/api/v1/mobile/wallets",
    "transactions": "/api/v1/mobile/transactions"
  }
}
```

## Next Steps

### Optional Enhancements
1. **Offline Queue** - Queue requests when offline, sync when online
2. **Request Caching** - Cache GET requests with TTL
3. **Optimistic Updates** - Update UI before server confirmation
4. **WebSocket** - Real-time updates for transactions
5. **GraphQL** - Consider GraphQL for complex queries
6. **Analytics** - Track API performance and errors
7. **Error Reporting** - Integrate Sentry/Bugsnag
8. **Push Notifications** - FCM integration for real-time alerts

### Backend Tasks
- Implement `/api/v1/mobile/notifications` endpoints
- Add WebSocket support for real-time updates
- Implement request idempotency for all financial endpoints
- Add rate limiting per user (not just IP)
- Implement comprehensive audit logging
- Add API versioning support

## Support

For API issues or questions:
- Backend repo: `/fintech/smartpay/backend`
- API docs: See route files in `/backend/src/routes/mobile/`
- Health check: `GET /api/v1/mobile/health`

---

**Updated:** March 17, 2026  
**Maintained by:** SmartPay Mobile Team
