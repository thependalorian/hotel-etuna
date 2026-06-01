/**
 * Loyalty Rewards Catalog API
 * 
 * GET  /api/crm/loyalty/catalog - List all rewards
 * POST /api/crm/loyalty/catalog - Create new reward (staff only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { LoyaltyService } from '@/lib/services/loyalty/LoyaltyService';
import { getCurrentUserTenantContext } from '@/lib/middleware/withApiAuth';

const loyaltyService = new LoyaltyService();

// List rewards
export async function GET(req: NextRequest) {
  try {
    const context = await getCurrentUserTenantContext();
    
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const availableOnly = searchParams.get('availableOnly') !== 'false';

    const rewards = await loyaltyService.listRewards(context.tenantId, availableOnly);

    return NextResponse.json({
      success: true,
      rewards,
    });
  } catch (error: any) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch rewards' },
      { status: error.status || 500 }
    );
  }
}

// Create reward (staff only)
export async function POST(req: NextRequest) {
  try {
    const context = await getCurrentUserTenantContext();
    
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is staff
    const staffRoles = ['owner', 'manager', 'admin', 'staff'];
    if (!staffRoles.includes(context.user.role)) {
      return NextResponse.json(
        { error: 'Only staff can create rewards' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      description,
      pointsCost,
      valueNad,
      minTier,
      available,
      validFrom,
      validUntil,
      maxRedemptionsPerGuest,
    } = body;

    if (!name || !pointsCost || pointsCost <= 0) {
      return NextResponse.json(
        { error: 'Name and valid points cost are required' },
        { status: 400 }
      );
    }

    const reward = await loyaltyService.createReward(context.tenantId, {
      name,
      description,
      pointsCost: parseInt(pointsCost, 10),
      valueNad: valueNad ? parseFloat(valueNad) : undefined,
      minTier,
      available,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      maxRedemptionsPerGuest: maxRedemptionsPerGuest ? parseInt(maxRedemptionsPerGuest, 10) : undefined,
    });

    return NextResponse.json({
      success: true,
      reward,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating reward:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create reward' },
      { status: error.status || 500 }
    );
  }
}
