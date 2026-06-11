/**
 * AI agent registry — canonical agent definitions for Hotel Etuna workflows.
 *
 * Purpose: Central catalog of LangGraph / pipeline agents (concierge, night audit, outreach).
 * Location: /lib/ai/agent-registry.ts
 *
 * Wave 7: merged with Sofia pipeline + tool-graph wiring (no runtime OSS imports).
 */

export type AgentCapability =
  | 'rag_search'
  | 'guest_profile'
  | 'availability_check'
  | 'folio_read'
  | 'folio_void'
  | 'email_outreach'
  | 'night_audit'
  | 'reservation_transition';

export type AgentDefinition = {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  /** Primary service entrypoint for this agent */
  handler: string;
  /** Env flag that enables optional graph/pipeline path, if any */
  enableEnvVar?: string;
  channels: Array<'WEB' | 'EMAIL' | 'WHATSAPP' | 'PHONE' | 'CRON'>;
};

/** Sofia concierge — guest-facing chat (WEB / messaging channels). */
export const SOFIA_CONCIERGE_AGENT: AgentDefinition = {
  id: 'sofia-concierge',
  name: 'Sofia Concierge',
  description: 'AI concierge for Hotel Etuna: RAG knowledge, guest memory, availability, and booking guidance.',
  capabilities: ['rag_search', 'guest_profile', 'availability_check'],
  handler: '@/lib/services/sofia/SofiaPipelineService',
  enableEnvVar: 'SOFIA_TOOL_GRAPH_ENABLED',
  channels: ['WEB', 'EMAIL', 'WHATSAPP', 'PHONE'],
};

/** Night audit agent — folio reconciliation and end-of-day checks (W5 / haip boundaries). */
export const NIGHT_AUDIT_AGENT: AgentDefinition = {
  id: 'night-audit',
  name: 'Night Audit',
  description:
    'End-of-day hospitality audit: post tariffs, no-shows, stayover/due-out transitions, revenue KPIs.',
  capabilities: ['folio_read', 'night_audit', 'reservation_transition'],
  handler: '@/lib/services/booking/NightAuditService',
  channels: ['CRON'],
};

/** Folio operations agent — void charges with PSD-12 reason codes (W5 / pura-pms boundaries). */
export const FOLIO_OPS_AGENT: AgentDefinition = {
  id: 'folio-ops',
  name: 'Folio Operations',
  description:
    'Staff folio corrections: void open charges via reversal lines with mandatory reason codes.',
  capabilities: ['folio_read', 'folio_void'],
  handler: '@/lib/services/folio/FolioService',
  channels: ['WEB'],
};

/** Outreach agent — proactive guest communications (email / campaigns). */
export const OUTREACH_AGENT: AgentDefinition = {
  id: 'outreach',
  name: 'Guest Outreach',
  description: 'Proactive guest outreach: pre-arrival, feedback, and loyalty nudges.',
  capabilities: ['email_outreach', 'guest_profile'],
  handler: '@/lib/services/crm/OutreachService',
  channels: ['CRON', 'EMAIL'],
};

export const AGENT_REGISTRY: Record<string, AgentDefinition> = {
  [SOFIA_CONCIERGE_AGENT.id]: SOFIA_CONCIERGE_AGENT,
  [NIGHT_AUDIT_AGENT.id]: NIGHT_AUDIT_AGENT,
  [FOLIO_OPS_AGENT.id]: FOLIO_OPS_AGENT,
  [OUTREACH_AGENT.id]: OUTREACH_AGENT,
};

export function getAgentDefinition(agentId: string): AgentDefinition | undefined {
  return AGENT_REGISTRY[agentId];
}

export function listAgents(): AgentDefinition[] {
  return Object.values(AGENT_REGISTRY);
}

export function isAgentEnabled(agent: AgentDefinition): boolean {
  if (!agent.enableEnvVar) return true;
  return process.env[agent.enableEnvVar] === 'true';
}
