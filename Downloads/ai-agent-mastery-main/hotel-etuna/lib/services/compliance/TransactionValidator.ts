/**
 * TransactionValidator Service
 * 
 * Purpose: Validates transactions against KYC tier limits for Bank of Namibia PSD compliance
 * Functionality: 
 *   - Checks daily transaction limits
 *   - Checks monthly balance limits
 *   - Tracks transaction totals
 *   - Creates KYC upgrade prompts when limits are reached
 * Location: /lib/services/compliance/TransactionValidator.ts
 * 
 * Compliance: PSD-1, Bank of Namibia PSDs, ETA 2019, POPIA
 * 
 * @version 1.0.0
 * @since April 21, 2026
 */

import { db } from '@/lib/db';
import { 
  kycProfiles, 
  transactionLimits, 
  dailyTransactionTracking, 
  monthlyBalanceTracking,
  kycUpgradePrompts,
  transactions
} from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { AppError, handleServiceError } from '@/lib/utils/errors';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type KYCTier = 
  | 'lite_kyc_individual' 
  | 'lite_kyc_business' 
  | 'full_kyc_individual' 
  | 'full_kyc_business' 
  | 'none';

export type KYCStatus = 
  | 'pending' 
  | 'in_review' 
  | 'approved' 
  | 'rejected' 
  | 'expired' 
  | 'suspended';

export interface TransactionLimits {
  daily: number;
  monthly: number;
}

export interface TransactionValidationResult {
  isAllowed: boolean;
  reason?: string;
  currentDailyTotal: number;
  dailyLimit: number;
  remainingDailyLimit: number;
  currentMonthlyBalance: number;
  monthlyLimit: number;
  remainingMonthlyLimit: number;
  kycTier: KYCTier;
  needsUpgrade: boolean;
  suggestedTier?: KYCTier;
}

