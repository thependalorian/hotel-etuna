/**
 * Namibia tax reference — two independent VAT streams:
 * 1) Buffr platform B2B fees → Buffr NamRA return (`getBuffrTaxProfile`, platform invoices).
 * 2) Hotel Etuna guest hospitality → Client NamRA return (`getHotelEtunaPropertyTaxProfile`, folios, property-vat report).
 * Location: lib/platform/namibia-tax.ts
 *
 * Sources: Deloitte commentary Namibian Budget 2025/2026; Value-Added Tax Act 10 of 2000;
 * NamRA business tax guidance (namra.org.na). Not tax advice — counsel to confirm.
 */

/** Standard VAT rate — unchanged per Budget 2025/2026 (Deloitte). */
export const NAMIBIA_STANDARD_VAT_RATE_PERCENT = 15;

/** Compulsory VAT registration threshold (taxable supplies / 12 months). */
export const NAMIBIA_VAT_COMPULSORY_THRESHOLD_NAD = 500_000;

/** Voluntary VAT registration floor. */
export const NAMIBIA_VAT_VOLUNTARY_THRESHOLD_NAD = 200_000;

/** Non-mining company tax: 30% from 1 Jan 2025; 28% proposed FY2026/2027 (Deloitte). */
export const NAMIBIA_NON_MINING_CORPORATE_TAX_RATE_2025 = 30;
export const NAMIBIA_NON_MINING_CORPORATE_TAX_RATE_PROPOSED_2027 = 28;

/** NamRA e-invoicing rollout (budget proposal) — April 2026. */
export const NAMRA_EINVOICING_TARGET_MONTH = '2026-04';

/**
 * Buffr VAT no. on Bank Windhoek account confirmation (29 Aug 2025).
 * Confirm against NamRA VAT registration certificate before production invoices.
 */
export const BUFFR_DOCUMENTED_VAT_NUMBER = '0031148015';

/**
 * Buffr income tax reference from NamRA Taxpayer Registration Certificate (NamRA.pdf, Jul 2025).
 * Registered name: Buffr Financial Services CC (CC/2024/09322).
 */
export const BUFFR_DOCUMENTED_INCOME_TAX_REFERENCE = '15560644-011';

/** NamRA taxpayer identification number (TIN) on same certificate. */
export const BUFFR_DOCUMENTED_TAXPAYER_ID = '15560644';

/**
 * Hotel Etuna — Etuna Guesthouse And Tours CC (NamRA Tax Good Standing Certificate).
 * Issued 15 Jan 2026 · cert. 0002280115-0036 · valid 15 Jan – 15 May 2026.
 * BIPA CC/2011/3890. VAT **05517026-015** on guest tax invoices / folios.
 */
/** NamRA registered supplier name (folios, tax invoices, VAT return). */
export const HOTEL_ETUNA_DOCUMENTED_NAMRA_LEGAL_NAME = 'Etuna Guesthouse And Tours CC';

/** Trade / platform brand (marketing UI only — not on tax invoices). */
export const HOTEL_ETUNA_DOCUMENTED_TRADE_NAME = 'Hotel Etuna';

export const HOTEL_ETUNA_DOCUMENTED_CC_NUMBER = 'CC/2011/3890';
export const HOTEL_ETUNA_DOCUMENTED_POSTAL_ADDRESS = 'P.O. Box 90022, Ongwediva, Namibia';
export const HOTEL_ETUNA_DOCUMENTED_TAXPAYER_ID = '05517026';
export const HOTEL_ETUNA_DOCUMENTED_INCOME_TAX_REFERENCE = '05517026-011';
export const HOTEL_ETUNA_DOCUMENTED_VAT_REFERENCE = '05517026-015';
export const HOTEL_ETUNA_DOCUMENTED_EMPLOYEE_TAX_REFERENCE = '05517026-014';
export const HOTEL_ETUNA_DOCUMENTED_WHT_SERVICES_REFERENCE = '05517026-018';

export type HotelEtunaNamraRegistration = {
  namraLegalName: string;
  tradeName: string;
  closeCorporationNumber: string;
  postalAddress: string;
  taxpayerId: string;
  incomeTaxReference: string;
  vatReference: string;
  employeeTaxReference: string;
  withholdingTaxServicesReference: string;
  goodStandingCertificateNumber: string;
  goodStandingValidFrom: string;
  goodStandingValidTo: string;
};

