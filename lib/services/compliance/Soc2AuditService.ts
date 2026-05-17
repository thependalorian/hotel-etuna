/**
 * Soc2AuditService — facade over canonical Soc2AuditOrchestrator.
 * Location: lib/services/compliance/Soc2AuditService.ts
 */

import { runSoc2Audit } from '@/lib/compliance/soc2/soc2-audit-engine';
import type { Soc2AuditReport } from '@/lib/compliance/soc2/types';

export class Soc2AuditService {
  /**
   * Run all SOC 2 audit agents and return a Type I-style readiness report.
   * For Type II, re-run across the audit period and export evidence each month.
   */
  async runAudit(
    _tenantId: string | null,
    from: Date,
    to: Date
  ): Promise<Soc2AuditReport> {
    return runSoc2Audit({ from, to });
  }

  /** Controls that must be remediated before enterprise procurement / Type I */
  getPriorityGaps(report: Soc2AuditReport): Soc2AuditReport['controls'] {
    return report.controls.filter((c) => c.status === 'gap' || c.status === 'manual');
  }
}
