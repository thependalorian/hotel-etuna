# Password Policy

**Effective Date:** May 17, 2026  
**Policy Owner:** CTO  
**Review Frequency:** Annual  
**TSC Reference:** CC6.1  
**Approval Required:** Executive Sponsor (CEO/Owner)

---

## 1. Purpose

Set minimum requirements for user and administrator passwords and authentication factors for Hotel Etuna systems.

## 2. Scope

All accounts on production, staging, and staff tools (GitHub, Vercel, Neon, 1Password, Google Workspace, admin dashboard).


## Definitions

| Term | Definition |
|------|------------|
| **Hotel Etuna** | Hub hospitality platform and operating entity |
| **Personnel** | Employees, contractors, and partners with access to Hotel Etuna systems |
| **Production** | Live environment serving guests and partners (Vercel + Neon production branch) |

## 3. Password requirements

| Requirement | Standard |
|-------------|----------|
| Minimum length | 12 characters |
| Complexity | At least 3 of: upper, lower, digit, symbol |
| Reuse | Must not match last 5 passwords |
| Default passwords | Must be changed on first login |
| Sharing | Prohibited |
| Storage | Hashed with bcrypt (cost ≥12); never logged or returned in API errors |

Guest self-registration SHALL enforce the same rules via `lib/auth/password-validation.ts` (Turnstile on register where configured).

## 4. Account protection

- **Lockout** — 5 failed attempts → 15-minute lockout (or equivalent rate limit).
- **MFA** — Required for: platform admin, owner/manager roles, payment configuration, production Vercel/Neon/GitHub.
- **Session** — 30-minute idle timeout, 8-hour absolute maximum (`SessionTimeoutWrapper`).
- **Service accounts** — Long random secrets (32+ chars); stored only in Vercel env; rotated on compromise.

## 5. Password reset

- Reset links expire within 1 hour, single use.
- Reset SHALL verify email ownership; suspicious resets logged to `audit_trail`.

## 6. Related documents
- [`INFORMATION_SECURITY_POLICY.md`](INFORMATION_SECURITY_POLICY.md)

- [`NAMIBIA_REGULATORY_FRAMEWORK.md`](../NAMIBIA_REGULATORY_FRAMEWORK.md)

- [`POLICY_IMPLEMENTATION_MATRIX.md`](../../../compliance/evidence/policies/POLICY_IMPLEMENTATION_MATRIX.md)

- [`ACCESS_CONTROL_POLICY.md`](ACCESS_CONTROL_POLICY.md)  
- [`CRYPTOGRAPHY_POLICY.md`](CRYPTOGRAPHY_POLICY.md)  
- [`ACCEPTABLE_USE_POLICY.md`](ACCEPTABLE_USE_POLICY.md)

## Exceptions

Exceptions require written approval from the Policy Owner and Executive Sponsor. Document compensating controls in the risk register.

## Enforcement

Violations may result in disciplinary action up to termination and reporting to regulators where required.

## 7. Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.1 | 2026-06-10 | CTO | Template conformance + implementation cross-ref |
| 1.0 | May 17, 2026 | CTO | Initial policy; aligned with app validation |

**Approved by:** _________________________ Date: _________
