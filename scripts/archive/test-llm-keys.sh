#!/usr/bin/env bash
set -euo pipefail

# Load env vars from .env.local for local validation
if [[ -f ".env.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source ".env.local"
  set +a
fi

echo "Testing DeepSeek..."
DS_URL="${DEEPSEEK_BASE_URL:-https://api.deepseek.com/v1}/chat/completions"
DS_CODE=$(
  curl -sS -o /tmp/deepseek_resp.json -w "%{http_code}" "$DS_URL" \
    -H "Authorization: Bearer ${DEEPSEEK_API_KEY:-}" \
    -H "Content-Type: application/json" \
    -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"Reply with exactly: ok"}],"max_tokens":5,"temperature":0}'
)
echo "DeepSeek HTTP ${DS_CODE}"

echo "Testing Groq..."
GQ_CODE=$(
  curl -sS -o /tmp/groq_resp.json -w "%{http_code}" "https://api.groq.com/openai/v1/chat/completions" \
    -H "Authorization: Bearer ${GROQ_API_KEY:-}" \
    -H "Content-Type: application/json" \
    -d '{"model":"llama-3.1-8b-instant","messages":[{"role":"user","content":"Reply with exactly: ok"}],"max_tokens":5,"temperature":0}'
)
echo "Groq HTTP ${GQ_CODE}"

echo "Testing Anthropic..."
AN_CODE=$(
  curl -sS -o /tmp/anthropic_resp.json -w "%{http_code}" "https://api.anthropic.com/v1/messages" \
    -H "x-api-key: ${ANTHROPIC_API_KEY:-}" \
    -H "anthropic-version: 2023-06-01" \
    -H "content-type: application/json" \
    -d '{"model":"claude-3-5-haiku-latest","max_tokens":16,"messages":[{"role":"user","content":"Reply with exactly: ok"}]}'
)
echo "Anthropic HTTP ${AN_CODE}"

echo "Testing OpenAI..."
OA_CODE=$(
  curl -sS -o /tmp/openai_resp.json -w "%{http_code}" "https://api.openai.com/v1/chat/completions" \
    -H "Authorization: Bearer ${OPENAI_API_KEY:-}" \
    -H "Content-Type: application/json" \
    -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Reply with exactly: ok"}],"max_tokens":5,"temperature":0}'
)
echo "OpenAI HTTP ${OA_CODE}"

echo ""
echo "Error summaries (if any):"
python - <<'PY'
import json
for name, path in [
    ("DeepSeek", "/tmp/deepseek_resp.json"),
    ("Groq", "/tmp/groq_resp.json"),
    ("Anthropic", "/tmp/anthropic_resp.json"),
    ("OpenAI", "/tmp/openai_resp.json"),
]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        print(f"{name}: non-JSON or unreadable response")
        continue
    err = data.get("error")
    if err:
        if isinstance(err, dict):
            print(f"{name}: {err.get('message') or err}")
        else:
            print(f"{name}: {err}")
    else:
        print(f"{name}: success payload received")
PY
