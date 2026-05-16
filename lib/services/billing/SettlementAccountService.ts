/**
 * SettlementAccountService — property vs Buffr bank profiles for billing display.
 * Location: lib/services/billing/SettlementAccountService.ts
 */

import { db } from '@/lib/db';
import { settlementAccounts } from '@/lib/db/schema';
import {
  BUFFR_PLATFORM_BILLING,
  HOTEL_ETUNA_SETTLEMENT,
  type SettlementBankProfile,
} from '@/lib/platform/settlement-accounts';
import { handleServiceError } from '@/lib/utils/errors';
import { and, eq, isNull } from 'drizzle-orm';

export class SettlementAccountService {
  async listForTenant(tenantId: string): Promise<SettlementBankProfile[]> {
    try {
      const rows = await db
        .select()
        .from(settlementAccounts)
        .where(
          and(
            eq(settlementAccounts.isActive, true),
            eq(settlementAccounts.tenantId, tenantId)
          )
        );

      const property = rows.map((r) => rowToProfile(r));
      const [platformRow] = await db
        .select()
        .from(settlementAccounts)
        .where(
          and(eq(settlementAccounts.party, 'platform'), isNull(settlementAccounts.tenantId))
        )
        .limit(1);

      const platform = platformRow ? rowToProfile(platformRow) : BUFFR_PLATFORM_BILLING;
      return [...property, platform];
    } catch (error) {
      throw handleServiceError(error, 'Error loading settlement accounts');
    }
  }

  /** Fallback when DB not migrated yet */
  static defaultProfiles(): SettlementBankProfile[] {
    return [HOTEL_ETUNA_SETTLEMENT, BUFFR_PLATFORM_BILLING];
  }
}

function rowToProfile(row: typeof settlementAccounts.$inferSelect): SettlementBankProfile {
  return {
    party: row.party as 'property' | 'platform',
    profileKey: row.profileKey,
    legalName: row.legalName,
    bankName: row.bankName,
    accountNumber: row.accountNumber,
    branchCode: row.branchCode ?? '',
    swiftCode: row.swiftCode ?? '',
    accountType: row.accountType ?? '',
    registrationRef: row.registrationRef ?? undefined,
  };
}
