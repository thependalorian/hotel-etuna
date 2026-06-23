/**
 * @fileoverview Command-centre smart alerts — pure derivation from a live ops snapshot.
 * Location: lib/services/intelligence/command-centre-alerts.ts
 *
 * Turns today's operational snapshot into prioritised, colour-coded alerts
 * (🔴 urgent → 🟡 attention → 🟢 info). Pure + deterministic so the prioritisation
 * is unit-testable and the UI just renders the result.
 */

export type AlertSeverity = 'urgent' | 'attention' | 'info';

export type CommandCentreSnapshot = {
  generatedAt: string;
  arrivalsToday: number;
  departuresToday: number;
  inHouse: number;
  totalRooms: number;
  occupancyRate: number; // 0..1
  overdueCheckouts: number;
  ordersToday: number;
  revenueToday: number;
  pendingHousekeeping: number;
  openMaintenance: number;
  lowStock: number;
  outOfStock: number;
  pendingRateRecs: number;
  pendingReorderRecs: number;
};

export type CommandCentreAlert = {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  href?: string;
};

const SEVERITY_RANK: Record<AlertSeverity, number> = { urgent: 0, attention: 1, info: 2 };

/**
 * Derive a prioritised alert feed from the snapshot.
 * @param s - Live operational snapshot.
 * @returns Alerts sorted urgent → attention → info. Always returns at least one (an "all clear").
 */
export function deriveCommandCentreAlerts(s: CommandCentreSnapshot): CommandCentreAlert[] {
  const alerts: CommandCentreAlert[] = [];

  // 🔴 Urgent — guests/operations blocked or money/stock at risk.
  if (s.overdueCheckouts > 0) {
    alerts.push({
      id: 'overdue-checkouts',
      severity: 'urgent',
      title: `${s.overdueCheckouts} overdue check-out${s.overdueCheckouts > 1 ? 's' : ''}`,
      detail: 'Guests past their check-out date are still flagged in-house. Reconcile the folio or extend the stay.',
      href: '/bookings',
    });
  }
  if (s.outOfStock > 0) {
    alerts.push({
      id: 'out-of-stock',
      severity: 'urgent',
      title: `${s.outOfStock} item${s.outOfStock > 1 ? 's' : ''} out of stock`,
      detail: 'F&B items are at zero on hand. Approve a reorder or 86 the affected menu items.',
      href: '/intelligence',
    });
  }

  // 🟡 Attention — needs a decision soon.
  if (s.lowStock > 0) {
    alerts.push({
      id: 'low-stock',
      severity: 'attention',
      title: `${s.lowStock} item${s.lowStock > 1 ? 's' : ''} low on stock`,
      detail: 'At or below reorder point. Review the suggested reorders.',
      href: '/intelligence',
    });
  }
  if (s.openMaintenance > 0) {
    alerts.push({
      id: 'open-maintenance',
      severity: 'attention',
      title: `${s.openMaintenance} open maintenance request${s.openMaintenance > 1 ? 's' : ''}`,
      detail: 'Assign a technician before issues affect arriving guests.',
      href: '/housekeeping',
    });
  }
  if (s.pendingRateRecs > 0 || s.pendingReorderRecs > 0) {
    const parts = [
      s.pendingRateRecs > 0 ? `${s.pendingRateRecs} rate` : '',
      s.pendingReorderRecs > 0 ? `${s.pendingReorderRecs} reorder` : '',
    ].filter(Boolean);
    alerts.push({
      id: 'pending-recommendations',
      severity: 'attention',
      title: `${parts.join(' + ')} recommendation${s.pendingRateRecs + s.pendingReorderRecs > 1 ? 's' : ''} awaiting approval`,
      detail: 'Forecast-driven suggestions are waiting for an admin/front-desk decision.',
      href: '/intelligence',
    });
  }
  if (s.pendingHousekeeping > 0) {
    alerts.push({
      id: 'pending-housekeeping',
      severity: 'attention',
      title: `${s.pendingHousekeeping} room${s.pendingHousekeeping > 1 ? 's' : ''} to service`,
      detail: 'Rooms are dirty or mid-clean. Prioritise rooms with arrivals today.',
      href: '/housekeeping',
    });
  }

  // 🟢 Info — day-shape awareness.
  if (s.arrivalsToday > 0 || s.departuresToday > 0) {
    alerts.push({
      id: 'today-movements',
      severity: 'info',
      title: `${s.arrivalsToday} arrival${s.arrivalsToday === 1 ? '' : 's'} · ${s.departuresToday} departure${s.departuresToday === 1 ? '' : 's'} today`,
      detail: `${s.inHouse} guests in-house · ${Math.round(s.occupancyRate * 100)}% occupancy.`,
      href: '/bookings',
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: 'all-clear',
      severity: 'info',
      title: 'All clear',
      detail: 'No urgent operational issues right now.',
    });
  }

  return alerts.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}
