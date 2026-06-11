/**
 * SOC 2 Compliance Service — facade over Soc2AuditOrchestrator + CPA evidence export.
 * Location: lib/compliance/soc2/Soc2ComplianceService.ts
 */

import { db } from '@/lib/db';
import { auditTrail, users, cybersecurityIncidents } from '@/lib/db/schema';
import { and, gte, lte, desc } from 'drizzle-orm';
import { runSoc2Audit } from './soc2-audit-engine';
import type { Soc2AuditReport } from './types';

export class Soc2ComplianceService {
  async runComplianceAssessment(
    periodStart: string,
    periodEnd: string
  ): Promise<Soc2AuditReport> {
    return runSoc2Audit({
      from: new Date(periodStart),
      to: new Date(periodEnd),
    });
  }

  async exportEvidencePackage(periodStart: string, periodEnd: string) {
    const report = await this.runComplianceAssessment(periodStart, periodEnd);

    const auditLogs = await db
      .select()
      .from(auditTrail)
      .where(
        and(
          gte(auditTrail.timestamp, new Date(periodStart)),
          lte(auditTrail.timestamp, new Date(periodEnd))
        )
      )
      .orderBy(desc(auditTrail.timestamp))
      .limit(10000);

    const userAccessList = await db
      .select({
        userId: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users);

    const incidents = await db
      .select()
      .from(cybersecurityIncidents)
      .where(
        and(
          gte(cybersecurityIncidents.detectedAt, new Date(periodStart)),
          lte(cybersecurityIncidents.detectedAt, new Date(periodEnd))
        )
      );

    return {
      report,
      auditLogs,
      userAccessList,
      incidents,
      exportedAt: new Date().toISOString(),
      periodCovered: { from: periodStart, to: periodEnd },
      disclaimer:
        'This evidence package is provided to the independent CPA auditor for SOC 2 Type II examination. It contains personal data subject to confidentiality obligations.',
    };
  }
}

export const soc2ComplianceService = new Soc2ComplianceService();
