# Network Security Policy

**Effective Date:** May 17, 2026  
**Policy Owner:** CTO  
**Review Frequency:** Annual  
**TSC Reference:** CC6.6  
**Approval Required:** Executive Sponsor (CEO/Owner)

---

## 1. Purpose

Protect Hotel Etuna network-facing services from unauthorised access, abuse, and data exfiltration.

## 2. Scope

Public website (`hoteletuna.com`), APIs (`/api/*`), CDN/WAF, database connectivity, and integrations (Adumo, email, AI providers).


## Definitions

| Term | Definition |
|------|------------|
| **Hotel Etuna** | Hub hospitality platform and operating entity |
| **Personnel** | Employees, contractors, and partners with access to Hotel Etuna systems |
| **Production** | Live environment serving guests and partners (Vercel + Neon production branch) |

## 3. Controls

| Layer | Control | Implementation |
|-------|---------|----------------|
| **Edge** | TLS, DDoS mitigation | Vercel + Cloudflare (if enabled) |
| **Application** | Authentication, RBAC | NextAuth, `proxy.ts`, `withApiAuth` |
| **API** | Rate limiting | `RATE_LIMITS` on auth, payments, guest orders |
| **Data** | Tenant isolation | PostgreSQL RLS policies per tenant |
| **Headers** | Security headers | `vercel.json` — X-Frame-Options, X-Content-Type-Options |
| **CORS** | No wildcard on APIs | Preflight PF-06 |
| **Input** | Validation + sanitisation | Zod schemas; `sanitizeHtml` for CMS |

## 4. Segmentation

- **Production** vs **staging** — separate Neon branches/projects and Vercel environments; no production credentials in preview.
- **Tenant** — partners cannot call hub-only routes; enforced in `proxy.ts` and API guards.
- **Payment** — card data never touches application servers (Adumo hosted fields / redirect).

## 5. Monitoring and response

- Review Vercel function logs weekly for 4xx/5xx spikes and auth failures.
- Run `npm run security:preflight` before production deploy.
- Suspected intrusion → Incident Response Plan; preserve logs before TTL expiry.

## 6. Prohibited

- `Access-Control-Allow-Origin: *` on authenticated API routes.
- Debug routes enabled in production (`/api/debug/*` returns 404).
- Opening database port `5432` to public internet.

## 7. Related documents
- [`INFORMATION_SECURITY_POLICY.md`](INFORMATION_SECURITY_POLICY.md)

- [`NAMIBIA_REGULATORY_FRAMEWORK.md`](../NAMIBIA_REGULATORY_FRAMEWORK.md)

- [`POLICY_IMPLEMENTATION_MATRIX.md`](../../../compliance/evidence/policies/POLICY_IMPLEMENTATION_MATRIX.md)

- [`REMOTE_ACCESS_POLICY.md`](REMOTE_ACCESS_POLICY.md)  
- [`LOGGING_AND_MONITORING_POLICY.md`](LOGGING_AND_MONITORING_POLICY.md)  
- [`../SECURITY_PROMPT_PACK.md`](../../SECURITY_PROMPT_PACK.md)

## Exceptions

Exceptions require written approval from the Policy Owner and Executive Sponsor. Document compensating controls in the risk register.

## Enforcement

Violations may result in disciplinary action up to termination and reporting to regulators where required.

## 8. Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.1 | 2026-06-10 | CTO | Template conformance + implementation cross-ref |
| 1.0 | May 17, 2026 | CTO | Initial policy |

**Approved by:** _________________________ Date: _________
