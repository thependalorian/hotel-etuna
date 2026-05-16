/**
 * Shared helpers for SOC 2 audit agents.
 * Location: lib/compliance/soc2/agents/shared.ts
 */

import type { Soc2ControlResult } from '../types';

export function mergeControl(
  controls: Soc2ControlResult[],
  controlId: string,
  patch: Partial<Pick<Soc2ControlResult, 'status' | 'evidence' | 'gaps' | 'remediation'>>
): Soc2ControlResult[] {
  return controls.map((c) =>
    c.controlId === controlId
      ? {
          ...c,
          ...patch,
          evidence: patch.evidence ? [...c.evidence, ...patch.evidence] : c.evidence,
          gaps: patch.gaps ? [...c.gaps, ...patch.gaps] : c.gaps,
          remediation: patch.remediation
            ? [...c.remediation, ...patch.remediation]
            : c.remediation,
        }
      : c
  );
}

export function pickAgentControls(
  controls: Soc2ControlResult[],
  agentId: Soc2ControlResult['agentId']
): Soc2ControlResult[] {
  return controls.filter((c) => c.agentId === agentId);
}
