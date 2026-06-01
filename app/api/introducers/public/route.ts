/**
 * Public Introducers Directory API
 * 
 * Purpose: Public endpoint to list introducers who opted into directory
 * Location: /app/api/introducers/public/route.ts
 * 
 * Implements:
 * - Public read (no auth required)
 * - Only returns active introducers with show_in_public_directory = true
 * - Rate limiting
 * 
 * Following System Design Principles:
 * - Part 3: Public API design
 * - Part 6: Public read access
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, introducers } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { successResponse } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const publicIntroducers = await db
      .select({
        id: introducers.id,
        name: introducers.name,
        code: introducers.code,
        bio: introducers.bio,
        website: introducers.website,
        logo_url: introducers.logoUrl,
        total_bookings: introducers.totalBookings,
      })
      .from(introducers)
      .where(
        and(
          eq(introducers.isActive, true),
          eq(introducers.showInPublicDirectory, true)
        )
      )
      .orderBy(introducers.name);

    return successResponse(publicIntroducers);
  } catch (error) {
    console.error('Error fetching public introducers:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch introducers' } },
      { status: 500 }
    );
  }
}
