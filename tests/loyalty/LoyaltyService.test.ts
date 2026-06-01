/**
 * LoyaltyService Integration Tests
 * 
 * Purpose: Test loyalty transactions, rewards, and redemptions
 * Location: /tests/loyalty/LoyaltyService.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { LoyaltyService } from '@/lib/services/loyalty/LoyaltyService';
import { db, tenants, guests, guestProfiles, loyaltyRewards } from '@/lib/db';
import { eq } from 'drizzle-orm';

describe('LoyaltyService', () => {
  const loyaltyService = new LoyaltyService();
  let testTenantId: string;
  let testGuestId: string;

  beforeAll(async () => {
    // Create test tenant
    const [tenant] = await db
      .insert(tenants)
      .values({
        name: 'Test Loyalty Tenant',
        subdomain: 'test-loyalty',
      })
      .returning();
    testTenantId = tenant.id;

    // Create test guest
    const [guest] = await db
      .insert(guests)
      .values({
        tenantId: testTenantId,
        email: 'loyalty-test@example.com',
        name: 'Loyalty Test Guest',
      })
      .returning();
    testGuestId = guest.id;

    // Create guest profile
    await db.insert(guestProfiles).values({
      tenantId: testTenantId,
      guestId: testGuestId,
      loyaltyTier: 'bronze',
      loyaltyPoints: 0,
    });
  });

  afterAll(async () => {
    // Cleanup
    await db.delete(tenants).where(eq(tenants.id, testTenantId));
  });

  describe('Points Calculation', () => {
    it('should calculate points earned correctly (1 point per N$10)', () => {
      expect(loyaltyService.calculatePointsEarned(100)).toBe(10);
      expect(loyaltyService.calculatePointsEarned(250)).toBe(25);
      expect(loyaltyService.calculatePointsEarned(99)).toBe(9);
    });

    it('should calculate points value correctly (100 points = N$50)', () => {
      expect(loyaltyService.calculatePointsValue(100)).toBe(50);
      expect(loyaltyService.calculatePointsValue(200)).toBe(100);
      expect(loyaltyService.calculatePointsValue(50)).toBe(25);
    });
  });

  describe('Transaction Recording', () => {
    it('should record an earn transaction', async () => {
      const transaction = await loyaltyService.recordTransaction(
        testTenantId,
        testGuestId,
        'earn',
        100,
        'Test earn transaction'
      );

      expect(transaction).toBeDefined();
      expect(transaction.transactionType).toBe('earn');
      expect(transaction.pointsDelta).toBe(100);
      expect(transaction.pointsBefore).toBe(0);
      expect(transaction.pointsAfter).toBe(100);
    });

    it('should record a burn transaction', async () => {
      const transaction = await loyaltyService.recordTransaction(
        testTenantId,
        testGuestId,
        'burn',
        -50,
        'Test burn transaction'
      );

      expect(transaction).toBeDefined();
      expect(transaction.transactionType).toBe('burn');
      expect(transaction.pointsDelta).toBe(-50);
      expect(transaction.pointsAfter).toBe(50);
    });

    it('should reject burn transaction with insufficient balance', async () => {
      await expect(
        loyaltyService.recordTransaction(
          testTenantId,
          testGuestId,
          'burn',
          -1000,
          'Test insufficient balance'
        )
      ).rejects.toThrow('Insufficient points balance');
    });
  });

  describe('Guest Balance', () => {
    it('should return guest balance and tier info', async () => {
      const balance = await loyaltyService.getGuestBalance(testGuestId, testTenantId);

      expect(balance).toBeDefined();
      expect(balance.points).toBeGreaterThanOrEqual(0);
      expect(balance.tier).toBe('bronze');
      expect(balance.tierOrder).toBe(1);
    });
  });

  describe('Reward Catalog', () => {
    let testRewardId: string;

    it('should create a reward', async () => {
      const reward = await loyaltyService.createReward(testTenantId, {
        name: 'Test Reward',
        description: 'Test reward description',
        pointsCost: 100,
        valueNad: 50,
        available: true,
      });

      testRewardId = reward.id;

      expect(reward).toBeDefined();
      expect(reward.name).toBe('Test Reward');
      expect(reward.pointsCost).toBe(100);
    });

    it('should list rewards', async () => {
      const rewards = await loyaltyService.listRewards(testTenantId, true);

      expect(rewards).toBeDefined();
      expect(rewards.length).toBeGreaterThan(0);
      expect(rewards.every((r) => r.available)).toBe(true);
    });

    it('should get a specific reward', async () => {
      const reward = await loyaltyService.getReward(testRewardId, testTenantId);

      expect(reward).toBeDefined();
      expect(reward.id).toBe(testRewardId);
      expect(reward.name).toBe('Test Reward');
    });

    it('should update a reward', async () => {
      const updated = await loyaltyService.updateReward(testRewardId, testTenantId, {
        available: false,
      });

      expect(updated.available).toBe(false);
    });
  });

  describe('Reward Redemption', () => {
    it('should reject redemption with insufficient points', async () => {
      // Create a reward that costs more than the guest has
      const [expensiveReward] = await db
        .insert(loyaltyRewards)
        .values({
          tenantId: testTenantId,
          name: 'Expensive Reward',
          pointsCost: 10000,
          available: true,
        })
        .returning();

      await expect(
        loyaltyService.redeemReward({
          guestId: testGuestId,
          rewardId: expensiveReward.id,
          tenantId: testTenantId,
        })
      ).rejects.toThrow(/Insufficient points/);
    });
  });

  describe('Transaction History', () => {
    it('should return guest transaction history', async () => {
      const transactions = await loyaltyService.getGuestTransactions(testGuestId, testTenantId);

      expect(transactions).toBeDefined();
      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBeGreaterThan(0);
    });
  });
});
