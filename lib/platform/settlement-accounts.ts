/**
 * Settlement & billing bank profiles — Buffr (platform) vs property (guest revenue).
 * Location: lib/platform/settlement-accounts.ts
 *
 * Source: Bank confirmation letters (May–Aug 2025). Admin display + invoice footers only.
 * Live Adumo settlement routing is configured in the Adumo merchant portal, not here.
 */

export type SettlementParty = 'property' | 'platform';

export interface SettlementBankProfile {
  party: SettlementParty;
  legalName: string;
  bankName: string;
  accountNumber: string;
  branchCode: string;
  swiftCode: string;
  accountType: string;
  registrationRef?: string;
  /** Internal key for system_settings / future settlement_accounts row */
  profileKey: string;
}

/** Etuna Guesthouse and Tours CC — guest card settlement target (Nedbank) */
export const HOTEL_ETUNA_SETTLEMENT: SettlementBankProfile = {
  party: 'property',
  profileKey: 'hotel_etuna_nedbank',
  legalName: 'ETUNA GUESTHOUSE AND TOURS CC',
  bankName: 'Nedbank Namibia',
  accountNumber: '11000481744',
  branchCode: '461089',
  swiftCode: 'NEDSNANX',
  accountType: 'Current Account',
  registrationRef: 'CC/2011/3890',
};

/** Buffr Financial Services CC — subscription & platform fee remittance only (Bank Windhoek) */
export const BUFFR_PLATFORM_BILLING: SettlementBankProfile = {
  party: 'platform',
  profileKey: 'buffr_bank_windhoek',
  legalName: 'BUFFR FINANCIAL SERVICES CC',
  bankName: 'Bank Windhoek',
  accountNumber: '8050377860',
  branchCode: '485-673',
  swiftCode: 'BWLINANX',
  accountType: 'CHK Account',
  registrationRef: 'CC/2024/09322',
};

export function settlementProfileForParty(party: SettlementParty): SettlementBankProfile {
  return party === 'platform' ? BUFFR_PLATFORM_BILLING : HOTEL_ETUNA_SETTLEMENT;
}
