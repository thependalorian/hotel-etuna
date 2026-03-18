# Node.js Backend Integration Requirements

## Overview

The Python backend security middleware requires the following endpoints in the Node.js backend (running at `http://localhost:4000`).

## Required Endpoints

### 1. 2FA Session Verification

**Endpoint:** `POST /api/auth/verify-2fa-session`

**Purpose:** Verify that user has completed 2FA within the last 5 minutes (PSD-12 Section 12.2)

**Request:**
```typescript
POST http://localhost:4000/api/auth/verify-2fa-session
Headers:
  Authorization: Bearer {jwt_token}
  Content-Type: application/json
Body:
{
  "user_id": "user_123"
}
```

**Response (Success - 200 OK):**
```json
{
  "verified": true,
  "method": "SMS_OTP",  // or "TOTP", "BIOMETRIC"
  "verified_at": "2026-03-18T10:30:00Z",
  "expires_at": "2026-03-18T10:35:00Z"
}
```

**Response (Not Verified - 403 Forbidden):**
```json
{
  "error": "TWO_FACTOR_AUTH_REQUIRED",
  "code": "PSD12_SECTION_12_2_VIOLATION",
  "message": "Two-factor authentication required for this operation",
  "compliance": "PSD-12 Section 12.2 mandates 2FA for EVERY payment"
}
```

**Implementation Notes:**
- Check if user has active 2FA session in Redis/database
- Session should be created after successful 2FA verification
- Session expires after 5 minutes (configurable)
- Return method used (SMS_OTP, TOTP, BIOMETRIC)

**Example Implementation:**
```typescript
router.post('/api/auth/verify-2fa-session', authenticateUser, async (req, res) => {
  const { user_id } = req.body;
  
  // Check 2FA session
  const session = await getTwoFactorSession(user_id);
  
  if (!session || isExpired(session)) {
    return res.status(403).json({
      error: 'TWO_FACTOR_AUTH_REQUIRED',
      code: 'PSD12_SECTION_12_2_VIOLATION',
      message: '2FA verification required',
      compliance: 'PSD-12 Section 12.2 mandates 2FA for EVERY payment'
    });
  }
  
  return res.json({
    verified: true,
    method: session.method,
    verified_at: session.verified_at,
    expires_at: session.expires_at
  });
});
```

---

### 2. Fraud Detection Check

**Endpoint:** `POST /api/fraud/check-payment`

**Purpose:** Real-time fraud risk assessment for payments (PSD-12 Section 11.6)

**Request:**
```typescript
POST http://localhost:4000/api/fraud/check-payment
Headers:
  Content-Type: application/json
Body:
{
  "payment_id": "pay_1234567890",
  "user_id": "user_123",
  "amount": 15000,
  "currency": "NAD",
  "payment_type": "CARD",
  "payment_method": "CARD_NOT_PRESENT",
  
  // Device context
  "device_id": "device_xyz",
  "device_type": "MOBILE",
  "ip_address": "41.182.123.45",
  "user_agent": "SmartPay/1.0 (iOS 17.0)",
  
  // Location (optional)
  "latitude": -22.5609,
  "longitude": 17.0658,
  "country": "NA",
  "city": "Windhoek",
  
  // Card details (optional)
  "card_last_4": "1234",
  "card_bin": "423456",
  "card_type": "DEBIT",
  "is_card_present": false,
  
  // Session context
  "session_id": "session_abc",
  "timestamp": 1710761400
}
```

**Response (200 OK):**
```json
{
  "allowed": true,
  "blocked": false,
  "requiresReview": false,
  "requiresStepUpAuth": false,
  
  "riskScore": 25,
  "riskLevel": "LOW",
  
  "rulesTriggered": [
    {
      "ruleId": "CNP_001",
      "ruleName": "Card-Not-Present High Amount",
      "riskScore": 25,
      "description": "High-value CNP transaction detected"
    }
  ],
  
  "fraudIndicators": ["HIGH_VALUE_CNP_TRANSACTION"],
  "actionTaken": "ALLOWED",
  "blockReason": null
}
```

**Response (Blocked - 200 OK with blocked=true):**
```json
{
  "allowed": false,
  "blocked": true,
  "requiresReview": false,
  "requiresStepUpAuth": false,
  
  "riskScore": 85,
  "riskLevel": "CRITICAL",
  
  "rulesTriggered": [...],
  "fraudIndicators": ["HIGH_VALUE_CNP", "HIGH_VELOCITY", "NEW_DEVICE"],
  "actionTaken": "BLOCKED",
  "blockReason": "Multiple fraud indicators detected - transaction blocked for security"
}
```

**Implementation Notes:**
- Use existing `FraudDetectionService` class
- Call `fraudDetectionService.checkPayment(context)`
- Return complete fraud check result
- Log fraud detection event to database

**Example Implementation:**
```typescript
import { fraudDetectionService } from '../services/FraudDetectionService';

router.post('/api/fraud/check-payment', async (req, res) => {
  try {
    const paymentContext = req.body;
    
    // Run fraud detection
    const fraudCheck = await fraudDetectionService.checkPayment(paymentContext);
    
    return res.json(fraudCheck);
  } catch (error) {
    console.error('Fraud detection error:', error);
    return res.status(500).json({
      error: 'Fraud detection service error',
      message: error.message
    });
  }
});
```

---

### 3. Audit Log Storage

**Endpoint:** `POST /api/audit/log`

**Purpose:** Store audit logs for compliance and security monitoring

