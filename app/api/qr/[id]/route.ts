import { NextRequest } from 'next/server';
import {
  withPlatformApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { NamQrService } from '@/lib/services/qr/NAMQRService';
import { securityLogger } from '@/lib/utils/security-logger';

const qrService = new NamQrService();

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withPlatformApiAuth(
    request,
    async (_req, user) => {
      if (!user.tenantId) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      try {
        const { id } = await params;
        const qrCode = await qrService.getQRCodeById(id, user.tenantId);

        if (!qrCode) {
          return errorResponse('QR code not found', 404, 'NOT_FOUND');
        }

        return successResponse(qrCode);
      } catch (error) {
        securityLogger.error('Error fetching QR code:', error);
        return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
      }
    },
    { rateLimit: true }
  );
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withPlatformApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      try {
        const { id } = await params;
        const body = await req.json();
        const qrCode = await qrService.updateQRCode(id, user.tenantId, body);

        if (!qrCode) {
          return errorResponse('QR code not found', 404, 'NOT_FOUND');
        }

        return successResponse(qrCode);
      } catch (error) {
        securityLogger.error('Error updating QR code:', error);
        return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
      }
    },
    { rateLimit: true }
  );
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withPlatformApiAuth(
    request,
    async (_req, user) => {
      if (!user.tenantId) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      try {
        const { id } = await params;
        const result = await qrService.deleteQRCode(id, user.tenantId);
        return successResponse(result);
      } catch (error) {
        securityLogger.error('Error deleting QR code:', error);
        return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
      }
    },
    { rateLimit: true }
  );
}
