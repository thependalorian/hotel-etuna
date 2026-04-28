/**
 * Public Sofia Chat API Route
 * 
 * Purpose: Allow public users to chat with Sofia about specific properties
 * Location: /app/api/public/sofia/chat/route.ts
 * 
 * Features:
 * - No authentication required (public access)
 * - Property context via slug
 * - Limited to public property information only
 * - Rate limiting recommended
 * 
 * Usage:
 * POST /api/public/sofia/chat
 * Body: { slug: "property-slug", message: "user message", sessionId: "optional" }
 */

import { NextResponse, NextRequest } from 'next/server';
import { SofiaConciergeService } from '@/lib/services/ai/SofiaConciergeService';
import { PropertyService } from '@/lib/services/property/PropertyService';
import { AppError } from '@/lib/utils/errors';
import { db, guests } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import * as z from 'zod';

const publicChatSchema = z.object({
  slug: z.string().min(1),
  message: z.string().min(1).max(1000),
  sessionId: z.string().optional(),
  email: z.string().email().optional(), // NEW: Email from client
});

const sofiaService = new SofiaConciergeService();
const propertyService = new PropertyService();

const SENSITIVE_PRICING_PATTERN =
  /\b(price|pricing|rate|rates|cost|costs|nad|availability|available|book|booking)\b/i;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = publicChatSchema.parse(body);

    if (SENSITIVE_PRICING_PATTERN.test(validatedData.message)) {
      return NextResponse.json(
        {
          response:
            'For pricing and availability, please sign up - it only takes a minute!',
          confidence: 1,
          intent: 'auth_required_for_pricing',
          entities: {},
          suggestions: ['Sign up to view room rates', 'Sign in to check availability'],
          actions: [],
        },
        { status: 200 }
      );
    }

    // Get property by slug (public access)
    const property = await propertyService.getPropertyBySlug(validatedData.slug);

    if (!property) {
      return NextResponse.json({ message: 'Property not found' }, { status: 404 });
    }

    // Generate session ID if not provided
    const sessionId = validatedData.sessionId || `public_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Find or create guest if email provided
    let guestId: string | undefined = undefined;
    if (validatedData.email && property.tenantId) {
      try {
        const [existing] = await db.select().from(guests).where(and(eq(guests.tenantId, property.tenantId), eq(guests.email, validatedData.email))).limit(1);
        if (existing) {
          guestId = existing.id;
        } else {
          const [created] = await db.insert(guests).values({ tenantId: property.tenantId, email: validatedData.email }).returning();
          if (created) guestId = created.id;
        }
      } catch (error) {
        console.error('Error finding/creating guest:', error);
      }
    }

    // Build context with public property info only
    if (!property.tenantId) {
      return NextResponse.json({ message: 'Property has no tenant' }, { status: 400 });
    }
    const context = {
      tenantId: property.tenantId,
      propertyId: property.id,
      sessionId,
      guestId, // Include guestId if email provided
    };

    // Process with Sofia (public role)
    const response = await sofiaService.processMessage(
      {
        message: validatedData.message,
        context,
        language: 'en', // Default to English for public
      },
      'public' // Public role - limited data access
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

    console.error('Error in public Sofia chat route:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