**Request:**
```typescript
POST http://localhost:4000/api/audit/log
Headers:
  Content-Type: application/json
Body:
{
  "timestamp": "2026-03-18T10:30:00.000Z",
  "event_type": "PAYMENT_INITIATE",
  "user_id": "user_123",
  "event_data": {
    "operation": "INITIATE",
    "amount": 5000.0,
    "currency": "NAD",
    "payment_id": "pay_123",
    "success": true,
    "fraud_risk_score": 15,
    "twofa_verified": true
  },
  "ip_address": "127.0.0.1",
  "user_agent": "SmartPay/1.0",
  "severity": "INFO",
  "source": "python_backend"
}
```

**Response (200 OK):**
```json
{
  "logged": true,
  "log_id": "log_123456",
  "timestamp": "2026-03-18T10:30:00.000Z"
}
```

**Implementation Notes:**
- Store in `audit_logs` table or similar
- Index by user_id, event_type, timestamp
- Retention: Keep logs for at least 1 year (regulatory requirement)
- Consider partitioning by date for performance

**Example Implementation:**
```typescript
router.post('/api/audit/log', async (req, res) => {
  try {
    const auditEntry = req.body;
    
    // Store in database
    const result = await sql`
      INSERT INTO audit_logs (
        timestamp, event_type, user_id, event_data,
        ip_address, user_agent, severity, source
      ) VALUES (
        ${auditEntry.timestamp},
        ${auditEntry.event_type},
        ${auditEntry.user_id},
        ${JSON.stringify(auditEntry.event_data)},
        ${auditEntry.ip_address},
        ${auditEntry.user_agent},
        ${auditEntry.severity},
        ${auditEntry.source}
      )
      RETURNING id
    `;
    
    return res.json({
      logged: true,
      log_id: result[0].id,
      timestamp: auditEntry.timestamp
    });
  } catch (error) {
    console.error('Audit log error:', error);
    return res.status(500).json({
      error: 'Failed to store audit log'
    });
  }
});
```

---

## Database Schema Requirements

### Audit Logs Table

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type VARCHAR(100) NOT NULL,
  user_id VARCHAR(100),
  event_data JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  severity VARCHAR(20) NOT NULL,
  source VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);

-- Composite index for common queries
CREATE INDEX idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
```

### 2FA Sessions Table (if not exists)

```sql
CREATE TABLE IF NOT EXISTS two_factor_auth_sessions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  method VARCHAR(50) NOT NULL,  -- SMS_OTP, TOTP, BIOMETRIC
  verified_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  device_id VARCHAR(200),
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_2fa_sessions_user_id ON two_factor_auth_sessions(user_id);
CREATE INDEX idx_2fa_sessions_expires_at ON two_factor_auth_sessions(expires_at);
```

---

## Testing the Integration

### Quick Test Script

```bash
#!/bin/bash
# test_integration.sh

echo "Testing Node.js Backend Integration..."

# Test 1: Health check
echo -e "\n[TEST 1] Node.js health check..."
curl -s http://localhost:4000/health | jq .

# Test 2: 2FA verification endpoint
echo -e "\n[TEST 2] 2FA verification endpoint..."
curl -s -X POST http://localhost:4000/api/auth/verify-2fa-session \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test"}' | jq .

# Test 3: Fraud detection endpoint
echo -e "\n[TEST 3] Fraud detection endpoint..."
curl -s -X POST http://localhost:4000/api/fraud/check-payment \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "pay_test",
    "user_id": "user_test",
    "amount": 1000,
    "currency": "NAD"
  }' | jq .

# Test 4: Audit logging endpoint
echo -e "\n[TEST 4] Audit logging endpoint..."
curl -s -X POST http://localhost:4000/api/audit/log \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2026-03-18T10:00:00Z",
    "event_type": "TEST",
    "source": "test_script"
  }' | jq .

echo -e "\n✅ Integration test complete!"
```

---

## Troubleshooting

### Issue: 2FA Endpoint Returns 404

**Solution:** Create endpoint in Node.js backend

```typescript
// File: smartpay/backend/src/routes/auth.ts

import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.post('/api/auth/verify-2fa-session', authenticateUser, async (req, res) => {
  // Implementation here
});

export default router;
```

### Issue: Fraud Detection Not Working

**Solution:** Ensure FraudDetectionService is exported and endpoint created

```typescript
// File: smartpay/backend/src/routes/fraud.ts

import { Router } from 'express';
import { fraudDetectionService } from '../services/FraudDetectionService';

const router = Router();

router.post('/api/fraud/check-payment', async (req, res) => {
  const result = await fraudDetectionService.checkPayment(req.body);
  return res.json(result);
});

export default router;
```

### Issue: Audit Logs Not Storing

**Solution:** Create audit log endpoint and database table

```typescript
// File: smartpay/backend/src/routes/audit.ts

import { Router } from 'express';
import { sql } from '../lib/db';

const router = Router();

router.post('/api/audit/log', async (req, res) => {
  const entry = req.body;
  
  await sql`
    INSERT INTO audit_logs (
      timestamp, event_type, user_id, event_data,
      ip_address, user_agent, severity, source
    ) VALUES (
      ${entry.timestamp},
      ${entry.event_type},
      ${entry.user_id},
      ${JSON.stringify(entry.event_data)},
      ${entry.ip_address},
      ${entry.user_agent},
      ${entry.severity},
      ${entry.source}
    )
  `;
  
  return res.json({ logged: true });
});

export default router;
```

---

## Validation Checklist

Before declaring integration complete:

- [ ] Node.js backend is running
- [ ] All 3 endpoints return non-404 status
- [ ] 2FA verification endpoint works with valid/invalid sessions
- [ ] Fraud detection returns risk scores
- [ ] Audit logs are stored in database
- [ ] Python backend can successfully call all endpoints
- [ ] Error handling works (timeouts, errors)
- [ ] Security tests pass

---

## Support

If endpoints are missing, create them in Node.js backend following the specifications above.

For questions:
- Backend Team: dev@smartpay.na
- Security Team: security@smartpay.na
