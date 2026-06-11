/**
 * Guest financial documents API — list and request PDF resend.
 * Location: app/api/guest/stays/[bookingId]/financial-documents/route.ts
 */

import { NextRequest } from 'next/server';
import {
  withApiAuth,
  errorResponse,
  successResponse,
  validateJsonBody,
} from '@/lib/utils/api-helpers';
import { GUEST_API_ROLES } from '@/lib/auth/roles';
import { assertStayAccess } from '@/lib/services/folio/guestStayAccess';
import { entityId } from '@/lib/validation/entity-ids';
import { guestFinancialDocumentBodySchema } from '@/lib/services/documents/document-types';
import { documentGenerationService } from '@/lib/services/documents/DocumentGenerationService';
import { db, properties } from '@/lib/db';
import { and, eq } from 'drizzle-orm';

export const runtime = 'nodejs';

type RouteParams = { params: Promise<{ bookingId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(
    request,
    async (req, user) => {
      const { bookingId } = await params;
      const idCheck = entityId('Invalid booking ID').safeParse(bookingId);
      if (!idCheck.success) {
        return errorResponse('Invalid booking ID', 400, 'VALIDATION_ERROR');
      }

      await assertStayAccess(bookingId, user);
      const rows = await documentGenerationService.listForBooking(user.tenantId!, bookingId);
      return successResponse(rows);
    },
    { rateLimit: true, requireRole: [...GUEST_API_ROLES, 'owner', 'manager', 'admin', 'staff', 'desk'] }
  );
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(
    request,
    async (req, user) => {
      const { bookingId } = await params;
      const idCheck = entityId('Invalid booking ID').safeParse(bookingId);
      if (!idCheck.success) {
        return errorResponse('Invalid booking ID', 400, 'VALIDATION_ERROR');
      }

      await assertStayAccess(bookingId, user);
      const body = await validateJsonBody(req, guestFinancialDocumentBodySchema);

      const [property] = await db
        .select({ ownerId: properties.ownerId })
        .from(properties)
        .where(eq(properties.tenantId, user.tenantId!))
        .limit(1);

      const generatedBy = user.id || property?.ownerId;
      if (!generatedBy) {
        return errorResponse('Cannot resolve document author', 500, 'INTERNAL_ERROR');
      }

      await documentGenerationService.generateAndEmail({
        tenantId: user.tenantId!,
        bookingId,
        documentType: body.documentType,
        generatedBy,
        transactionId: body.transactionId,
      });

      return successResponse({ ok: true });
    },
    { rateLimit: true, requireRole: [...GUEST_API_ROLES, 'owner', 'manager', 'admin', 'staff', 'desk'] }
  );
}
