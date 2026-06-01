/**
 * Single Reward API
 * 
 * GET   /api/crm/loyalty/catalog/[id] - Get reward details
 * PATCH /api/crm/loyalty/catalog/[id] - Update reward (staff only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { LoyaltyService } from '@/lib/services/loyalty/LoyaltyService';
import { getCurrentUserTenantContext } from '@/lib/middleware/withApiAuth';

const loyaltyService = new LoyaltyService();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getCurrentUserTenantContext();
    
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reward = await loyaltyService.getReward(params.id, context.tenantId);

    return NextResponse.json({
      success: true,
      reward,
    });
  } catch (error: any) {
    console.error('Error fetching reward:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reward' },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getCurrentUserTenantContext();
    
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is staff
    const staffRoles = ['owner', 'manager', 'admin', 'staff'];
    if (!staffRoles.includes(context.user.role)) {
      return NextResponse.json(
        { error: 'Only staff can update rewards' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.pointsCost !== undefined) updateData.pointsCost = parseInt(body.pointsCost, 10);
    if (body.valueNad !== undefined) updateData.valueNad = parseFloat(body.valueNad);
    if (body.minTier !== undefined) updateData.minTier = body.minTier;
    if (body.available !== undefined) updateData.available = body.available;
    if (body.validFrom !== undefined) updateData.validFrom = new Date(body.validFrom);
    if (body.validUntil !== undefined) updateData.validUntil = new Date(body.validUntil);
    if (body.maxRedemptionsPerGuest !== undefined) {
      updateData.maxRedemptionsPerGuest = parseInt(body.maxRedemptionsPerGuest, 10);
    }

    const reward = await loyaltyService.updateReward(params.id, context.tenantId, updateData);

    return NextResponse.json({
      success: true,
      reward,
    });
  } catch (error: any) {
    console.error('Error updating reward:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update reward' },
      { status: error.status || 500 }
    );
  }
}
