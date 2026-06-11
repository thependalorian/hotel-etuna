# Platform MFA enforcement checklist

**Target completion:** 2026-06-14  
**Owner:** CTO  
**TSC:** CC6.2

---

## Required MFA

| Platform | URL | MFA enforced | Evidence file |
|----------|-----|--------------|---------------|
| Vercel | vercel.com/account | [ ] | `compliance/evidence/2026-06/access/vercel-mfa.png` |
| GitHub org | github.com/orgs/*/settings/security | [ ] | `compliance/evidence/2026-06/access/github-mfa.png` |
| Neon console | console.neon.tech | [ ] | `compliance/evidence/2026-06/access/neon-mfa.png` |
| 1Password (secrets) | — | [ ] | `compliance/evidence/2026-06/access/1password-mfa.png` |
| Stack Auth admin | — | [ ] | Per Stack dashboard |

---

## Steps

1. Enable **required 2FA** for all org members (no exceptions for production deployers).
2. Export screenshot showing org policy + member compliance %.
3. Remove dormant accounts (tie to quarterly access review).
4. Document in monthly evidence pack `2026-MM/access/`.

**Attestation:** CTO confirms completion — date _________
