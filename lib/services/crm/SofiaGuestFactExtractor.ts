/**
 * Extracts durable guest facts from Sofia turns into Neon (Ava-style, no Mem0 required).
 * Location: lib/services/crm/SofiaGuestFactExtractor.ts
 */

import { LLMProviderRouter } from '@/lib/services/ai/LLMProviderRouter';

export type ExtractedGuestFact = {
  factText: string;
  confidence: number;
};

const MEMORY_ANALYSIS_PROMPT = `You extract one short hospitality fact about the guest from their latest message.
Reply with JSON only: {"is_important": boolean, "formatted_memory": string|null}
Rules:
- Only personal preferences, dietary needs, accessibility, celebrations, or stable guest details.
- Ignore greetings, booking logistics already in context, and "remember this" meta-requests without facts.
- formatted_memory: third-person, under 120 chars, no quotes.
- If nothing worth storing, is_important false and formatted_memory null.`;

const HEURISTIC_PATTERNS: Array<{ re: RegExp; format: (m: RegExpMatchArray) => string }> = [
  {
    re: /\b(?:i am|i'm|we are|we're)\s+(vegetarian|vegan|pescatarian|gluten[- ]free|halal|kosher)\b/i,
    format: (m) => `Dietary preference: ${m[1].toLowerCase()}`,
  },
  {
    re: /\b(?:allergic to|allergy to|cannot eat)\s+([a-z][a-z\s]{2,40})/i,
    format: (m) => `Allergy: ${m[1].trim()}`,
  },
  {
    re: /\b(?:prefer|preference for)\s+([a-z][a-z\s]{2,50})/i,
    format: (m) => `Prefers ${m[1].trim()}`,
  },
  {
    re: /\b(?:celebrating|anniversary|birthday)\b/i,
    format: () => 'Has a special occasion to note for hospitality',
  },
  {
    re: /\b(?:wheelchair|mobility|accessible)\b/i,
    format: () => 'May need accessibility assistance',
  },
];

function normalizeFact(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function factsAreSimilar(a: string, b: string): boolean {
  const na = normalizeFact(a);
  const nb = normalizeFact(b);
  if (na === nb) return true;
  if (na.length > 8 && (na.includes(nb) || nb.includes(na))) return true;
  const ta = new Set(na.split(' ').filter((w) => w.length > 3));
  const tb = new Set(nb.split(' ').filter((w) => w.length > 3));
  if (!ta.size || !tb.size) return false;
  let overlap = 0;
  for (const w of ta) {
    if (tb.has(w)) overlap++;
  }
  const union = new Set([...ta, ...tb]).size;
  return union > 0 && overlap / union >= 0.6;
}

export function extractFactsHeuristic(userMessage: string): ExtractedGuestFact[] {
  const facts: ExtractedGuestFact[] = [];
  for (const { re, format } of HEURISTIC_PATTERNS) {
    const m = userMessage.match(re);
    if (m) {
      facts.push({ factText: format(m), confidence: 0.85 });
    }
  }
  return facts;
}

async function extractFactWithLlm(userMessage: string): Promise<ExtractedGuestFact | null> {
  const router = new LLMProviderRouter();
  try {
    const result = await router.chat(
      [
        { role: 'system', content: MEMORY_ANALYSIS_PROMPT },
        { role: 'user', content: userMessage.slice(0, 2000) },
      ],
      { maxTokens: 120, temperature: 0.1 }
    );
    const raw = result.content.trim();
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) return null;
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as {
      is_important?: boolean;
      formatted_memory?: string | null;
    };
    if (!parsed.is_important || !parsed.formatted_memory?.trim()) return null;
    return { factText: parsed.formatted_memory.trim(), confidence: 0.75 };
  } catch {
    return null;
  }
}

/** Merge heuristic + optional LLM extraction for a single user turn. */
export async function extractGuestFactsFromTurn(userMessage: string): Promise<ExtractedGuestFact[]> {
  const trimmed = userMessage.trim();
  if (trimmed.length < 12) return [];

  const byText = new Map<string, ExtractedGuestFact>();
  for (const f of extractFactsHeuristic(trimmed)) {
    byText.set(normalizeFact(f.factText), f);
  }

  const llmFact = await extractFactWithLlm(trimmed);
  if (llmFact) {
    const key = normalizeFact(llmFact.factText);
    if (!byText.has(key)) byText.set(key, llmFact);
  }

  return [...byText.values()].filter((f) => f.factText.length >= 8 && f.factText.length <= 200);
}
