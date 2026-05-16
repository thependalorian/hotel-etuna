/**
 * Hospitality VAT breakdown for a single NAD amount (receipts, deposits).
 * GET /api/tax/hospitality-vat-display?amount=1150&currency=NAD
 *
 * Response: { data: { vat: FolioVatSummary | null } }
 */

import { NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { buildHospitalityVatDisplay } from '@/lib/services/tax/PropertyVatService';

export async function GET(request: NextRequest) {
  const amountParam = request.nextUrl.searchParams.get('amount');
  const amount = amountParam != null ? Number(amountParam) : NaN;

  if (!Number.isFinite(amount) || amount < 0) {
    return errorResponse('amount must be a non-negative number', 400, 'VALIDATION_ERROR');
  }

  const currency = request.nextUrl.searchParams.get('currency')?.trim() || 'NAD';
  const vat = buildHospitalityVatDisplay(amount, currency);

  return successResponse({ vat });
}
