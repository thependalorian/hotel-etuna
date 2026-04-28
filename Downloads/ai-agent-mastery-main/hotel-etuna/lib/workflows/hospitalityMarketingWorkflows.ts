/**
 * Hospitality CRM marketing workflows (LangGraph) — lightweight vs full LAS
 *
 * Purpose: Rule-based guest segmentation for campaigns; composes with crm_outreach_touches + lifecycle transitions.
 * Location: lib/workflows/hospitalityMarketingWorkflows.ts
 */

import { Annotation, StateGraph } from '@langchain/langgraph';
import { normalizeWorkflowStatus } from '@/lib/workflows/domainTransitions';

export type HospitalityMarketingSegment =
  | 'inactive_90d'
  | 'repeat_guest'
  | 'high_value_stays'
  | 'new_lead'
  | 'general';

export const GuestMarketingSegmentState = Annotation.Root({
  tenantId: Annotation<string>,
  guestId: Annotation<string>,
  lastStayDaysAgo: Annotation<number | undefined>,
  totalBookings: Annotation<number | undefined>,
  lifetimeValueNad: Annotation<number | undefined>,
  marketingConsent: Annotation<boolean | undefined>,
  segment: Annotation<HospitalityMarketingSegment | undefined>,
  recommendedChannels: Annotation<string[] | undefined>,
  notes: Annotation<string | undefined>,
});

export type GuestMarketingSegmentStateType = typeof GuestMarketingSegmentState.State;

function segmentNode(state: GuestMarketingSegmentStateType): Partial<GuestMarketingSegmentStateType> {
  const last = state.lastStayDaysAgo ?? 9999;
  const bookings = state.totalBookings ?? 0;
  const ltv = state.lifetimeValueNad ?? 0;
  const consent = state.marketingConsent === true;

  let segment: HospitalityMarketingSegment = 'general';
  if (bookings === 0 && last >= 9999) segment = 'new_lead';
  else if (last > 90 && bookings >= 1) segment = 'inactive_90d';
  else if (bookings >= 3) segment = 'repeat_guest';
  else if (ltv >= 5000) segment = 'high_value_stays';

  const channels: string[] = [];
  if (consent) {
    channels.push('email');
    if (segment === 'repeat_guest' || segment === 'high_value_stays') {
      channels.push('sofia_personalized');
    }
  }

  return {
    segment,
    recommendedChannels: channels,
    notes: consent
      ? 'Guest may receive marketing per CRM consent.'
      : 'Do not send promotional outreach; transactional only unless guest opts in.',
  };
}

let compiled: ReturnType<typeof buildGraph> | null = null;

function buildGraph() {
  /** Node id must not collide with state channel `segment` (LangGraph reserved). */
  return new StateGraph(GuestMarketingSegmentState)
    .addNode('compute_segment', segmentNode)
    .addEdge('__start__', 'compute_segment')
    .addEdge('compute_segment', '__end__')
    .compile();
}

export async function runGuestMarketingSegmentWorkflow(
  input: Omit<GuestMarketingSegmentStateType, 'segment' | 'recommendedChannels' | 'notes'>
): Promise<GuestMarketingSegmentStateType> {
  if (!compiled) compiled = buildGraph();
  return compiled.invoke({
    tenantId: input.tenantId,
    guestId: input.guestId,
    lastStayDaysAgo: input.lastStayDaysAgo,
    totalBookings: input.totalBookings,
    lifetimeValueNad: input.lifetimeValueNad,
    marketingConsent: input.marketingConsent,
  });
}

/** Normalize outreach touch status for lifecycle helper */
export function normalizeOutreachStatus(raw: string): string {
  return normalizeWorkflowStatus(raw);
}
