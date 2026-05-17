# Remote Access Policy

**Effective Date:** May 17, 2026  
**Policy Owner:** CTO  
**Review Frequency:** Annual  
**TSC Reference:** CC6.6  
**Approval Required:** Executive Sponsor (CEO/Owner)

---

## 1. Purpose

Secure remote access to Hotel Etuna systems for distributed staff and contractors.

## 2. Scope

Remote work, home networks, administrative access to Vercel/Neon/GitHub, and partner remote connections to APIs.

## 3. Architecture note

Hotel Etuna operates a **serverless** stack (Vercel + Neon). There is no corporate VPN to production; access is via HTTPS admin UI and authenticated APIs with MFA on privileged accounts.

## 4. Requirements

### 4.1 Administrative access

- Production admin SHALL use MFA-enabled accounts only.
- Access from shared or public computers is prohibited for admin/payment functions.
- `proxy.ts` RBAC enforces role boundaries; platform admin actions logged.

### 4.2 Home / remote network

- Wi-Fi SHALL use WPA2/WPA3 with strong passphrase; router firmware kept current.
- Workstations SHALL run supported OS with automatic security updates enabled.
- Full-disk encryption required on devices accessing Confidential data.

### 4.3 Contractor / partner access

- Time-limited accounts; minimum role; revoked within 24 hours of contract end.
- API keys scoped to tenant; no hub-wide partner keys unless approved.

### 4.4 Redis / rate limiting

- Production guest registration and sensitive endpoints: `RATE_LIMIT_REDIS_REQUIRED=true` when Redis URL configured (fail-closed per security hardening).

## 5. Prohibited

- Exposing admin panels to the internet without authentication.
- SSH tunnels to production database except emergency break-glass with CTO approval and audit log.
- Disabling MFA for convenience.

## 6. Related documents

- [`NETWORK_SECURITY_POLICY.md`](NETWORK_SECURITY_POLICY.md)  
- [`ACCESS_CONTROL_POLICY.md`](ACCESS_CONTROL_POLICY.md)

## 7. Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 17, 2026 | CTO | Initial policy (serverless model) |

**Approved by:** _________________________ Date: _________
