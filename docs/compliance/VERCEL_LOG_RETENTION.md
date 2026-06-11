# Vercel log retention & export

**Owner:** CTO  
**Policy:** `LOGGING_AND_MONITORING_POLICY.md`  
**TSC:** CC7.1

---

## Minimum operating standard

1. **Runtime logs:** Vercel dashboard retention (plan-dependent); export weekly summary to `compliance/evidence/log-reviews/`.
2. **Long-term archive (90 days):** Configure **Log Drain** to durable store when Type II observation begins.

---

## Log Drain setup (optional — recommended Aug 2026)

1. Vercel project → Settings → Log Drains → Add drain.
2. Destination: Neon `system_logs` table, S3-compatible bucket, or Grafana Loki (org choice).
3. Filter: production environment only; exclude health-check noise.
4. Document drain URL in 1Password; never commit credentials.

---

## Weekly manual export (until drain live)

```bash
# Export from Vercel CLI (requires VERCEL_TOKEN)
vercel logs <deployment-url> --since 7d > compliance/evidence/log-reviews/vercel-raw-$(date +%F).txt
```

Redact guest PII before filing. Reference in weekly log review note.

---

## Evidence

- Weekly reviews: `compliance/evidence/log-reviews/YYYY-MM-DD.md`
- Monthly pack includes latest review reference in `manifest.json`
