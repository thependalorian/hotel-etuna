/**
 * Consumer rights & cyber incident status workflows (LangGraph-validated)
 *
 * Purpose: ETA / PSD-12 style request lifecycles with shared transition engine
 * Location: /lib/services/compliance/RegulatoryLifecycleService.ts
 */

import { db, consumerRightsRequests, cybersecurityIncidents } from '@/lib/db';
import { AppError, handleServiceError } from '@/lib/utils/errors';
import { and, eq } from 'drizzle-orm';
import {
  CONSUMER_RIGHTS_STATUS_TRANSITIONS,
  CYBER_INCIDENT_STATUS_TRANSITIONS,
} from '@/lib/workflows/domainTransitions';
import { invokeLifecycleTransition } from '@/lib/workflows/genericLifecycleGraph';
import type { ConsumerRightsRequest, CybersecurityIncident } from '@/lib/db/schema';

export class RegulatoryLifecycleService {
  async transitionConsumerRightsRequest(
    tenantId: string,
    requestId: string,
    targetStatus: string
  ): Promise<ConsumerRightsRequest> {
    try {
      const [row] = await db
        .select()
        .from(consumerRightsRequests)
        .where(
          and(
            eq(consumerRightsRequests.id, requestId),
            eq(consumerRightsRequests.tenantId, tenantId)
          )
        )
        .limit(1);

      if (!row) {
        throw new AppError(404, 'Consumer rights request not found');
      }

      const out = await invokeLifecycleTransition(
        'consumer_rights',
        CONSUMER_RIGHTS_STATUS_TRANSITIONS,
        row.status || 'pending',
        targetStatus
      );

      if (out.errorMessage || !out.resolvedStatus) {
        throw new AppError(400, out.errorMessage || 'Invalid status transition');
      }

      const now = new Date();
      const [updated] = await db
        .update(consumerRightsRequests)
        .set({
          status: out.resolvedStatus,
          updatedAt: now,
          ...(out.resolvedStatus === 'resolved' ? { resolutionDate: now.toISOString().slice(0, 10) } : {}),
        })
        .where(eq(consumerRightsRequests.id, requestId))
        .returning();

      if (!updated) {
        throw new AppError(500, 'Update failed');
      }
      return updated;
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw handleServiceError(e, 'consumer rights transition');
    }
  }

  async transitionCyberIncident(
    tenantId: string,
    incidentId: string,
    targetStatus: string
  ): Promise<CybersecurityIncident> {
    try {
      const [row] = await db
        .select()
        .from(cybersecurityIncidents)
        .where(
          and(
            eq(cybersecurityIncidents.id, incidentId),
            eq(cybersecurityIncidents.tenantId, tenantId)
          )
        )
        .limit(1);

      if (!row) {
        throw new AppError(404, 'Cyber incident not found');
      }

      const out = await invokeLifecycleTransition(
        'cyber_incident',
        CYBER_INCIDENT_STATUS_TRANSITIONS,
        row.status || 'open',
        targetStatus
      );

      if (out.errorMessage || !out.resolvedStatus) {
        throw new AppError(400, out.errorMessage || 'Invalid status transition');
      }

      const patch: Record<string, unknown> = {
        status: out.resolvedStatus,
        updatedAt: new Date(),
      };
      if (out.resolvedStatus === 'closed') {
        patch.recoveryCompletedAt = new Date();
      }

      const [updated] = await db
        .update(cybersecurityIncidents)
        .set(patch as Partial<CybersecurityIncident>)
        .where(eq(cybersecurityIncidents.id, incidentId))
        .returning();

      if (!updated) {
        throw new AppError(500, 'Update failed');
      }
      return updated;
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw handleServiceError(e, 'cyber incident transition');
    }
  }
}
