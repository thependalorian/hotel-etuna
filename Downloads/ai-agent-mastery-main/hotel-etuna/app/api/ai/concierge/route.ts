import { NextResponse, NextRequest } from 'next/server';
import { SofiaConciergeService } from '@/lib/services/ai/SofiaConciergeService';
import { getAuthenticatedUser } from '@/lib/utils/api-helpers';
import { processAiMessageSchema } from '@/lib/utils/validation';
import { AppError } from '@/lib/utils/errors';
import { ZodError } from 'zod';

const sofiaService = new SofiaConciergeService();

async function getSessionUser(req: NextRequest): Promise<{
  id: string;
  email: string;
  role: string;
  tenantId: string; // Guaranteed to be string after validation
  propertyId?: string;
}> {
  const user = await getAuthenticatedUser(req);
  if (!user || !user.id || !user.tenantId) {
    throw new AppError(401, 'Unauthorized');
  }
  return {
    id: user.id,
    email: user.email ?? '',
    role: user.role ?? 'user',
    tenantId: user.tenantId,
    propertyId: user.propertyId,
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    const body = await request.json();

    const validatedData = processAiMessageSchema.parse(body);

    // Build conversation context (tenantId is guaranteed by getSessionUser)
    const context = {
      tenantId: user.tenantId, // Guaranteed to be string by getSessionUser
      propertyId: validatedData.propertyId,
      guestId: validatedData.guestId,
      bookingId: validatedData.bookingId,
      sessionId: validatedData.sessionId,
    };

    // Determine user role (admin, manager, owner = 'admin', others = 'guest')
    const userRole = ['admin', 'manager', 'owner'].includes(user.role) ? 'admin' : 'guest';

    // Process the message with Sofia
    const response = await sofiaService.processMessage(
      {
        message: validatedData.message,
        context,
        language: validatedData.language,
      },
      userRole
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json({ message: 'Invalid input', errors: error.issues }, { status: 400 });
    }
    console.error('Error in AI concierge route:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId') || undefined;

    // Get conversation statistics (tenantId is guaranteed by getSessionUser)
    const stats = await sofiaService.getConversationStats(
      user.tenantId, // TypeScript knows this is string from getSessionUser return type
      propertyId
    );

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}