/** Full Client registration block for reports and Schedule A. */
export function getHotelEtunaNamraRegistration(): HotelEtunaNamraRegistration {
  return {
    namraLegalName: HOTEL_ETUNA_DOCUMENTED_NAMRA_LEGAL_NAME,
    tradeName: HOTEL_ETUNA_DOCUMENTED_TRADE_NAME,
    closeCorporationNumber: HOTEL_ETUNA_DOCUMENTED_CC_NUMBER,
    postalAddress: HOTEL_ETUNA_DOCUMENTED_POSTAL_ADDRESS,
    taxpayerId: HOTEL_ETUNA_DOCUMENTED_TAXPAYER_ID,
    incomeTaxReference: HOTEL_ETUNA_DOCUMENTED_INCOME_TAX_REFERENCE,
    vatReference: HOTEL_ETUNA_DOCUMENTED_VAT_REFERENCE,
    employeeTaxReference: HOTEL_ETUNA_DOCUMENTED_EMPLOYEE_TAX_REFERENCE,
    withholdingTaxServicesReference: HOTEL_ETUNA_DOCUMENTED_WHT_SERVICES_REFERENCE,
    goodStandingCertificateNumber: '0002280115-0036',
    goodStandingValidFrom: '2026-01-15',
    goodStandingValidTo: '2026-05-15',
  };
}

/** Tax amnesty programme end date (Budget 2025/2026, Deloitte). */
export const NAMRA_TAX_AMNESTY_END_DATE = '2026-10-31';

export type VatPricingMode = 'inclusive' | 'exclusive';

export interface TaxProfile {
  legalName: string;
  registrationLabel: string;
  registrationNumber: string | null;
  vatRegistered: boolean;
  vatRegistrationNumber: string | null;
  incomeTaxReference: string | null;
  standardVatRatePercent: number;
  /** Guest-facing prices include VAT (typical B2C hospitality). */
  pricesVatInclusive: boolean;
}

export interface VatBreakdown {
  taxableGross: number;
  amountExVat: number;
  vatAmount: number;
  totalInclVat: number;
  vatRatePercent: number;
  pricingMode: VatPricingMode;
  vatRegistered: boolean;
}

export interface BuffrTaxProfile extends TaxProfile {
  closeCorporationNumber: string;
}

/**
 * Buffr Financial Services CC — platform B2B invoices to Client.
 * Env: BUFFR_VAT_REGISTERED, BUFFR_VAT_NUMBER, BUFFR_INCOME_TAX_REF, BUFFR_VAT_RATE_PERCENT
 */
export function getBuffrTaxProfile(): BuffrTaxProfile {
  const vatRegistered =
    process.env.BUFFR_VAT_REGISTERED === 'true' ||
    process.env.BUFFR_VAT_REGISTERED === '1';

  return {
    legalName: 'BUFFR FINANCIAL SERVICES CC',
    registrationLabel: 'Close Corporation',
    registrationNumber: 'CC/2024/09322',
    closeCorporationNumber: 'CC/2024/09322',
    vatRegistered,
    vatRegistrationNumber:
      process.env.BUFFR_VAT_NUMBER?.trim() || BUFFR_DOCUMENTED_VAT_NUMBER,
    incomeTaxReference:
      process.env.BUFFR_INCOME_TAX_REF?.trim() || BUFFR_DOCUMENTED_INCOME_TAX_REFERENCE,
    standardVatRatePercent: parseVatRatePercent(process.env.BUFFR_VAT_RATE_PERCENT),
    pricesVatInclusive: false,
  };
}

/**
 * Hotel Etuna (Client) — VAT on guest room, F&B, and folio supplies.
 * Env: HOTEL_ETUNA_VAT_REGISTERED, HOTEL_ETUNA_VAT_NUMBER, HOTEL_ETUNA_INCOME_TAX_REF,
 *      HOTEL_ETUNA_LEGAL_NAME, HOTEL_ETUNA_PRICES_VAT_INCLUSIVE
 */
