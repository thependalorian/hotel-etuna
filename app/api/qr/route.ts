import { NextResponse, NextRequest } from 'next/server';
import { NamQrService } from '@/lib/services/qr/NAMQRService';
import { getAuthenticatedUser } from '@/lib/utils/api-helpers';
import { securityLogger } from '@/lib/utils/security-logger.client';

const qrService = new NamQrService();

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || !user.tenantId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    if (body.type === 'bulk') {
      const results = await qrService.generateBulkQRCodes(
        user.tenantId,
        body.propertyId,
        body.entityType,
        body.entityIds,
        body.qrType
      );
      return NextResponse.json(results, { status: 201 });
    } else {
      const qrCode = await qrService.generateQRCode({
        ...body,
        tenantId: user.tenantId,
      });
      return NextResponse.json(qrCode, { status: 201 });
    }
  } catch (error) {
    securityLogger.error('Error generating QR code:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || !user.tenantId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const entityType = searchParams.get('entityType') as 'room' | 'table' | undefined;
    const qrType = searchParams.get('qrType');
    const isActive = searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined;

    if (propertyId) {
      const filters: {
        entityType?: "room" | "table";
        qrType?: string;
        isActive?: boolean;
      } = {
        ...(entityType && { entityType }),
        ...(qrType && { qrType }),
        ...(isActive !== undefined && { isActive }),
      };
      const qrCodes = await qrService.getQRCodesByProperty(propertyId, user.tenantId, filters);
      return NextResponse.json(qrCodes, { status: 200 });
    } else {
      const stats = await qrService.getQRStats(user.tenantId);
      return NextResponse.json(stats, { status: 200 });
    }
  } catch (error) {
    securityLogger.error('Error fetching QR codes:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
