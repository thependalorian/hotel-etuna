/**
 * GET /api/documents/[id]/download — re-render PDF from metadata snapshot.
 * Location: app/api/documents/[id]/download/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db, generatedDocuments } from '@/lib/db';
import {
  withApiAuth,
  errorResponse,
} from '@/lib/utils/api-helpers';
import { DOCUMENT_STAFF_ROLES } from '@/lib/services/documents/document-types';
import { GUEST_API_ROLES } from '@/lib/auth/roles';
import { documentGenerationService } from '@/lib/services/documents/DocumentGenerationService';
import { assertStayAccess } from '@/lib/services/folio/guestStayAccess';
import { isGuestConsumerRole } from '@/lib/auth/roles';

export const runtime = 'nodejs';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(
    request,
    async (req, user) => {
      const { id } = await params;

      const [row] = await db
        .select()
        .from(generatedDocuments)
        .where(
          and(eq(generatedDocuments.id, id), eq(generatedDocuments.tenantId, user.tenantId!))
        )
        .limit(1);

      if (!row) {
        return errorResponse('Document not found', 404, 'NOT_FOUND');
      }

      if (isGuestConsumerRole(user.role)) {
        await assertStayAccess(row.bookingId, user);
      }

      const buffer = await documentGenerationService.regenerateFromRecord(id, user.tenantId!);

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${row.referenceNumber}.pdf"`,
          'X-Document-Reference': row.referenceNumber,
        },
      });
    },
    { rateLimit: true, requireRole: [...DOCUMENT_STAFF_ROLES, 'admin', ...GUEST_API_ROLES] }
  );
}
