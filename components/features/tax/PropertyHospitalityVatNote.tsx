/**
 * PropertyHospitalityVatNote
 *
 * Purpose: Show Hotel Etuna VAT split on deposits and cash/card receipts (guest-facing).
 * Location: /components/features/tax/PropertyHospitalityVatNote.tsx
 */

'use client';

import { useEffect, useState } from 'react';
import { FolioVatBreakdown } from '@/components/features/folio/FolioVatBreakdown';
import type { FolioVatSummary } from '@/lib/types/folio';
import { apiUrl } from '@/lib/utils/api-url';

interface PropertyHospitalityVatNoteProps {
  amount: number;
  currency?: string;
  className?: string;
}

export function PropertyHospitalityVatNote({
  amount,
  currency = 'NAD',
  className = '',
}: PropertyHospitalityVatNoteProps) {
  const [vat, setVat] = useState<FolioVatSummary | null>(null);

  useEffect(() => {
    if (!Number.isFinite(amount) || amount <= 0) {
      // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
      setVat(null);
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams({
      amount: String(amount),
      currency,
    });

    fetch(apiUrl(`/api/tax/hospitality-vat-display?${params}`))
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) {
          setVat((json.data?.vat as FolioVatSummary | null) ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setVat(null);
      });

    return () => {
      cancelled = true;
    };
  }, [amount, currency]);

  if (!vat) return null;

  return <FolioVatBreakdown vat={vat} className={className} />;
}
