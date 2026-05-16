/**
 * Soc2AuditOrchestrator — runs all SOC 2 evidence agents and produces audit report.
 * Location: lib/compliance/soc2/Soc2AuditOrchestrator.ts
 */

import {
  seedControls,
  scoreControls,
  summarizeControls,
  SOC2_FRAMEWORK_REFERENCE,
  HOTEL_ETUNA_SOC2_SCOPE,
} from './control-matrix';
import { runAccessControlAgent } from './agents/access-control-agent';
import { runMonitoringAgent } from './agents/monitoring-agent';
import { runChangeManagementAgent } from './agents/change-management-agent';
import { runAvailabilityAgent } from './agents/availability-agent';
import { runConfidentialityAgent } from './agents/confidentiality-agent';
import { runVendorAgent, SUBSERVICES } from './agents/vendor-agent';
import type { Soc2AuditReport } from './types';

export type Soc2AuditOptions = {
  periodFrom?: Date;
  periodTo?: Date;
};

function defaultPeriod(): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 90);
  return { from, to };
}

export class Soc2AuditOrchestrator {
  /**
   * Run all six SOC 2 agents and merge control results.
   */
  async runAudit(options: Soc2AuditOptions = {}): Promise<Soc2AuditReport> {
    const period = {
      from: options.periodFrom ?? defaultPeriod().from,
      to: options.periodTo ?? defaultPeriod().to,
    };

    const base = seedControls();

    const [access, monitoring, change, availability, confidentiality, vendor] =
      await Promise.all([
        runAccessControlAgent(base, period),
        runMonitoringAgent(base, period),
        runChangeManagementAgent(base),
        runAvailabilityAgent(base, period),
        runConfidentialityAgent(base, period),
        runVendorAgent(base),
      ]);

    const agents = [access, monitoring, change, availability, confidentiality, vendor];
    const controls = agents.flatMap((a) => a.controls);
    const summary = summarizeControls(controls);

    return {
      organization: HOTEL_ETUNA_SOC2_SCOPE.organization,
      system: HOTEL_ETUNA_SOC2_SCOPE.system,
      frameworkReference: SOC2_FRAMEWORK_REFERENCE,
      trustCategories: ['security', 'availability', 'confidentiality'],
      period: { from: period.from.toISOString(), to: period.to.toISOString() },
      subserviceOrganizations: SUBSERVICES.map((s) => ({ ...s })),
      overallScorePercent: scoreControls(controls),
      summary,
      agents,
      controls,
      disclaimer:
        'Automated readiness assessment only — not a CPA attestation. Type I = design; Type II = operating effectiveness over 6–12 months. Align with formal policies and auditor evidence requests.',
    };
  }
}

export const soc2AuditOrchestrator = new Soc2AuditOrchestrator();
