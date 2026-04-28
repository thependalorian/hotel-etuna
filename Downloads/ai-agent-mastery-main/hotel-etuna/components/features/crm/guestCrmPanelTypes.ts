/**
 * Shared TypeScript types for guest CRM dashboard panel (memory + outreach)
 *
 * Purpose: Single source of truth for API-shaped props across `GuestCrmMemoryPanel` subcomponents.
 * Location: components/features/crm/guestCrmPanelTypes.ts
 */

export type GuestCrmMemoryFact = {
  id: string;
  factText: string;
  source: string | null;
  createdAt: string | null;
};

export type GuestCrmGraphEdge = {
  id: string;
  srcEntityType: string;
  srcEntityId: string;
  relationType: string;
  dstEntityType: string;
  dstEntityId: string;
};

export type GuestCrmInsights = {
  segment: string;
  marketingConsent: boolean;
  recommendedChannels: string[];
  totalBookings: number;
  lifetimeValueNad: number;
  notes?: string;
};

export type GuestCrmOutreachTouch = {
  id: string;
  guestId: string;
  channel: string;
  status: string;
  messageSubject: string | null;
  updatedAt: string | null;
};

export type GuestCrmMemoryBundle = {
  facts: GuestCrmMemoryFact[];
  edges: GuestCrmGraphEdge[];
  mem0Lines: string[];
  insights: GuestCrmInsights | null;
};

export type GuestCrmTouchStatusAction = 'scheduled' | 'sent' | 'cancelled';
