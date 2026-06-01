/**
 * Desk Search API — Search bookings and guests
 * Location: app/api/desk/search/route.ts
 *
 * Purpose: Unified search endpoint for front desk operations
 * - Search by guest name, email, phone
 * - Search by booking ID
 * - Returns booking details with guest information
 *
 * Query params:
 * - q: search query (required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getSessionWithTenantContext } from '@/lib/auth/session';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    // Auth: staff only
    const session = await getSessionWithTenantContext();
    if (!session?.user || !session?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get search query
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim() === '') {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const searchTerm = `%${query.trim()}%`;

    // Search bookings and guests
    // Match on: guest name, email, phone, or booking ID
    const results = await sql`
      SELECT 
        b.id,
        b.check_in_date AS "checkInDate",
        b.check_out_date AS "checkOutDate",
        b.status,
        b.payment_method AS "paymentMethod",
        b.total_amount AS "totalAmount",
        b.is_walk_in AS "isWalkIn",
        b.booking_source AS "bookingSource",
        g.name AS "guestName",
        g.email,
        g.phone,
        r.name AS "roomName",
        r.room_number AS "roomNumber"
      FROM bookings b
      LEFT JOIN guests g ON b.guest_id = g.id
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE 
        b.tenant_id = ${session.tenantId}
        AND (
          g.name ILIKE ${searchTerm}
          OR g.email ILIKE ${searchTerm}
          OR g.phone ILIKE ${searchTerm}
          OR b.id::text ILIKE ${searchTerm}
        )
      ORDER BY b.created_at DESC
      LIMIT 20
    `;

    return NextResponse.json({
      results: results || [],
      count: results?.length || 0,
    });
  } catch (error) {
    console.error('Desk search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
