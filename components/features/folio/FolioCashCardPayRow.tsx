/**
 * FolioCashCardPayRow — cash + card CTA row shared by desk and guest folio settlement.
 * Location: components/features/folio/FolioCashCardPayRow.tsx
 */

import { Button } from '@/components/ui/Button';

type FolioCashCardPayRowProps = {
  busy: boolean;
  payWithCard: boolean;
  onCash: () => void;
  onStartCard: () => void;
  cashLabel?: string;
  cardLabel?: string;
};

export function FolioCashCardPayRow({
  busy,
  payWithCard,
  onCash,
  onStartCard,
  cashLabel = 'Record cash',
  cardLabel = 'Pay card (Adumo)',
}: FolioCashCardPayRowProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" disabled={busy} onClick={onCash}>
        {cashLabel}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={busy || payWithCard}
        onClick={onStartCard}
      >
        {cardLabel}
      </Button>
    </div>
  );
}
