/**
 * Guest DSAR (Data Subject Access Request) API
 *
 * Purpose: Allow authenticated guests to submit data access, correction, or deletion requests
 *          per Namibia Data Protection Bill (draft) and ETA 2019 Section 35/37.
 * Location: /app/api/guest/dsar/route.ts
 *
 * Response: { success: true, requestReference, message }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { consumerRightsRequests, guests } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { withTenantApiAuth } from '@/lib/utils/api-helpers';
import { securityLogger } from '@/lib/utils/security-logger';
import { recordAuditTrail } from '@/lib/compliance/record-audit';
import { AppError } from '@/lib/utils/errors';

const dsarSchema = z.object({
  requestType: z.enum([
    'access',          // Right to know what data we hold
    'correction',      // Request correction of inaccurate data
    'deletion',        // Request erasure ("right to be forgotten")
    'portability',     // Request data export
    'restriction',     // Restrict processing
    'objection',       // Object to processing (e.g. marketing)
    'complaint',       // General complaint about data handling
    'refund',          // ETA Section 37 refund request
  ]),
  requestDescription: z.string().min(10).max(2000),
  transactionId: z.string().uuid().optional(),
});

/** POST /api/guest/dsar — Submit a data subject access request */
export async function POST(req: NextRequest) {
  return withTenantApiAuth(req, async (request, user) => {
    try {
      const body = await request.json();
      const parsed = dsarSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid request', details: parsed.error.issues },
          { status: 400 }
        );
      }

      const { requestType, requestDescription, transactionId } = parsed.data;

      // Resolve guest record by email
      const [guest] = await db
        .select({ id: guests.id })
        .from(guests)
        .where(
          and(
            eq(guests.email, user.email ?? ''),
            eq(guests.tenantId, user.tenantId)
          )
        )
        .limit(1);

      // Generate human-readable reference
      const ts = Date.now().toString(36).toUpperCase();
      const requestReference = `DSAR-${ts}`;

      // Cooling-off deadline: 7 days (ETA Section 35)
      const requestDate = new Date();
      const coolingOff = new Date(requestDate);
      coolingOff.setDate(coolingOff.getDate() + 7);
      // Refund deadline: 30 days (ETA Section 37)
      const refundDeadline = new Date(requestDate);
      refundDeadline.setDate(refundDeadline.getDate() + 30);

      const [created] = await db
        .insert(consumerRightsRequests)
        .values({
          tenantId: user.tenantId,
          accountHolderId: guest?.id ?? null,
          transactionId: transactionId ?? null,
          requestReference,
          requestType,
          requestDate: requestDate.toISOString().split('T')[0],
          requestDescription,
          coolingOffDeadline: coolingOff.toISOString().split('T')[0],
          refundDeadline: refundDeadline.toISOString().split('T')[0],
          status: 'pending',
        })
        .returning({ id: consumerRightsRequests.id, requestReference: consumerRightsRequests.requestReference });

      await recordAuditTrail({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'guest.dsar.submitted',
        resourceType: 'consumer_rights_request',
        resourceId: created.id,
        newValues: { requestType, requestReference },
      });

      securityLogger.info('[DSAR] Request submitted', { requestReference, requestType, tenantId: user.tenantId });

      return NextResponse.json(
        {
          success: true,
          requestReference: created.requestReference,
          message: `Your ${requestType} request has been received. Reference: ${created.requestReference}. We will respond within 30 days.`,
        },
        { status: 201 }
      );
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
      }
      securityLogger.error('[DSAR] Submission error', error);
      return NextResponse.json({ success: false, error: 'Failed to submit request' }, { status: 500 });
    }
  });
}

/** GET /api/guest/dsar — List the authenticated guest's own DSAR requests */
export async function GET(req: NextRequest) {
  return withTenantApiAuth(req, async (_request, user) => {
    try {
      const [guest] = await db
        .select({ id: guests.id })
        .from(guests)
        .where(
          and(
            eq(guests.email, user.email ?? ''),
            eq(guests.tenantId, user.tenantId)
          )
        )
        .limit(1);

      if (!guest) {
        return NextResponse.json({ success: true, requests: [] });
      }

      const requests = await db
        .select({
          id: consumerRightsRequests.id,
          requestReference: consumerRightsRequests.requestReference,
          requestType: consumerRightsRequests.requestType,
          requestDate: consumerRightsRequests.requestDate,
          status: consumerRightsRequests.status,
          resolutionDate: consumerRightsRequests.resolutionDate,
          resolutionNotes: consumerRightsRequests.resolutionNotes,
          createdAt: consumerRightsRequests.createdAt,
        })
        .from(consumerRightsRequests)
        .where(
          and(
            eq(consumerRightsRequests.accountHolderId, guest.id),
            eq(consumerRightsRequests.tenantId, user.tenantId)
          )
        );

      return NextResponse.json({ success: true, requests });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
      }
      securityLogger.error('[DSAR] List error', error);
      return NextResponse.json({ success: false, error: 'Failed to load requests' }, { status: 500 });
    }
  });
}
