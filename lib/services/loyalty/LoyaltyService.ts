/**
 * LoyaltyService — reward catalog, ledger, redemptions
 *
 * Purpose: Manage loyalty transactions, rewards, and tier progression
 * Location: /lib/services/loyalty/LoyaltyService.ts
 */

import { db, loyaltyTransactions, loyaltyRewards, loyaltyRedemptions, guestProfiles, guests } from '@/lib/db';
import type { LoyaltyTransaction, LoyaltyReward, LoyaltyRedemption, GuestProfile } from '@/lib/db/schema';
import { AppError, handleServiceError } from '@/lib/utils/errors';
import { and, eq, desc, sql } from 'drizzle-orm';

// Points earning: 1 point per N$10 spent
const POINTS_PER_NAD = 0.1;

// Redemption: 100 points = N$50
const POINTS_TO_NAD_RATIO = 0.5;

export interface LoyaltyBalance {
  points: number;
  tier: string;
  tierOrder: number;
  nextTier?: string;
  pointsToNextTier?: number;
}

export interface RewardRedemptionInput {
  guestId: string;
  rewardId: string;
  tenantId: string;
}

export class LoyaltyService {
  /**
   * Calculate points earned from a folio amount
   */
  calculatePointsEarned(amountNad: number): number {
    return Math.floor(amountNad * POINTS_PER_NAD);
  }

  /**
   * Calculate NAD value of points
   */
  calculatePointsValue(points: number): number {
    return Math.round(points * POINTS_TO_NAD_RATIO * 100) / 100;
  }

  /**
   * Record a loyalty transaction (earn, burn, adjustment)
   */
  async recordTransaction(
    tenantId: string,
    guestId: string,
    type: 'earn' | 'burn' | 'adjustment' | 'tier_bonus',
    pointsDelta: number,
    description: string,
    bookingId?: string,
    rewardId?: string,
    staffUserId?: string
  ): Promise<LoyaltyTransaction> {
    try {
      // Get guest profile
      const profile = await db
        .select()
        .from(guestProfiles)
        .where(and(eq(guestProfiles.tenantId, tenantId), eq(guestProfiles.guestId, guestId)))
        .limit(1);

      if (!profile[0]) {
        throw new AppError(404, 'Guest profile not found');
      }

      const pointsBefore = profile[0].loyaltyPoints || 0;
      const pointsAfter = pointsBefore + pointsDelta;

      if (pointsAfter < 0) {
        throw new AppError(400, 'Insufficient points balance');
      }

      // Insert transaction
      const [transaction] = await db
        .insert(loyaltyTransactions)
        .values({
          tenantId,
          guestId,
          guestProfileId: profile[0].id,
          transactionType: type,
          pointsDelta,
          pointsBefore,
          pointsAfter,
          description,
          bookingId,
          rewardId,
          staffUserId,
        })
        .returning();

      // Update guest profile points
      await db
        .update(guestProfiles)
        .set({
          loyaltyPoints: pointsAfter,
          updatedAt: new Date(),
        })
        .where(eq(guestProfiles.id, profile[0].id));

      return transaction;
    } catch (error) {
      return handleServiceError(error, 'Error recording loyalty transaction');
    }
  }

  /**
   * Get guest loyalty balance and tier info
   */
  async getGuestBalance(guestId: string, tenantId: string): Promise<LoyaltyBalance> {
    try {
      const profile = await db
        .select()
        .from(guestProfiles)
        .where(and(eq(guestProfiles.tenantId, tenantId), eq(guestProfiles.guestId, guestId)))
        .limit(1);

      if (!profile[0]) {
        throw new AppError(404, 'Guest profile not found');
      }

      // Get tier info from database function (created in migration)
      const tierInfoResult = await db.execute(sql`
        SELECT * FROM get_guest_tier_info(${tenantId}, ${profile[0].id})
      `);

      const tierInfo = (tierInfoResult.rows[0] as any) || {
        current_tier: profile[0].loyaltyTier || 'bronze',
        current_points: profile[0].loyaltyPoints || 0,
        next_tier: null,
        points_to_next_tier: null,
      };

      const tierOrderMap: Record<string, number> = {
        bronze: 1,
        silver: 2,
        gold: 3,
        platinum: 4,
      };

      return {
        points: tierInfo.current_points,
        tier: tierInfo.current_tier,
        tierOrder: tierOrderMap[tierInfo.current_tier] || 1,
        nextTier: tierInfo.next_tier,
        pointsToNextTier: tierInfo.points_to_next_tier > 0 ? tierInfo.points_to_next_tier : undefined,
      };
    } catch (error) {
      return handleServiceError(error, 'Error fetching loyalty balance');
    }
  }