export interface KYCProfile {
  id: string;
  guestId: string;
  kycTier: KYCTier;
  kycStatus: KYCStatus;
  isBusiness: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const KYC_LIMITS: Record<KYCTier, TransactionLimits> = {
  lite_kyc_individual: { daily: 10000, monthly: 10000 },
  lite_kyc_business: { daily: 10000, monthly: 10000 },
  full_kyc_individual: { daily: 20000, monthly: 50000 },
  full_kyc_business: { daily: 50000, monthly: 100000 },
  none: { daily: 0, monthly: 0 },
};

const KYC_UPGRADE_PATH: Record<KYCTier, KYCTier | null> = {
  none: 'lite_kyc_individual',
  lite_kyc_individual: 'full_kyc_individual',
  lite_kyc_business: 'full_kyc_business',
  full_kyc_individual: null,
  full_kyc_business: null,
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class TransactionValidator {
  /**
   * Validate if a transaction is allowed based on KYC tier and limits
   */
  async validateTransaction(
    guestId: string,
    tenantId: string,
    amount: number,
    transactionId?: string
  ): Promise<TransactionValidationResult> {
    try {
      // Step 1: Get KYC profile
      const kycProfile = await this.getKYCProfile(guestId, tenantId);
      
      if (!kycProfile) {
        return {
          isAllowed: false,
          reason: 'No KYC profile found. Please complete KYC verification.',
          currentDailyTotal: 0,
          dailyLimit: 0,
          remainingDailyLimit: 0,
          currentMonthlyBalance: 0,
          monthlyLimit: 0,
          remainingMonthlyLimit: 0,
          kycTier: 'none',
          needsUpgrade: true,
          suggestedTier: 'lite_kyc_individual',
        };
      }

      if (kycProfile.kycStatus !== 'approved') {
        return {
          isAllowed: false,
          reason: `KYC status is ${kycProfile.kycStatus}. Only approved KYC profiles can transact.`,
          currentDailyTotal: 0,
          dailyLimit: 0,
          remainingDailyLimit: 0,
          currentMonthlyBalance: 0,
          monthlyLimit: 0,
          remainingMonthlyLimit: 0,
          kycTier: kycProfile.kycTier,
          needsUpgrade: false,
        };
      }

      // Step 2: Get transaction limits for KYC tier
      const limits = await this.getTransactionLimits(tenantId, kycProfile.kycTier);

      // Step 3: Get current daily total
      const currentDailyTotal = await this.getDailyTransactionTotal(guestId, tenantId);

      // Step 4: Get current monthly balance
      const currentMonthlyBalance = await this.getMonthlyBalance(guestId, tenantId);

      // Step 5: Calculate remaining limits
      const remainingDailyLimit = limits.daily - currentDailyTotal;
      const remainingMonthlyLimit = limits.monthly - currentMonthlyBalance;

      // Step 6: Check if transaction would exceed limits
      const wouldExceedDailyLimit = (currentDailyTotal + amount) > limits.daily;
      const wouldExceedMonthlyLimit = (currentMonthlyBalance + amount) > limits.monthly;

      // Step 7: Determine if upgrade is needed
      const needsUpgrade = wouldExceedDailyLimit || wouldExceedMonthlyLimit;
      const suggestedTier = needsUpgrade ? KYC_UPGRADE_PATH[kycProfile.kycTier] || undefined : undefined;

      // Step 8: Create upgrade prompt if needed
      if (needsUpgrade && suggestedTier && transactionId) {
        await this.createUpgradePrompt(
          tenantId,
          guestId,
          kycProfile.kycTier,
          suggestedTier,
          wouldExceedDailyLimit ? 'daily_limit_reached' : 'monthly_limit_reached',
          transactionId
        );
      }

      // Step 9: Return validation result
      if (wouldExceedDailyLimit) {
        return {
          isAllowed: false,
          reason: `Transaction would exceed daily limit of N$${limits.daily.toLocaleString()}. Current daily total: N$${currentDailyTotal.toLocaleString()}.`,
          currentDailyTotal,
          dailyLimit: limits.daily,
          remainingDailyLimit,
          currentMonthlyBalance,
          monthlyLimit: limits.monthly,
          remainingMonthlyLimit,
          kycTier: kycProfile.kycTier,
          needsUpgrade: true,
          suggestedTier,
        };
      }

      if (wouldExceedMonthlyLimit) {
        return {
          isAllowed: false,
          reason: `Transaction would exceed monthly balance limit of N$${limits.monthly.toLocaleString()}. Current monthly balance: N$${currentMonthlyBalance.toLocaleString()}.`,
          currentDailyTotal,
          dailyLimit: limits.daily,
          remainingDailyLimit,
          currentMonthlyBalance,
          monthlyLimit: limits.monthly,
          remainingMonthlyLimit,
          kycTier: kycProfile.kycTier,
          needsUpgrade: true,
          suggestedTier,
        };
      }

      return {
        isAllowed: true,
        currentDailyTotal,
        dailyLimit: limits.daily,
        remainingDailyLimit,
        currentMonthlyBalance,
        monthlyLimit: limits.monthly,
        remainingMonthlyLimit,
        kycTier: kycProfile.kycTier,
        needsUpgrade: false,
      };
    } catch (error) {
      throw handleServiceError(error, 'Error validating transaction');
    }
  }

  /**
   * Record a successful transaction and update tracking
   */
  async recordTransaction(
    guestId: string,
    tenantId: string,
    amount: number
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().substring(0, 7);

      // Update daily tracking
      await db
        .insert(dailyTransactionTracking)
        .values({
          tenantId,
          guestId,
          trackingDate: today,
          transactionCount: 1,
          totalAmount: String(amount),
          currency: 'NAD',
        })
        .onConflictDoUpdate({
          target: [
            dailyTransactionTracking.tenantId,
            dailyTransactionTracking.guestId,
            dailyTransactionTracking.trackingDate,
          ],
          set: {
            transactionCount: sql`${dailyTransactionTracking.transactionCount} + 1`,
            totalAmount: sql`${dailyTransactionTracking.totalAmount} + ${amount}`,
            updatedAt: new Date(),
          },
        });

      // Update monthly tracking
      await db
        .insert(monthlyBalanceTracking)
        .values({
          tenantId,
          guestId,
          trackingMonth: thisMonth,
          currentBalance: String(amount),
          peakBalance: String(amount),
          transactionCount: 1,
          totalCredits: String(amount),
          totalDebits: '0',
          currency: 'NAD',
        })
        .onConflictDoUpdate({
          target: [
            monthlyBalanceTracking.tenantId,
            monthlyBalanceTracking.guestId,
            monthlyBalanceTracking.trackingMonth,
          ],
          set: {
            currentBalance: sql`${monthlyBalanceTracking.currentBalance} + ${amount}`,
            peakBalance: sql`GREATEST(${monthlyBalanceTracking.peakBalance}, ${monthlyBalanceTracking.currentBalance} + ${amount})`,
            totalCredits: sql`${monthlyBalanceTracking.totalCredits} + ${amount}`,
            transactionCount: sql`${monthlyBalanceTracking.transactionCount} + 1`,
            updatedAt: new Date(),
          },
        });
    } catch (error) {
      throw handleServiceError(error, 'Error recording transaction');
    }
  }

  /**
   * Get KYC profile for a guest
   */
  private async getKYCProfile(guestId: string, tenantId: string): Promise<KYCProfile | null> {
    try {
      const [profile] = await db
        .select()
        .from(kycProfiles)
        .where(and(eq(kycProfiles.guestId, guestId), eq(kycProfiles.tenantId, tenantId)))
        .limit(1);

      if (!profile) return null;

      return {
        id: profile.id,
        guestId: profile.guestId,
        kycTier: profile.kycTier as KYCTier,
        kycStatus: profile.kycStatus as KYCStatus,
        isBusiness: Boolean(profile.isBusiness),
      };
    } catch (error) {
      throw handleServiceError(error, 'Error fetching KYC profile');
    }
  }

  /**
   * Get transaction limits for a KYC tier
   */
  private async getTransactionLimits(tenantId: string, kycTier: KYCTier): Promise<TransactionLimits> {
    try {
      // First, try to get tenant-specific limits
      const [tenantDailyLimit] = await db
        .select()
        .from(transactionLimits)
        .where(
          and(
            eq(transactionLimits.tenantId, tenantId),
            eq(transactionLimits.kycTier, kycTier),
            eq(transactionLimits.limitType, 'daily'),
            eq(transactionLimits.isActive, true)
          )
        )
        .limit(1);

      const [tenantMonthlyLimit] = await db
        .select()
        .from(transactionLimits)
        .where(
          and(
            eq(transactionLimits.tenantId, tenantId),
            eq(transactionLimits.kycTier, kycTier),
            eq(transactionLimits.limitType, 'monthly'),
            eq(transactionLimits.isActive, true)
          )
        )
        .limit(1);

      // If no tenant-specific limits, use global defaults
      const dailyLimit = tenantDailyLimit?.limitAmount 
        ? parseFloat(tenantDailyLimit.limitAmount) 
        : KYC_LIMITS[kycTier].daily;

      const monthlyLimit = tenantMonthlyLimit?.limitAmount 
        ? parseFloat(tenantMonthlyLimit.limitAmount) 
        : KYC_LIMITS[kycTier].monthly;

      return { daily: dailyLimit, monthly: monthlyLimit };
    } catch (error) {
      // Fallback to hardcoded limits if database query fails
      return KYC_LIMITS[kycTier];
    }
  }

  /**
   * Get daily transaction total for a guest
   */
  private async getDailyTransactionTotal(guestId: string, tenantId: string): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [tracking] = await db
        .select()
        .from(dailyTransactionTracking)
        .where(
          and(
            eq(dailyTransactionTracking.guestId, guestId),
            eq(dailyTransactionTracking.tenantId, tenantId),
            eq(dailyTransactionTracking.trackingDate, today)
          )
        )
        .limit(1);

      return tracking?.totalAmount ? parseFloat(tracking.totalAmount) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get monthly balance for a guest
   */
  private async getMonthlyBalance(guestId: string, tenantId: string): Promise<number> {
    try {
      const thisMonth = new Date().toISOString().substring(0, 7);

      const [tracking] = await db
        .select()
        .from(monthlyBalanceTracking)
        .where(
          and(
            eq(monthlyBalanceTracking.guestId, guestId),
            eq(monthlyBalanceTracking.tenantId, tenantId),
            eq(monthlyBalanceTracking.trackingMonth, thisMonth)
          )
        )
        .limit(1);

      return tracking?.currentBalance ? parseFloat(tracking.currentBalance) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Create KYC upgrade prompt
   */
  private async createUpgradePrompt(
    tenantId: string,
    guestId: string,
    currentTier: KYCTier,
    suggestedTier: KYCTier,
    reason: string,
    transactionId: string
  ): Promise<void> {
    try {
      await db.insert(kycUpgradePrompts).values({
        tenantId,
        guestId,
        currentKycTier: currentTier,
        suggestedKycTier: suggestedTier,
        triggerReason: reason,
        triggerTransactionId: transactionId,
        isShown: false,
      });
    } catch (error) {
      // Log error but don't fail the transaction validation
      console.error('Error creating KYC upgrade prompt:', error);
    }
  }

  /**
   * Get pending upgrade prompts for a guest
   */
  async getPendingUpgradePrompts(guestId: string, tenantId: string): Promise<any[]> {
    try {
      const prompts = await db
        .select()
        .from(kycUpgradePrompts)
        .where(
          and(
            eq(kycUpgradePrompts.guestId, guestId),
            eq(kycUpgradePrompts.tenantId, tenantId),
            eq(kycUpgradePrompts.isShown, false)
          )
        )
        .orderBy(kycUpgradePrompts.createdAt);

      return prompts;
    } catch (error) {
      throw handleServiceError(error, 'Error fetching upgrade prompts');
    }
  }

  /**
   * Mark upgrade prompt as shown
   */
  async markPromptAsShown(promptId: string): Promise<void> {
    try {
      await db
        .update(kycUpgradePrompts)
        .set({ isShown: true, shownAt: new Date() })
        .where(eq(kycUpgradePrompts.id, promptId));
    } catch (error) {
      throw handleServiceError(error, 'Error marking prompt as shown');
    }
  }

  /**
   * Dismiss upgrade prompt
   */
  async dismissPrompt(promptId: string): Promise<void> {
    try {
      await db
        .update(kycUpgradePrompts)
        .set({ isDismissed: true, dismissedAt: new Date() })
        .where(eq(kycUpgradePrompts.id, promptId));
    } catch (error) {
      throw handleServiceError(error, 'Error dismissing prompt');
    }
  }

  /**
   * Accept upgrade prompt
   */
  async acceptPrompt(promptId: string): Promise<void> {
    try {
      await db
        .update(kycUpgradePrompts)
        .set({ isAccepted: true, acceptedAt: new Date() })
        .where(eq(kycUpgradePrompts.id, promptId));
    } catch (error) {
      throw handleServiceError(error, 'Error accepting prompt');
    }
  }
}

// Export singleton instance
export const transactionValidator = new TransactionValidator();
