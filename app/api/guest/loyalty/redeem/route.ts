/**
 * Guest Loyalty Redemption API
 * 
 * POST /api/guest/loyalty/redeem - Redeem points for a reward
 */

import { NextRequest, NextResponse } from 'next/server';
import { LoyaltyService } from '@/lib/services/loyalty/LoyaltyService';
import { db, guests } from '@/lib/db';
import { withTenantApiAuth } from '@/lib/utils/api-helpers';
import { and, eq } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger';

const loyaltyService = new LoyaltyService();

export async function POST(req: NextRequest) {
  return withTenantApiAuth(req, async (request, context) => {
    try {
      const body = await request.json();
      const { rewardId } = body;

      if (!rewardId) {
        return NextResponse.json(
          { error: 'Reward ID is required' },
          { status: 400 }
        );
      }

      // Find guest by email
      const guestResult = await db
        .select()
        .from(guests)
        .where(
          and(
            eq(guests.email, (context.email ?? '').toLowerCase()),
            eq(guests.tenantId, context.tenantId)
          )
        )
        .limit(1);

      if (!guestResult[0]) {
        return NextResponse.json(
          { error: 'Guest profile not found' },
          { status: 404 }
        );
      }

      const guest = guestResult[0];

      // Redeem the reward
      const redemption = await loyaltyService.redeemReward({
        guestId: guest.id,
        rewardId,
        tenantId: context.tenantId,
      });

      // Get updated balance
      const balance = await loyaltyService.getGuestBalance(guest.id, context.tenantId);

      return NextResponse.json({
        success: true,
        redemption,
        balance,
        message: 'Reward redeemed successfully',
      }, { status: 201 });
    } catch (error: any) {
      securityLogger.error('Error redeeming reward:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to redeem reward' },
        { status: error.status || 500 }
      );
    }
  });
}