  /**
   * Get guest transaction history
   */
  async getGuestTransactions(guestId: string, tenantId: string, limit = 50): Promise<LoyaltyTransaction[]> {
    try {
      return await db
        .select()
        .from(loyaltyTransactions)
        .where(and(eq(loyaltyTransactions.tenantId, tenantId), eq(loyaltyTransactions.guestId, guestId)))
        .orderBy(desc(loyaltyTransactions.createdAt))
        .limit(limit);
    } catch (error) {
      return handleServiceError(error, 'Error fetching loyalty transactions');
    }
  }

  /**
   * List all loyalty rewards (catalog)
   */
  async listRewards(tenantId: string, availableOnly = true): Promise<LoyaltyReward[]> {
    try {
      const conditions = [eq(loyaltyRewards.tenantId, tenantId)];
      if (availableOnly) {
        conditions.push(eq(loyaltyRewards.available, true));
      }

      return await db.select().from(loyaltyRewards).where(and(...conditions)).orderBy(loyaltyRewards.pointsCost);
    } catch (error) {
      return handleServiceError(error, 'Error fetching loyalty rewards');
    }
  }

  /**
   * Get a single reward
   */
  async getReward(rewardId: string, tenantId: string): Promise<LoyaltyReward> {
    try {
      const result = await db
        .select()
        .from(loyaltyRewards)
        .where(and(eq(loyaltyRewards.id, rewardId), eq(loyaltyRewards.tenantId, tenantId)))
        .limit(1);

      if (!result[0]) {
        throw new AppError(404, 'Reward not found');
      }

      return result[0];
    } catch (error) {
      return handleServiceError(error, 'Error fetching reward');
    }
  }

