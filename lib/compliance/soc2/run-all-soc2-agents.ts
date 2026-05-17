/**
 * Canonical SOC 2 multi-agent runner — delegates to Soc2AuditOrchestrator only.
 * Location: lib/compliance/soc2/run-all-soc2-agents.ts
 */

import { soc2AuditOrchestrator } from './Soc2AuditOrchestrator';
import type { Soc2AgentRunResult } from './types';

/**
 * @param _tenantId Reserved for future tenant-scoped audits (platform-wide today).
 */
export async function runAllSoc2Agents(
  _tenantId: string | null,
  from: Date,
  to: Date
): Promise<Soc2AgentRunResult[]> {
  const report = await soc2AuditOrchestrator.runAudit({
    periodFrom: from,
    periodTo: to,
  });
  return report.agents;
}
