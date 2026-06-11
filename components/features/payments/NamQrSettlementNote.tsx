/**
 * NamQrSettlementNote — shared copy for Nedbank settlement account on NamQR flows.
 * Location: components/features/payments/NamQrSettlementNote.tsx
 */

import { HOTEL_ETUNA_SETTLEMENT } from '@/lib/platform/settlement-accounts';

type NamQrSettlementNoteProps = {
  variant?: 'desk' | 'guest';
};

export function NamQrSettlementNote({ variant = 'desk' }: NamQrSettlementNoteProps) {
  const account = (
    <span className="font-mono">{HOTEL_ETUNA_SETTLEMENT.accountNumber}</span>
  );

  if (variant === 'guest') {
    return (
      <p className="text-sm text-nude-600 mt-1">
        Scan the QR in Nedbank, FNB, or another Namibian banking app. Payment goes to Hotel
        Etuna Nedbank {account}. Reception confirms once the transfer appears on our statement —
        your folio updates then.
      </p>
    );
  }

  return (
    <p className="text-sm text-base-content/70">
      Guest pays to Hotel Etuna Nedbank {account} via banking app scan. Payload follows NamQR v5.0
      (BoN May 2025).
    </p>
  );
}
