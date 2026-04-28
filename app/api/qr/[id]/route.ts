import { NextResponse, NextRequest } from 'next/server';
import { NamQrService } from '@/lib/services/qr/NAMQRService';
import { getAuthenticatedUser } from '@/lib/utils/api-helpers';

const qrService = new NamQrService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser(request);

    if (!user || !user.tenantId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const qrCode = await qrService.getQRCodeById(id, user.tenantId);
    
    if (!qrCode) {
      return NextResponse.json({ message: 'QR code not found' }, { status: 404 });
    }

    return NextResponse.json(qrCode, { status: 200 });
  } catch (error) {
    console.error('Error fetching QR code:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser(request);

    if (!user || !user.tenantId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const qrCode = await qrService.updateQRCode(id, user.tenantId, body);
    
    if (!qrCode) {
      return NextResponse.json({ message: 'QR code not found' }, { status: 404 });
    }

    return NextResponse.json(qrCode, { status: 200 });
  } catch (error) {
    console.error('Error updating QR code:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser(request);

    if (!user || !user.tenantId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const result = await qrService.deleteQRCode(id, user.tenantId);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error deleting QR code:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
