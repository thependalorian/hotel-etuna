# OpenWA on Railway — Hotel Etuna

OpenWA is the **self-hosted WhatsApp gateway** used alongside Meta Cloud API. Hotel Etuna (Vercel) receives webhooks and calls OpenWA over HTTPS for outbound replies.

**Upstream:** https://github.com/rmyndharis/OpenWA

## Architecture

| Component | Host | Role |
|-----------|------|------|
| OpenWA API | Railway (Docker) | Persistent WhatsApp Web session, REST + webhooks |
| Hotel Etuna | Vercel | Sofia AI, `/api/webhooks/openwa`, Communications hub |

## Railway deploy

1. **New Railway project** → Deploy from GitHub repo `rmyndharis/OpenWA` (Dockerfile).
2. **Add PostgreSQL** plugin (recommended over SQLite for session persistence).
3. **Set environment variables** (see upstream `.env.example`):
   - `API_KEY` — strong random key (same value as Vercel `OPENWA_API_KEY`)
   - `DATABASE_URL` — Railway Postgres connection string
   - `PORT=2785` (if not defaulted by image)
4. **Public domain** — e.g. `https://openwa-production.up.railway.app`
5. **Dashboard** — port `2886` if exposed; restrict by IP or Railway private networking in production.

## Vercel environment

```bash
OPENWA_ENABLED=true
OPENWA_API_URL=https://openwa-production.up.railway.app
OPENWA_API_KEY=<same-as-railway-API_KEY>
```

Per-tenant overrides live in `tenant_whatsapp_settings` (`openwa_api_base_url`, `openwa_webhook_secret`).

## Session bootstrap

Replace placeholders with your Railway API URL and API key.

```bash
export OPENWA_URL="https://openwa-production.up.railway.app"
export OPENWA_KEY="your-api-key"
export SESSION_NAME="hoteletuna-flagship"
export WEBHOOK_URL="https://www.hoteletuna.com/api/webhooks/openwa"
export WEBHOOK_SECRET="$(openssl rand -hex 32)"

# 1. Create session
curl -s -X POST "$OPENWA_URL/api/sessions" \
  -H "X-API-Key: $OPENWA_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$SESSION_NAME\"}"

# 2. Start session (note session id from response)
curl -s -X POST "$OPENWA_URL/api/sessions/$SESSION_NAME/start" \
  -H "X-API-Key: $OPENWA_KEY"

# 3. QR code — scan in OpenWA dashboard or:
curl -s "$OPENWA_URL/api/sessions/$SESSION_NAME/qr" -H "X-API-Key: $OPENWA_KEY"

# 4. Register webhook
curl -s -X POST "$OPENWA_URL/api/sessions/$SESSION_NAME/webhooks" \
  -H "X-API-Key: $OPENWA_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"$WEBHOOK_URL\",
    \"events\": [\"message.received\"],
    \"secret\": \"$WEBHOOK_SECRET\"
  }"
```

Store `WEBHOOK_SECRET` in Neon `tenant_whatsapp_settings.openwa_webhook_secret` for the hub tenant OpenWA row.

## Health check

```bash
curl -s "$OPENWA_URL/api/health" -H "X-API-Key: $OPENWA_KEY"
```

## Re-pair after disconnect

If the session shows `DISCONNECTED` in `session.status` webhooks:

1. `POST /api/sessions/{id}/start`
2. Scan new QR in dashboard
3. Verify inbound test message reaches `https://www.hoteletuna.com/api/webhooks/openwa`

## Compliance note

OpenWA uses unofficial WhatsApp Web (`whatsapp-web.js`). Meta Cloud API remains the production-grade path; use OpenWA for flagship ops / gradual rollout per tenant `provider` setting.
