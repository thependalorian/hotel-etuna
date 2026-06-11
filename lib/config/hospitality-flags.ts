/**
 * Hospitality product flags — Hotel Etuna vs platform FinTech surfaces.
 * Location: lib/config/hospitality-flags.ts
 */

/** When false, staff routes under /compliance and /fraud are blocked in proxy.ts. */
export function isHospitalityStaffComplianceNavEnabled(): boolean {
  const raw = process.env.HOSPITALITY_STAFF_COMPLIANCE_NAV?.trim().toLowerCase();
  if (raw === 'true' || raw === '1') return true;
  return false;
}
