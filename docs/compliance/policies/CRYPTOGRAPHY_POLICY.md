# Cryptography Policy

**Effective Date:** May 17, 2026  
**Policy Owner:** CTO  
**Review Frequency:** Annual  
**TSC Reference:** CC6.7  
**Approval Required:** Executive Sponsor (CEO/Owner)

---

## 1. Purpose

Define approved cryptographic controls for protecting data in transit and at rest across Hotel Etuna systems.

## 2. Scope

All application layers, databases, backups, APIs, and third-party integrations handling Confidential or Restricted data.

## 3. Approved standards

| Use case | Minimum standard | Implementation |
|----------|------------------|----------------|
| **HTTPS / APIs** | TLS 1.2+ (prefer 1.3) | Vercel edge TLS |
| **Database at rest** | AES-256 | Neon default encryption |
| **Passwords** | Bcrypt cost ≥12 | NextAuth / auth module |
| **Session tokens** | Signed, HTTP-only cookies | NextAuth configuration |
| **Secrets at rest** | Platform KMS / encrypted env | Vercel encrypted environment variables |
| **Backups** | Provider-managed encryption | Neon PITR / backups |
| **PII in exports** | Encrypted archive (AES-256) if emailed | 7-Zip/password via separate channel |

## 4. Prohibited practices

- MD5, SHA-1, DES, 3DES, RC4 for security purposes.
- Custom or home-grown encryption algorithms.
- Hardcoding keys, passwords, or API tokens in source code (enforced by preflight PF-02).
- Storing full PAN or CVV (PCI DSS violation); tokenisation via Adumo only.

## 5. Key management

- **Generation** — use cryptographically secure random generators (`crypto.randomBytes` or platform defaults).
- **Storage** — Restricted classification; 1Password team vault + Vercel production env; separate staging keys.
- **Rotation** — API keys and DB passwords rotated within 24 hours of staff departure or suspected compromise; annual rotation for long-lived integration keys unless vendor supports automatic rotation.
- **Distribution** — never via Slack/email; use 1Password share or Vercel team access.

## 6. Exceptions

Legacy algorithms required by an external system require written CTO approval, compensating controls, and expiry date in risk register.

## 7. Related documents

- [`PASSWORD_POLICY.md`](PASSWORD_POLICY.md)  
- [`INFORMATION_SECURITY_POLICY.md`](INFORMATION_SECURITY_POLICY.md) §4.4  
- [`VENDOR_MANAGEMENT_POLICY.md`](VENDOR_MANAGEMENT_POLICY.md)

## 8. Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 17, 2026 | CTO | Initial policy |

**Approved by:** _________________________ Date: _________
