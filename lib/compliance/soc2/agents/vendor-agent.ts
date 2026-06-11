/**
 * SOC 2 agent — subservice organizations (Vercel, Neon, Adumo).
 * Location: lib/compliance/soc2/agents/vendor-agent.ts
 */

import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import type { Soc2AgentRunResult, Soc2ControlResult } from '../types';
import { pickAgentControls, mergeControl } from './shared';
import { scoreControls } from '../control-matrix';

const SUBSERVICES = [
  {
    name: 'Vercel Inc.',
    role: 'Application hosting, edge, TLS termination',
    cuecNote: 'Review Vercel SOC 2 annually; restrict production deploy team',
  },
  {
    name: 'Neon (PostgreSQL)',
    role: 'Primary database — guest PII, bookings, audit_trail',
    cuecNote: 'Review Neon security docs; enable IP allowlist / SSL require',
  },
  {
    name: 'Adumo (Namibia)',
    role: 'Card acquirer — hosted payment page',
    cuecNote: 'Settlement to Etuna Nedbank; Buffr merchant of record',
  },
] as const;

export async function runVendorAgent(base: Soc2ControlResult[]): Promise<Soc2AgentRunResult> {
  let controls = pickAgentControls(base, 'vendor_subservice');

  controls = mergeControl(controls, 'CC9.2', {
    status: 'manual',
    evidence: SUBSERVICES.map((s) => `${s.name}: ${s.role}`),
    gaps: [
      'Annual vendor risk assessment not stored in DB',
      'AWS-style carve-out CUEC worksheet not completed (NayaOne ref 68)',
      'Adumo contractual SOC/PCI evidence not linked',
    ],
    remediation: [
      'Create compliance/vendor-register.md with review dates',
      'Download Vercel + Neon SOC reports each January',
      'Obtain Adumo merchant security attestation for audit file',
    ],
  });

  return {
    agentId: 'vendor_subservice',
    agentName: 'Vendor & Subservice Organizations',
    controls,
    scorePercent: scoreControls(controls),
    ranAt: new Date().toISOString(),
  };
}

export { SUBSERVICES };
