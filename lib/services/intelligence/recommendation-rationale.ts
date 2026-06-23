/**
 * @fileoverview Recommendation rationale — the plain-language "why" shown in the approval queue.
 * Location: lib/services/intelligence/recommendation-rationale.ts
 *
 * The number comes from deterministic math (rate-pricing / InventoryService). Sofia's LLM only
 * phrases the rationale a human reviewer reads before approving. If AI is unconfigured or fails,
 * the router falls back to the deterministic template — the recommendation never depends on AI.
 */
import { LLMProviderRouter } from '@/lib/services/ai/LLMProviderRouter';
import type { DemandBand } from '@/lib/services/intelligence/rate-pricing';

const router = new LLMProviderRouter();

function fmtPct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function signedPct(value: number): string {
  const pct = Math.round(value * 100);
  return pct === 0 ? 'hold' : pct > 0 ? `+${pct}%` : `${pct}%`;
}

/** Build the deterministic rate rationale (also the AI fallback). */
export function rateRationaleTemplate(input: {
  roomType: string;
  band: DemandBand;
  forecastOccupancy: number;
  currentRate: number;
  recommendedRate: number;
  adjustmentPct: number;
  horizonDays: number;
}): string {
  const direction =
    input.recommendedRate > input.currentRate
      ? 'raise'
      : input.recommendedRate < input.currentRate
        ? 'lower'
        : 'hold';
  return (
    `Forward occupancy for ${input.roomType} is ${fmtPct(input.forecastOccupancy)} over the next ` +
    `${input.horizonDays} days (${input.band} demand). Suggest ${direction} the nightly rate from ` +
    `N$${input.currentRate.toFixed(0)} to N$${input.recommendedRate.toFixed(0)} (${signedPct(input.adjustmentPct)}). ` +
    `Requires approval before it takes effect.`
  );
}

/** Build the deterministic reorder rationale (also the AI fallback). */
export function reorderRationaleTemplate(input: {
  name: string;
  unit: string;
  quantityOnHand: number;
  reorderPoint: number;
  recommendedQuantity: number;
}): string {
  const state = input.quantityOnHand <= 0 ? 'out of stock' : 'below its reorder point';
  return (
    `${input.name} is ${state} (${input.quantityOnHand} ${input.unit} on hand, reorder point ` +
    `${input.reorderPoint}). Suggest ordering ${input.recommendedQuantity} ${input.unit}. ` +
    `Requires approval before a purchase is raised.`
  );
}

/** Enrich a templated rationale via Sofia; falls back to the template if AI is unavailable. */
async function phrase(template: string, context: string): Promise<string> {
  const result = await router.chat(
    [
      {
        role: 'system',
        content:
          'You are a hospitality revenue/operations analyst for Hotel Etuna. Rewrite the given ' +
          'recommendation as ONE concise, professional sentence for a manager who must approve it. ' +
          'Keep all numbers exactly. Do not invent facts. Do not add a greeting.',
      },
      { role: 'user', content: `${context}\n\nDraft: ${template}` },
    ],
    { temperature: 0.3, maxTokens: 120, fallback: () => template },
  );
  return result.content.trim() || template;
}

export async function rateRationale(input: Parameters<typeof rateRationaleTemplate>[0]): Promise<string> {
  const template = rateRationaleTemplate(input);
  return phrase(template, `Room type: ${input.roomType}. Demand band: ${input.band}.`);
}

export async function reorderRationale(
  input: Parameters<typeof reorderRationaleTemplate>[0],
): Promise<string> {
  const template = reorderRationaleTemplate(input);
  return phrase(template, `Inventory item: ${input.name}.`);
}
