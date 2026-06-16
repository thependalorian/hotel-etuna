/**
 * Guest document vault API — encrypted travel ID storage per stay (Phase 8).
 * Location: app/api/guest/stays/[bookingId]/documents/route.ts
 *
 * GET  response: { data: { documents: GuestDocumentMeta[] } }
 * POST body: { docType, fileName, mimeType, base64Content }
 * POST response: { data: { document: GuestDocumentMeta } }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { assertStayAccess } from '@/lib/services/folio/guestStayAccess';
import { GuestDocumentVaultService } from '@/lib/services/guest/GuestDocumentVaultService';
import { GUEST_API_ROLES } from '@/lib/auth/roles';
import { isValidEntityIdWithMessage } from '@/lib/validation/entity-ids';
import { AppError } from '@/lib/utils/errors';

const vault = new GuestDocumentVaultService();

const uploadSchema = z.object({
  docType: z.enum(['national_id', 'passport', 'visa', 'other']),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(3).max(128),
  base64Content: z.string().min(1).max(7_000_000),
});

type RouteParams = { params: Promise<{ bookingId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(
    request,
    async (_req, user) => {
      const { bookingId } = await params;
      if (!isValidEntityIdWithMessage(bookingId, 'Invalid booking ID')) {
        return errorResponse('Invalid booking ID', 400, 'VALIDATION_ERROR');
      }

      try {
        const ctx = await assertStayAccess(bookingId, user);
        const tenantId = ctx.booking.tenantId;
        if (!tenantId) {
          return errorResponse('Booking tenant missing', 400, 'VALIDATION_ERROR');
        }
        const documents = await vault.listForBooking(tenantId, bookingId);
        return successResponse({ documents });
      } catch (error) {
        if (error instanceof AppError) {
          return errorResponse(error.message, error.statusCode, 'DOCUMENT_VAULT_ERROR');
        }
        throw error;
      }
    },
    { rateLimit: true, requireRole: [...GUEST_API_ROLES] }
  );
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(
    request,
    async (req, user) => {
      const { bookingId } = await params;
      if (!isValidEntityIdWithMessage(bookingId, 'Invalid booking ID')) {
        return errorResponse('Invalid booking ID', 400, 'VALIDATION_ERROR');
      }

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Invalid JSON in request body', 400, 'INVALID_JSON');
      }

      const parsed = uploadSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse(
          'Invalid upload',
          400,
          'VALIDATION_ERROR',
          parsed.error.flatten().fieldErrors
        );
      }

      const allowedMime = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
      ];
      if (!allowedMime.includes(parsed.data.mimeType)) {
        return errorResponse('File type not allowed', 400, 'VALIDATION_ERROR');
      }

      try {
        const ctx = await assertStayAccess(bookingId, user);
        const tenantId = ctx.booking.tenantId;
        if (!tenantId) {
          return errorResponse('Booking tenant missing', 400, 'VALIDATION_ERROR');
        }

        const document = await vault.storeDocument({
          tenantId,
          bookingId,
          guestId: ctx.booking.guestId,
          docType: parsed.data.docType,
          fileName: parsed.data.fileName,
          mimeType: parsed.data.mimeType,
          base64Content: parsed.data.base64Content,
        });

        return successResponse({ document }, 201);
      } catch (error) {
        if (error instanceof AppError) {
          return errorResponse(error.message, error.statusCode, 'DOCUMENT_VAULT_ERROR');
        }
        throw error;
      }
    },
    { rateLimit: true, requireRole: [...GUEST_API_ROLES] }
  );
}