export function getHotelEtunaPropertyTaxProfile(): TaxProfile {
  const vatRegistered =
    process.env.HOTEL_ETUNA_VAT_REGISTERED === 'true' ||
    process.env.HOTEL_ETUNA_VAT_REGISTERED === '1' ||
    process.env.PROPERTY_VAT_REGISTERED === 'true' ||
    process.env.PROPERTY_VAT_REGISTERED === '1';

  const pricesInclusiveEnv =
    process.env.HOTEL_ETUNA_PRICES_VAT_INCLUSIVE ??
    process.env.PROPERTY_PRICES_VAT_INCLUSIVE;

  const pricesVatInclusive =
    pricesInclusiveEnv === 'false' || pricesInclusiveEnv === '0' ? false : true;

  return {
    legalName:
      process.env.HOTEL_ETUNA_LEGAL_NAME?.trim() ||
      HOTEL_ETUNA_DOCUMENTED_NAMRA_LEGAL_NAME,
    registrationLabel: 'Close Corporation',
    registrationNumber:
      process.env.HOTEL_ETUNA_CC_NUMBER?.trim() || HOTEL_ETUNA_DOCUMENTED_CC_NUMBER,
    vatRegistered,
    vatRegistrationNumber:
      process.env.HOTEL_ETUNA_VAT_NUMBER?.trim() ||
      process.env.PROPERTY_VAT_NUMBER?.trim() ||
      HOTEL_ETUNA_DOCUMENTED_VAT_REFERENCE,
    incomeTaxReference:
      process.env.HOTEL_ETUNA_INCOME_TAX_REF?.trim() ||
      process.env.PROPERTY_INCOME_TAX_REF?.trim() ||
      HOTEL_ETUNA_DOCUMENTED_INCOME_TAX_REFERENCE,
    standardVatRatePercent: parseVatRatePercent(
      process.env.HOTEL_ETUNA_VAT_RATE_PERCENT || process.env.PROPERTY_VAT_RATE_PERCENT
    ),
    pricesVatInclusive,
  };
}

function parseVatRatePercent(raw: string | undefined): number {
  if (!raw) return NAMIBIA_STANDARD_VAT_RATE_PERCENT;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n >= 0 ? n : NAMIBIA_STANDARD_VAT_RATE_PERCENT;
}

/** VAT on a B2B supply priced exclusive of VAT (Buffr platform fees). */
export function computeVatOnTaxableSupply(
  amountExVat: number,
  profile: Pick<TaxProfile, 'vatRegistered' | 'standardVatRatePercent'> = getBuffrTaxProfile()
): { amountExVat: number; vatAmount: number; totalInclVat: number; vatRatePercent: number } {
  if (!profile.vatRegistered || amountExVat <= 0) {
    return {
      amountExVat,
      vatAmount: 0,
      totalInclVat: amountExVat,
      vatRatePercent: 0,
    };
  }

  const vatRatePercent = profile.standardVatRatePercent;
  const vatAmount = roundMoney(amountExVat * (vatRatePercent / 100));
  return {
    amountExVat,
    vatAmount,
    totalInclVat: roundMoney(amountExVat + vatAmount),
    vatRatePercent,
  };
}

/** Hospitality / folio VAT breakdown from a gross taxable total (room + F&B, etc.). */
export function computeHospitalityVatBreakdown(
  taxableGross: number,
  profile: TaxProfile = getHotelEtunaPropertyTaxProfile()
): VatBreakdown {
  const pricingMode: VatPricingMode = profile.pricesVatInclusive ? 'inclusive' : 'exclusive';

  if (!profile.vatRegistered || taxableGross <= 0) {
    return {
      taxableGross,
      amountExVat: taxableGross,
      vatAmount: 0,
      totalInclVat: taxableGross,
      vatRatePercent: 0,
      pricingMode,
      vatRegistered: profile.vatRegistered,
    };
  }

  const rate = profile.standardVatRatePercent;

  if (pricingMode === 'inclusive') {
    const amountExVat = roundMoney(taxableGross / (1 + rate / 100));
    const vatAmount = roundMoney(taxableGross - amountExVat);
    return {
      taxableGross,
      amountExVat,
      vatAmount,
      totalInclVat: taxableGross,
      vatRatePercent: rate,
      pricingMode,
      vatRegistered: true,
    };
  }

  const { amountExVat, vatAmount, totalInclVat, vatRatePercent } = computeVatOnTaxableSupply(
    taxableGross,
    profile
  );
  return {
    taxableGross,
    amountExVat,
    vatAmount,
    totalInclVat,
    vatRatePercent,
    pricingMode,
    vatRegistered: true,
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Minimum fields for a NamRA-aligned B2B tax invoice (Buffr → Client). */
export const NAMRA_TAX_INVOICE_CHECKLIST = [
  'Words "Tax Invoice" on the document',
  'Supplier name, address, and VAT registration number',
  'Client name and address (or VAT number if registered)',
  'Unique invoice number and date of issue',
  'Description of services (subscription, processing fees)',
  'Amount excluding VAT, VAT rate, VAT amount, total inclusive',
  'Currency (NAD)',
] as const;

/** Guest folio / receipt fields when the property is VAT-registered. */
export const PROPERTY_GUEST_TAX_INVOICE_CHECKLIST = [
  'Supplier (property) legal name and VAT registration number',
  'Unique folio or receipt number and date of supply',
  'Description of supply (room nights, F&B items)',
  'Amount excluding VAT, VAT rate (15%), VAT amount, total inclusive (NAD)',
  'Whether displayed prices are VAT-inclusive or VAT-exclusive',
] as const;
