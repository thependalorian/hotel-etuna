---
name: system-security
description: This skill should be used when implementing authentication, authorization, API security, or securing systems. It provides guidance on authentication methods (JWT, OAuth 2.0), authorization models (RBAC, ABAC, ACL), and API security techniques (rate limiting, CORS, injection prevention).
---

# System Security

This skill provides comprehensive guidance on securing systems, from authentication and authorization to API security techniques.

## When to Use This Skill

Use this skill when:
- Implementing authentication systems
- Designing authorization models
- Securing API endpoints
- Preventing common security vulnerabilities
- Implementing rate limiting
- Configuring CORS
- Protecting against SQL/NoSQL injection

## Authentication

> *"Authentication answers: WHO is the user?"*

### Authentication Types

#### 1. Basic Authentication
```
Authorization: Basic base64(username:password)
```
- ⚠️ Easily reversible
- ⚠️ Only use with HTTPS
- Rarely used in production

#### 2. Bearer Tokens
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```
- ✅ Standard approach
- ✅ Stateless
- ✅ Scalable

#### 3. OAuth 2.0 + JWT

```
┌────────┐      ┌────────┐      ┌────────┐
│  User  │──1──►│  App   │──2──►│ Google │
└────────┘      └────────┘      └────────┘
                    ▲               │
                    └───── 3 ───────┘
                       (JWT Token)
```

**JWT Payload:**
```json
{
  "user_id": "123",
  "email": "user@example.com",
  "exp": 1699900000,
  "iat": 1699800000
}
```

#### 4. Access + Refresh Tokens

```
Access Token:  Short-lived (15 min) - Used for API calls
Refresh Token: Long-lived (7 days) - Used to get new access tokens
```

**Flow:**
```
1. Login → Get both tokens
2. Use access token for requests
3. Access token expires
4. Use refresh token to get new access token
5. Continue without re-login!
```

#### 5. Single Sign-On (SSO)

Login once, access multiple services:
```
Google Login → Gmail ✓
            → Drive ✓
            → Calendar ✓
```

**Protocols:**
- **OAuth 2.0** - Modern, JSON-based
- **SAML** - XML-based, legacy/enterprise systems

## Authorization

> *"Authorization answers: WHAT can the user do?"*

### Authorization Models

#### 1. Role-Based Access Control (RBAC)
Most common approach:

```
Admin    → Create, Read, Update, Delete, Manage Users
Editor   → Create, Read, Update
Viewer   → Read only
```

**Example (GitHub):**
| Role | Permissions |
|------|-------------|
| Admin | Full control, delete repo |
| Write | Push code, create PRs |
| Read | View code only |

#### 2. Attribute-Based Access Control (ABAC)

More flexible, uses attributes:
```python
allow_access if:
    user.department == "HR" AND
    resource.classification == "internal" AND
    environment.time_of_day == "business_hours"