  /**
   * Create a reward (staff only)
   */
  async createReward(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      pointsCost: number;
      valueNad?: number;
      minTier?: string;
      available?: boolean;
      validFrom?: Date;
      validUntil?: Date;
      maxRedemptionsPerGuest?: number;
    }
  ): Promise<LoyaltyReward> {
    try {
      const [reward] = await db
        .insert(loyaltyRewards)
        .values({
          tenantId,
          name: data.name,
          description: data.description,
          pointsCost: data.pointsCost,
          valueNad: data.valueNad != null ? String(data.valueNad) : undefined,
          minTier: data.minTier,
          available: data.available,
          validFrom: data.validFrom,
          validUntil: data.validUntil,
          maxRedemptionsPerGuest: data.maxRedemptionsPerGuest,
        })
        .returning();

      return reward;
    } catch (error) {
      return handleServiceError(error, 'Error creating reward');
    }
  }

  /**
   * Update a reward (staff only)
   */
  async updateReward(
    rewardId: string,
    tenantId: string,
    data: Partial<{
      name: string;
      description: string;
      pointsCost: number;
      valueNad: number;
      minTier: string;
      available: boolean;
      validFrom: Date;
      validUntil: Date;
      maxRedemptionsPerGuest: number;
    }>
  ): Promise<LoyaltyReward> {
    try {
      const updateFields: Record<string, unknown> = {};
      if (data.name !== undefined) updateFields.name = data.name;
      if (data.description !== undefined) updateFields.description = data.description;
      if (data.pointsCost !== undefined) updateFields.pointsCost = data.pointsCost;
      if (data.valueNad !== undefined) updateFields.valueNad = String(data.valueNad);
      if (data.minTier !== undefined) updateFields.minTier = data.minTier;
      if (data.available !== undefined) updateFields.available = data.available;
      if (data.validFrom !== undefined) updateFields.validFrom = data.validFrom;
      if (data.validUntil !== undefined) updateFields.validUntil = data.validUntil;
      if (data.maxRedemptionsPerGuest !== undefined) updateFields.maxRedemptionsPerGuest = data.maxRedemptionsPerGuest;

       
      const [reward] = await db
        .update(loyaltyRewards)
        .set({ ...updateFields, updatedAt: new Date() } as any)
        .where(and(eq(loyaltyRewards.id, rewardId), eq(loyaltyRewards.tenantId, tenantId)))
        .returning();

      if (!reward) {
        throw new AppError(404, 'Reward not found');
      }

      return reward;
    } catch (error) {
      return handleServiceError(error, 'Error updating reward');
    }
  }

  /**
   * Redeem a reward (guest action)
   */
  async redeemReward(input: RewardRedemptionInput): Promise<LoyaltyRedemption> {
    try {
      const { guestId, rewardId, tenantId } = input;

      // Validate reward exists and is available
      const reward = await this.getReward(rewardId, tenantId);
      if (!reward.available) {
        throw new AppError(400, 'This reward is no longer available');
      }

      // Check guest balance
      const balance = await this.getGuestBalance(guestId, tenantId);
      if (balance.points < reward.pointsCost) {
        throw new AppError(400, `Insufficient points. You have ${balance.points}, need ${reward.pointsCost}`);
      }

      // Check tier restriction
      if (reward.minTier) {
        const tierOrderMap: Record<string, number> = {
          bronze: 1,
          silver: 2,
          gold: 3,
          platinum: 4,
        };
        const requiredOrder = tierOrderMap[reward.minTier] || 1;
        if (balance.tierOrder < requiredOrder) {
          throw new AppError(400, `This reward requires ${reward.minTier} tier or higher`);
        }
      }

      // Check validity period
      const now = new Date();
      if (reward.validFrom && now < new Date(reward.validFrom)) {
        throw new AppError(400, 'This reward is not yet available');
      }
      if (reward.validUntil && now > new Date(reward.validUntil)) {
        throw new AppError(400, 'This reward has expired');
      }

      // Check max redemptions per guest
      if (reward.maxRedemptionsPerGuest) {
        const existingRedemptions = await db
          .select({ count: sql<number>`count(*)` })
          .from(loyaltyRedemptions)
          .where(
            and(
              eq(loyaltyRedemptions.guestId, guestId),
              eq(loyaltyRedemptions.rewardId, rewardId),
              eq(loyaltyRedemptions.tenantId, tenantId)
            )
          );

        const count = Number(existingRedemptions[0]?.count || 0);
        if (count >= reward.maxRedemptionsPerGuest) {
          throw new AppError(400, 'You have reached the maximum redemptions for this reward');
        }
      }

      // Record burn transaction
      const transaction = await this.recordTransaction(
        tenantId,
        guestId,
        'burn',
        -reward.pointsCost,
        `Redeemed: ${reward.name}`,
        undefined,
        rewardId
      );

      // Create redemption record
      const [redemption] = await db
        .insert(loyaltyRedemptions)
        .values({
          tenantId,
          guestId,
          rewardId,
          transactionId: transaction.id,
          pointsSpent: reward.pointsCost,
          status: 'pending',
        })
        .returning();

      return redemption;
    } catch (error) {
      return handleServiceError(error, 'Error redeeming reward');
    }
  }

  /**
   * List guest redemptions
   */
  async getGuestRedemptions(guestId: string, tenantId: string): Promise<LoyaltyRedemption[]> {
    try {
      return await db
        .select()
        .from(loyaltyRedemptions)
        .where(and(eq(loyaltyRedemptions.tenantId, tenantId), eq(loyaltyRedemptions.guestId, guestId)))
        .orderBy(desc(loyaltyRedemptions.createdAt));
    } catch (error) {
      return handleServiceError(error, 'Error fetching redemptions');
    }
  }

  /**
   * Update redemption status (staff only)
   */
  async updateRedemptionStatus(
    redemptionId: string,
    tenantId: string,
    status: 'pending' | 'fulfilled' | 'cancelled',
    fulfilledByUserId?: string,
    notes?: string
  ): Promise<LoyaltyRedemption> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (status === 'fulfilled' && fulfilledByUserId) {
        updateData.fulfilledByUserId = fulfilledByUserId;
        updateData.fulfilledAt = new Date();
      }

      if (notes) {
        updateData.notes = notes;
      }

      const [redemption] = await db
        .update(loyaltyRedemptions)
        .set(updateData)
        .where(and(eq(loyaltyRedemptions.id, redemptionId), eq(loyaltyRedemptions.tenantId, tenantId)))
        .returning();

      if (!redemption) {
        throw new AppError(404, 'Redemption not found');
      }

      // If cancelled, refund points
      if (status === 'cancelled') {
        const reward = await this.getReward(redemption.rewardId, tenantId);
        await this.recordTransaction(
          tenantId,
          redemption.guestId,
          'adjustment',
          reward.pointsCost,
          `Refund: ${reward.name} redemption cancelled`
        );
      }

      return redemption;
    } catch (error) {
      return handleServiceError(error, 'Error updating redemption status');
    }
  }
}
