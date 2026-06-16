/**
 * @fileoverview API route //api/qr
 * Location: /app/api/qr/route.ts
 */

import { NextRequest } from 'next/server';
import {
  withPlatformApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { NamQrService } from '@/lib/services/qr/NAMQRService';
import { securityLogger } from '@/lib/utils/security-logger';

const qrService = new NamQrService();

export async function POST(request: NextRequest) {
  return withPlatformApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      try {
        const body = await req.json();

        if (body.type === 'bulk') {
          const results = await qrService.generateBulkQRCodes(
            user.tenantId,
            body.propertyId,
            body.entityType,
            body.entityIds,
            body.qrType
          );
          return successResponse(results, 201);
        }

        const qrCode = await qrService.generateQRCode({
          ...body,
          tenantId: user.tenantId,
        });
        return successResponse(qrCode, 201);
      } catch (error) {
        securityLogger.error('Error generating QR code:', error);
        return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
      }
    },
    { rateLimit: true }
  );
}

export async function GET(request: NextRequest) {
  return withPlatformApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      try {
        const { searchParams } = new URL(req.url);
        const propertyId = searchParams.get('propertyId');
        const entityType = searchParams.get('entityType') as 'room' | 'table' | undefined;
        const qrType = searchParams.get('qrType');
        const isActive =
          searchParams.get('isActive') === 'true'
            ? true
            : searchParams.get('isActive') === 'false'
              ? false
              : undefined;

        if (propertyId) {
          const filters: {
            entityType?: 'room' | 'table';
            qrType?: string;
            isActive?: boolean;
          } = {
            ...(entityType && { entityType }),
            ...(qrType && { qrType }),
            ...(isActive !== undefined && { isActive }),
          };
          const qrCodes = await qrService.getQRCodesByProperty(
            propertyId,
            user.tenantId,
            filters
          );
          return successResponse(qrCodes);
        }

        const stats = await qrService.getQRStats(user.tenantId);
        return successResponse(stats);
      } catch (error) {
        securityLogger.error('Error fetching QR codes:', error);
        return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
      }
    },
    { rateLimit: true }
  );
}
