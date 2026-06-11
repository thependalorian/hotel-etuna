#!/usr/bin/env bash
# Upload Hotel Etuna copy spine + knowledge markdown into Archon KB.
# Usage: ARCHON_URL=http://localhost:8181 ./scripts/archon/sync-content-knowledge.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ARCHON_URL="${ARCHON_URL:-http://localhost:8181}"
TAGS='["hotel-etuna","content","hospitality"]'

echo "→ Archon health at ${ARCHON_URL}"
curl -sf "${ARCHON_URL}/health" | grep -q '"ready":true' || {
  echo "Archon backend not ready. Start: cd ../archon && docker compose up -d"
  exit 1
}

upload() {
  local file="$1"
  local ktype="${2:-business}"
  echo "→ Upload $(basename "$file")"
  curl -sf -X POST "${ARCHON_URL}/api/documents/upload" \
    -F "file=@${file};type=text/markdown" \
    -F "tags=${TAGS}" \
    -F "knowledge_type=${ktype}" \
    -F "extract_code_examples=false" \
    | head -c 400
  echo
}

for f in \
  "${ROOT}/lib/copy/brand.ts" \
  "${ROOT}/lib/copy/public.ts" \
  "${ROOT}/lib/copy/contact-emails.ts" \
  "${ROOT}/docs/FRONTEND_AUDIT.md" \
  "${ROOT}/docs/project/HOTEL_ETUNA_OS.md" \
  "${ROOT}/docs/audit/CODEBASE_AUDIT_2026-06-10.md" \
  "${ROOT}/lib/config/platform-console.ts" \
  "${ROOT}/lib/utils/public-app-url.ts" \
  "${ROOT}/data/hotel-etuna-knowledge/hotel-etuna-facts.md" \
  "${ROOT}/data/hotel-etuna-knowledge/room-descriptions.md" \
  "${ROOT}/data/hotel-etuna-knowledge/restaurant-menu.md" \
  "${ROOT}/data/hotel-etuna-knowledge/local-area.md"
do
  if [[ -f "$f" ]]; then
    upload "$f" "business"
  else
    echo "skip missing: $f"
  fi
done

echo "✓ Upload jobs queued — check Archon UI → Knowledge for progress."
