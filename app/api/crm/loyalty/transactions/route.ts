/**
 * Loyalty Transactions Ledger API
 * 
 * GET /api/crm/loyalty/transactions - List all transactions (staff only, cross-guest)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, loyaltyTransactions, guests } from '@/lib/db';
import { withTenantApiAuth } from '@/lib/utils/api-helpers';
import { and, eq, desc } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger';

export async function GET(req: NextRequest) {
  return withTenantApiAuth(req, async (request, context) => {
    try {
      // Staff-only endpoint
      const staffRoles = ['owner', 'manager', 'admin', 'staff'];
      if (!staffRoles.includes(context.role)) {
        return NextResponse.json(
          { error: 'Only staff can view all loyalty transactions' },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(request.url);
      const guestId = searchParams.get('guestId');
      const transactionType = searchParams.get('type');
      const limit = parseInt(searchParams.get('limit') || '100', 10);

      // Build query
      const conditions = [eq(loyaltyTransactions.tenantId, context.tenantId)];
      
      if (guestId) {
        conditions.push(eq(loyaltyTransactions.guestId, guestId));
      }
      
      if (transactionType) {
        conditions.push(eq(loyaltyTransactions.transactionType, transactionType));
      }

      // Fetch transactions with guest info
      const transactions = await db
        .select({
          id: loyaltyTransactions.id,
          tenantId: loyaltyTransactions.tenantId,
          guestId: loyaltyTransactions.guestId,
          guestProfileId: loyaltyTransactions.guestProfileId,
          transactionType: loyaltyTransactions.transactionType,
          pointsDelta: loyaltyTransactions.pointsDelta,
          pointsBefore: loyaltyTransactions.pointsBefore,
          pointsAfter: loyaltyTransactions.pointsAfter,
          bookingId: loyaltyTransactions.bookingId,
          rewardId: loyaltyTransactions.rewardId,
          description: loyaltyTransactions.description,
          staffUserId: loyaltyTransactions.staffUserId,
          createdAt: loyaltyTransactions.createdAt,
          guestFirstName: guests.firstName,
          guestLastName: guests.lastName,
          guestEmail: guests.email,
        })
        .from(loyaltyTransactions)
        .leftJoin(guests, eq(loyaltyTransactions.guestId, guests.id))
        .where(and(...conditions))
        .orderBy(desc(loyaltyTransactions.createdAt))
        .limit(limit);

      // Calculate summary stats
      const totalEarned = transactions
        .filter(t => t.transactionType === 'earn')
        .reduce((sum, t) => sum + (t.pointsDelta || 0), 0);

      const totalBurned = transactions
        .filter(t => t.transactionType === 'burn')
        .reduce((sum, t) => sum + Math.abs(t.pointsDelta || 0), 0);

      return NextResponse.json({
        success: true,
        transactions,
        summary: {
          totalTransactions: transactions.length,
          totalEarned,
          totalBurned,
          netPoints: totalEarned - totalBurned,
        },
      });
    } catch (error: any) {
      securityLogger.error('Error fetching transactions:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch transactions' },
        { status: error.status || 500 }
      );
    }
  });
}
