/**
 * SOC 2 agent — change management (SDLC, CI, migrations).
 * Location: lib/compliance/soc2/agents/change-management-agent.ts
 */

import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import type { Soc2AgentRunResult, Soc2ControlResult } from '../types';
import { pickAgentControls, mergeControl } from './shared';
import { scoreControls } from '../control-matrix';

export async function runChangeManagementAgent(
  base: Soc2ControlResult[]
): Promise<Soc2AgentRunResult> {
  let controls = pickAgentControls(base, 'change_management');

  const workflowsDir = join(process.cwd(), '.github/workflows');
  const migrationsDir = join(process.cwd(), 'database/drizzle');
  const hasWorkflows = existsSync(workflowsDir);
  const workflowFiles = hasWorkflows
    ? readdirSync(workflowsDir).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    : [];
  const migrationFiles = existsSync(migrationsDir)
    ? readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'))
    : [];

  controls = mergeControl(controls, 'CC8.1', {
    status: workflowFiles.length > 0 && migrationFiles.length > 0 ? 'partial' : 'gap',
    evidence: [
      `GitHub workflows: ${workflowFiles.join(', ') || 'none'}`,
      `SQL migrations: ${migrationFiles.length} files in database/drizzle/`,
      'Forward-only Drizzle migrations per TASK.md checklist',
    ],
    gaps: [
      'PR approval requirement not verified by agent (link GitHub branch protection manually)',
      'Emergency hotfix post-approval process not documented',
      'Production deploy restricted to authorized personnel — verify Vercel team RBAC',
    ],
    remediation: [
      'Enable branch protection on main: ≥1 approval, required checks',
      'Document release notes per deploy (NayaOne ref 17)',
    ],
  });

  return {
    agentId: 'change_management',
    agentName: 'Change Management',
    controls,
    scorePercent: scoreControls(controls),
    ranAt: new Date().toISOString(),
  };
}
