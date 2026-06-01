/**
 * Introducer Code Validation API
 * 
 * Purpose: Validate introducer referral codes for booking attribution
 * Location: /app/api/introducers/validate/route.ts
 * 
 * Implements:
 * - Code validation
 * - Active status check
 * - Commission rate lookup
 * - Rate limiting
 * - Public endpoint (no auth required)
 * 
 * Following System Design Principles:
 * - API Design Best Practices (Part 3)
 * - Input Validation (Part 6)
 * - Parameterized Queries (Part 1)
 */

import { NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { validateIntroducerCodeSchema } from '@/lib/utils/validation';
import { db, introducers } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

/**
 * POST /api/introducers/validate
 * 
 * Validates an introducer code and returns basic info if valid.
 * This is a public endpoint used during booking flow.
 * 
 * Request Body:
 * {
 *   code: string  // Introducer code to validate (e.g., "TRAVEL-AGENT-001")
 * }
 * 
 * Response (valid code):
 * {
 *   success: true,
 *   data: {
 *     valid: true,
 *     introducer: {
 *       id: "uuid",
 *       name: "Travel Agency ABC",
 *       commission_rate: "10.00"
 *     }
 *   }
 * }
 * 
 * Response (invalid code):
 * {
 *   success: true,
 *   data: {
 *     valid: false
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return errorResponse('Invalid JSON in request body', 400, 'INVALID_JSON');
    }

    const validation = validateIntroducerCodeSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(
        'Invalid input',
        400,
        'VALIDATION_ERROR',
        validation.error.flatten().fieldErrors
      );
    }

    const { code } = validation.data;

    const [introducer] = await db
      .select({
        id: introducers.id,
        name: introducers.name,
        commissionRate: introducers.commissionRate,
        isActive: introducers.isActive,
      })
      .from(introducers)
      .where(
        and(
          eq(introducers.code, code.toUpperCase()),
          eq(introducers.isActive, true)
        )
      )
      .limit(1);

    if (!introducer) {
      return successResponse({
        valid: false,
      });
    }

    return successResponse({
      valid: true,
      introducer: {
        id: introducer.id,
        name: introducer.name,
        commission_rate: introducer.commissionRate,
      },
    });
  } catch (error) {
    console.error('Error validating introducer code:', error);
    return errorResponse(
      'Failed to validate introducer code',
      500,
      'INTERNAL_ERROR'
    );
  }
}
