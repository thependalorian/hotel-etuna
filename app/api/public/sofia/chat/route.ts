/**
 * @fileoverview API route //api/public/sofia/chat
 * Location: /app/api/public/sofia/chat/route.ts
 */

/**
 * Public Sofia Chat API Route
 * Location: /app/api/public/sofia/chat/route.ts
 */

import { NextResponse, NextRequest } from 'next/server';
import { PropertyService } from '@/lib/services/property/PropertyService';
import { AppError } from '@/lib/utils/errors';
import * as z from 'zod';
import { securityLogger } from '@/lib/utils/security-logger';
import {
  findOrCreateGuestIdByEmail,
  processSofiaConciergeMessage,
} from '@/lib/services/ai/sofia-concierge-handler';

const publicChatSchema = z.object({
  slug: z.string().min(1),
  message: z.string().min(1).max(1000),
  sessionId: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
});

const propertyService = new PropertyService();

export async function POST(request: NextRequest) {
  try {
    const validatedData = publicChatSchema.parse(await request.json());

    const property = await propertyService.getPropertyBySlug(validatedData.slug);
    if (!property) {
      return NextResponse.json({ message: 'Property not found' }, { status: 404 });
    }
    if (!property.tenantId) {
      return NextResponse.json({ message: 'Property has no tenant' }, { status: 400 });
    }

    const sessionId =
      validatedData.sessionId ||
      `public_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    const guestId = validatedData.email
      ? await findOrCreateGuestIdByEmail(property.tenantId, validatedData.email)
      : undefined;

    const response = await processSofiaConciergeMessage(
      {
        message: validatedData.message,
        sessionId,
        tenantId: property.tenantId,
        sessionRole: 'public',
        propertyId: property.id,
        guestId,
        language: 'en',
        channel: 'WEB',
      },
      'public'
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input', errors: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    securityLogger.error('Error in public Sofia chat route:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
