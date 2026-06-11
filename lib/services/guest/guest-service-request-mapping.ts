/**
 * Guest service request mapping
 *
 * Purpose: Pure, testable rules that turn a guest-raised request into staff work —
 *   which request types spawn a housekeeping task, the default priority, and the
 *   task_type label used on the staff board.
 * Location: /lib/services/guest/guest-service-request-mapping.ts
 * Reference: PRD §1.1 Goal 1; PLANNING § Agentic CRM & Intelligent OS roadmap.
 */

export type GuestServiceRequestType = 'housekeeping' | 'maintenance' | 'amenity' | 'other';
export type HousekeepingPriority = 'low' | 'normal' | 'high' | 'urgent';

/** Quick-pick categories surfaced to guests, grouped by request type. */
export const GUEST_REQUEST_CATALOG: Record<
  GuestServiceRequestType,
  { label: string; categories: { value: string; label: string }[] }
> = {
  housekeeping: {
    label: 'Request service',
    categories: [
      { value: 'extra_towels', label: 'Extra towels' },
      { value: 'turndown', label: 'Turndown service' },
      { value: 'iron_board', label: 'Iron & board' },
      { value: 'cleaning', label: 'Room cleaning' },
      { value: 'extra_toiletries', label: 'Extra toiletries' },
    ],
  },
  maintenance: {
    label: 'Report an issue',
    categories: [
      { value: 'no_hot_water', label: 'No hot water' },
      { value: 'aircon', label: 'Air conditioning' },
      { value: 'plumbing', label: 'Plumbing / leak' },
      { value: 'electrical', label: 'Electrical / lighting' },
      { value: 'tv_wifi', label: 'TV / WiFi' },
    ],
  },
  amenity: {
    label: 'Amenity request',
    categories: [
      { value: 'minibar_refill', label: 'Minibar refill' },
      { value: 'pillows', label: 'Extra pillows / blanket' },
      { value: 'wakeup_call', label: 'Wake-up call' },
    ],
  },
  other: {
    label: 'Something else',
    categories: [{ value: 'other', label: 'Other' }],
  },
};

/** Request types that create a housekeeping_tasks row for the staff board. */
const SPAWNS_TASK: ReadonlySet<GuestServiceRequestType> = new Set([
  'housekeeping',
  'maintenance',
]);

/**
 * Whether a request type should create a linked housekeeping task.
 * @param type - The guest request type.
 * @returns True when staff need a board task (housekeeping/maintenance).
 */
export function spawnsHousekeepingTask(type: GuestServiceRequestType): boolean {
  return SPAWNS_TASK.has(type);
}

/**
 * Default priority for a guest request. Maintenance defaults higher than service.
 * Safety-relevant maintenance categories escalate to urgent.
 * @param type - The guest request type.
 * @param category - Optional category value (e.g. 'no_hot_water').
 * @returns A housekeeping priority.
 */
export function defaultPriority(
  type: GuestServiceRequestType,
  category?: string | null
): HousekeepingPriority {
  const urgentMaintenance = new Set(['no_hot_water', 'plumbing', 'electrical']);
  if (type === 'maintenance') {
    return category && urgentMaintenance.has(category) ? 'urgent' : 'high';
  }
  return 'normal';
}

/**
 * The task_type label written to housekeeping_tasks for a spawned task.
 * Reason: keeps guest-originated tasks distinguishable from checkout_cleaning on the board.
 * @param type - The guest request type.
 * @param category - Optional category value.
 * @returns A namespaced task_type string (max 100 chars to fit the column).
 */
export function housekeepingTaskType(
  type: GuestServiceRequestType,
  category?: string | null
): string {
  const suffix = category ? `:${category}` : '';
  return `guest_${type}${suffix}`.slice(0, 100);
}