```

**Attributes:**
- User: department, role, clearance level
- Resource: owner, classification, sensitivity
- Environment: time, location, device

#### 3. Access Control Lists (ACL)

Per-resource permissions:
```json
{
  "document_id": "doc123",
  "permissions": [
    {"user": "alice", "access": "read"},
    {"user": "bob", "access": "read,write"},
    {"user": "charlie", "access": "none"}
  ]
}
```

**Example:** Google Docs sharing

## API Security Techniques

### 1. Rate Limiting
Prevent abuse and DDoS:
```
User A: 100 requests/minute allowed
User A: 101st request → BLOCKED (429 Too Many Requests)
```

**Levels:**
- Per endpoint
- Per user/IP
- Global system limit

**Implementation:**
```typescript
// Using Redis for rate limiting
const key = `rate_limit:${userId}:${endpoint}`;
const count = await redis.incr(key);
if (count === 1) {
  await redis.expire(key, 60); // 1 minute window
}
if (count > 100) {
  return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

### 2. CORS (Cross-Origin Resource Sharing)
Control which domains can call your API:
```
✅ Allowed: requests from app.yourdomain.com
❌ Blocked: requests from evil.com
```

**Configuration:**
```typescript
// Next.js API route example
export async function GET(request: Request) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Access-Control-Allow-Origin': 'https://app.yourdomain.com',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

### 3. SQL/NoSQL Injection Prevention

**VULNERABLE:**
```sql
-- ❌ UNSAFE
SELECT * FROM users WHERE name = '$userInput'
-- Attacker inputs: ' OR '1'='1
```

**SAFE: Use parameterized queries**
```typescript
// ✅ SAFE: Parameterized query
const result = await sql`
  SELECT * FROM users 
  WHERE email = ${userEmail} AND status = ${status}
`;

// ❌ UNSAFE: String concatenation
const result = await sql.unsafe(
  `SELECT * FROM users WHERE email = '${userEmail}'`
);
```

**NoSQL Injection Prevention:**
```typescript
// ✅ SAFE: Use parameterized queries
const user = await db.collection('users').findOne({
  email: userEmail, // Direct value, not string interpolation
  status: status
});

// ❌ UNSAFE: String interpolation
const query = `{"email": "${userEmail}"}`;
const user = await db.collection('users').findOne(JSON.parse(query));
```

### 4. Firewalls (WAF)
```
Internet → WAF → API
              │
              └── Blocks suspicious patterns:
                  - SQL keywords
                  - Strange HTTP methods
                  - Known attack signatures
```

### 5. VPN for Private APIs
```
Public Internet          │          Private Network (VPN)
                         │
External User ────X──────│──────── Internal API
                         │
Internal User ──────────►│────────► Internal API ✓
```

### 6. CSRF Protection
Prevent unauthorized actions from user's browser:
```
Request must include:
✓ Session cookie
✓ CSRF token (proves request came from your site)
```

**Implementation:**
```typescript
// Generate CSRF token
const csrfToken = crypto.randomBytes(32).toString('hex');
await redis.set(`csrf:${sessionId}`, csrfToken, 'EX', 3600);

// Validate CSRF token
const token = request.headers.get('X-CSRF-Token');
const storedToken = await redis.get(`csrf:${sessionId}`);
if (token !== storedToken) {
  return Response.json({ error: 'Invalid CSRF token' }, { status: 403 });
}
```

### 7. XSS Prevention
Sanitize user input to prevent script injection:
```html
<!-- User input: <script>stealCookies()</script> -->
<!-- Display as text, not HTML -->
&lt;script&gt;stealCookies()&lt;/script&gt;
```

**Implementation:**
```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize user input
const sanitized = DOMPurify.sanitize(userInput);
```

## Security Best Practices Checklist

When securing a system, ensure:

- [ ] All API endpoints use HTTPS
- [ ] Authentication implemented (JWT, OAuth 2.0)
- [ ] Authorization implemented (RBAC, ABAC, or ACL)
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Parameterized queries used (prevent injection)
- [ ] Input validation on all endpoints
- [ ] CSRF protection for state-changing operations
- [ ] XSS prevention (sanitize user input)
- [ ] Error messages don't leak sensitive information
- [ ] Secrets stored in environment variables
- [ ] Regular security audits

## Common Vulnerabilities to Avoid

### 1. SQL Injection
- ❌ String concatenation in queries
- ✅ Always use parameterized queries

### 2. NoSQL Injection
- ❌ String interpolation in queries
- ✅ Use parameterized queries or ORM

### 3. XSS (Cross-Site Scripting)
- ❌ Render user input as HTML
- ✅ Sanitize or escape user input

### 4. CSRF (Cross-Site Request Forgery)
- ❌ No CSRF protection
- ✅ Use CSRF tokens

### 5. Broken Authentication
- ❌ Weak passwords, no rate limiting
- ✅ Strong password requirements, rate limiting

### 6. Sensitive Data Exposure
- ❌ Secrets in code, unencrypted data
- ✅ Environment variables, encryption at rest and in transit

## Reference Material

For detailed examples and explanations, refer to:
- `../system-design-master/references/SYSTEM_DESIGN_MASTER_GUIDE.md` - Part 6: Security section
