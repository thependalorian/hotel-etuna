/**
 * Shared Next.js handlers for authenticated Sofia concierge routes.
 * Location: lib/services/ai/sofia-api-handlers.ts
 *
 * Used by /api/sofia/chat and /api/ai/concierge (DRY).
 */

import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { getAuthenticatedUser } from '@/lib/utils/api-helpers';
import { processAiMessageSchema } from '@/lib/utils/validation';
import { AppError } from '@/lib/utils/errors';
import {
  getSofiaConciergeService,
  processSofiaConciergeMessage,
} from '@/lib/services/ai/sofia-concierge-handler';

function sofiaRouteErrorResponse(error: unknown, logLabel: string): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json({ message: error.message }, { status: error.statusCode });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { message: 'Invalid input', errors: error.issues },
      { status: 400 }
    );
  }
  console.error(logLabel, error);
  return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
}

export async function handleAuthenticatedSofiaPost(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user?.tenantId) {
      throw new AppError(401, 'Unauthorized');
    }

    const validated = processAiMessageSchema.parse(await request.json());

    const aiResponse = await processSofiaConciergeMessage({
      message: validated.message,
      sessionId: validated.sessionId,
      tenantId: user.tenantId,
      sessionRole: user.role,
      propertyId: validated.propertyId ?? user.propertyId,
      guestId: validated.guestId,
      bookingId: validated.bookingId,
      language: validated.language,
      channel: validated.channel,
    });

    return NextResponse.json(aiResponse, { status: 200 });
  } catch (error) {
    return sofiaRouteErrorResponse(error, 'Sofia concierge POST error:');
  }
}

export async function handleAuthenticatedSofiaGet(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user?.tenantId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId') || undefined;

    const stats = await getSofiaConciergeService().getConversationStats(
      user.tenantId,
      propertyId
    );

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    return sofiaRouteErrorResponse(error, 'Sofia concierge GET error:');
  }
}
