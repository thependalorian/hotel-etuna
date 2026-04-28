/**
 * CRM graph edges list — guest-centric relationships (booked_at, stayed_at, etc.)
 *
 * Purpose: Compact monospace list for staff debugging / transparency on guest CRM panel.
 * Location: components/features/crm/GuestCrmGraphEdgesSection.tsx
 */

import type { GuestCrmGraphEdge } from '@/components/features/crm/guestCrmPanelTypes';

export default function GuestCrmGraphEdgesSection({ edges }: { edges: GuestCrmGraphEdge[] }) {
  return (
    <div className="space-y-2">
      <h4 className="font-semibold">Graph relationships</h4>
      <ul className="space-y-1 max-h-48 overflow-y-auto text-xs font-mono">
        {edges.map((e) => (
          <li key={e.id}>
            {e.srcEntityType}:{e.srcEntityId} to [{e.relationType}] {e.dstEntityType}:{e.dstEntityId}
          </li>
        ))}
      </ul>
    </div>
  );
}
