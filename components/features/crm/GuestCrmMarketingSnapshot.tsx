/**
 * Marketing snapshot badges — segment, consent, LTV, recommended channels (guest CRM)
 *
 * Purpose: Read-only block driven by `getGuestCrmInsights` API payload.
 * Location: components/features/crm/GuestCrmMarketingSnapshot.tsx
 */

import type { GuestCrmInsights } from '@/components/features/crm/guestCrmPanelTypes';

export default function GuestCrmMarketingSnapshot({ insights }: { insights: GuestCrmInsights }) {
  return (
    <div className="rounded-lg bg-base-200/60 p-4 space-y-2">
      <p className="text-sm font-semibold text-base-content/80">Marketing snapshot</p>
      <div className="flex flex-wrap gap-2">
        <span className="badge badge-primary badge-lg">Segment: {insights.segment}</span>
        <span
          className={`badge badge-lg ${insights.marketingConsent ? 'badge-success' : 'badge-ghost'}`}
        >
          {insights.marketingConsent ? 'Marketing consent' : 'No marketing consent'}
        </span>
        <span className="badge badge-ghost badge-lg">{insights.totalBookings} bookings</span>
        <span className="badge badge-ghost badge-lg">LTV NAD {insights.lifetimeValueNad.toFixed(0)}</span>
      </div>
      {insights.recommendedChannels.length > 0 && (
        <p className="text-sm text-base-content/70">Channels: {insights.recommendedChannels.join(', ')}</p>
      )}
      {insights.notes && <p className="text-sm text-base-content/60">{insights.notes}</p>}
    </div>
  );
}
