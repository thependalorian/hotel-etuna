/**
 * Mem0 REST client (optional) — long-term memory for Sofia / CRM
 *
 * Purpose: When MEM0_API_KEY is set, push conversation turns and optionally read memories for prompts.
 * Docs: https://docs.mem0.ai/api-reference/memory/add-memories (POST /v1/memories/)
 * List (v2): https://docs.mem0.ai/api-reference/memory/get-memories (POST /v2/memories/ with filters)
 * Location: lib/integrations/mem0.ts
 */

const DEFAULT_BASE = 'https://api.mem0.ai';

function memHeaders(): HeadersInit {
  const key = process.env.MEM0_API_KEY!;
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Token ${key}`,
  };
}

export function isMem0Configured(): boolean {
  return Boolean(process.env.MEM0_API_KEY?.trim());
}

/** Stable Mem0 user_id scoped per tenant + guest */
export function mem0UserId(tenantId: string, guestId: string): string {
  return `buffr:${tenantId}:${guestId}`;
}

export async function mem0AddTurn(
  userId: string,
  userContent: string,
  assistantContent: string,
  metadata?: Record<string, string | number | boolean>
): Promise<void> {
  if (!isMem0Configured()) return;
  const base = (process.env.MEM0_API_BASE_URL || DEFAULT_BASE).replace(/\/$/, '');
  const body: Record<string, unknown> = {
    user_id: userId,
    version: 'v2',
    messages: [
      { role: 'user', content: userContent },
      { role: 'assistant', content: assistantContent },
    ],
    metadata: { source: 'buffr_sofia', ...(metadata ?? {}) },
  };
  const orgId = process.env.MEM0_ORG_ID?.trim();
  const projectId = process.env.MEM0_PROJECT_ID?.trim();
  if (orgId) body.org_id = orgId;
  if (projectId) body.project_id = projectId;

  try {
    const res = await fetch(`${base}/v1/memories/`, {
      method: 'POST',
      headers: memHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      console.error('[mem0] add failed', res.status, t);
    }
  } catch (e) {
    console.error('[mem0] add error', e);
  }
}

type Mem0ListItem = { memory?: string; id?: string };

/** Best-effort: fetch recent memory strings for prompt grounding */
function parseMemoryRows(data: unknown): Mem0ListItem[] {
  if (Array.isArray(data)) return data as Mem0ListItem[];
  if (data && typeof data === 'object' && 'results' in data && Array.isArray((data as { results: unknown }).results)) {
    return (data as { results: Mem0ListItem[] }).results;
  }
  return [];
}

/** Prefer Mem0 v2 filtered list; fall back to v1 GET if v2 fails */
export async function mem0ListMemoriesForUser(userId: string, limit = 12): Promise<string[]> {
  if (!isMem0Configured()) return [];
  const base = (process.env.MEM0_API_BASE_URL || DEFAULT_BASE).replace(/\/$/, '');

  const toStrings = (rows: Mem0ListItem[]): string[] => {
    const out: string[] = [];
    for (const row of rows.slice(0, limit)) {
      if (row && typeof row === 'object' && 'memory' in row && typeof (row as Mem0ListItem).memory === 'string') {
        out.push((row as Mem0ListItem).memory!);
      }
    }
    return out;
  };

  try {
    const v2Body: Record<string, unknown> = {
      filters: { AND: [{ user_id: userId }] },
      page_size: limit,
    };
    const orgId = process.env.MEM0_ORG_ID?.trim();
    const projectId = process.env.MEM0_PROJECT_ID?.trim();
    if (orgId) v2Body.org_id = orgId;
    if (projectId) v2Body.project_id = projectId;

    const resV2 = await fetch(`${base}/v2/memories/`, {
      method: 'POST',
      headers: memHeaders(),
      body: JSON.stringify(v2Body),
    });

    if (resV2.ok) {
      const data: unknown = await resV2.json();
      return toStrings(parseMemoryRows(data));
    }

    const url = `${base}/v1/memories/?user_id=${encodeURIComponent(userId)}`;
    const res = await fetch(url, { headers: memHeaders() });
    if (!res.ok) {
      console.warn('[mem0] list failed v2:', resV2.status, 'v1:', res.status);
      return [];
    }
    const data: unknown = await res.json();
    return toStrings(parseMemoryRows(data));
  } catch (e) {
    console.warn('[mem0] list error', e);
    return [];
  }
}
