import { NextResponse, NextRequest } from 'next/server';
import { NamQrService } from '@/lib/services/qr/NAMQRService';
import { securityLogger } from '@/lib/utils/security-logger.client';

const qrService = new NamQrService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrCodeId, scanData } = body;
    
    if (!qrCodeId) {
      return NextResponse.json({ message: 'QR code ID is required' }, { status: 400 });
    }

    const result = await qrService.scanQRCode(qrCodeId, scanData);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    securityLogger.error('Error scanning QR code:', error);
    return NextResponse.json({ 
      message: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
