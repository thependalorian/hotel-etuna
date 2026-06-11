import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { GuestPastStaySummary } from '@/lib/types/folio';

interface PastStayCardProps {
  stay: GuestPastStaySummary;
}

export function PastStayCard({ stay }: PastStayCardProps) {
  return (
    <Card variant="elevated" className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-bold text-nude-900">
            {stay.propertyName}
          </h3>
          <p className="text-sm text-nude-600">
            Ref {stay.bookingReference} ·
            <span className="capitalize">{stay.status.replace('_', ' ')}</span>
            {stay.roomNumbers.length > 0 && ` · Room ${stay.roomNumbers.join(', ')}`}
          </p>
          <p className="text-sm text-nude-600 mt-1">
            {stay.checkInDate} → {stay.checkOutDate}
          </p>
          <p className="text-sm font-semibold text-nude-900 mt-2">
            Total paid: {stay.currency} {stay.totalAmount.toFixed(2)}
          </p>
        </div>
        <Link href={`/guest/stays/${stay.bookingId}`}>
          <Button variant="outline">View receipt</Button>
        </Link>
      </div>
    </Card>
  );
}
