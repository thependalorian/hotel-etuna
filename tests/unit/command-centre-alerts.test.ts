/**
 * Unit tests for command-centre smart-alert derivation (pure). Covers happy path,
 * prioritisation order, and the all-clear fallback.
 */
import { describe, it, expect } from 'vitest';
import {
  deriveCommandCentreAlerts,
  type CommandCentreSnapshot,
} from '@/lib/services/intelligence/command-centre-alerts';

function snapshot(overrides: Partial<CommandCentreSnapshot> = {}): CommandCentreSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    arrivalsToday: 0,
    departuresToday: 0,
    inHouse: 0,
    totalRooms: 35,
    occupancyRate: 0,
    overdueCheckouts: 0,
    ordersToday: 0,
    revenueToday: 0,
    pendingHousekeeping: 0,
    openMaintenance: 0,
    lowStock: 0,
    outOfStock: 0,
    pendingRateRecs: 0,
    pendingReorderRecs: 0,
    ...overrides,
  };
}

describe('deriveCommandCentreAlerts', () => {
  it('returns an all-clear info alert when nothing is wrong', () => {
    const alerts = deriveCommandCentreAlerts(snapshot());
    expect(alerts).toHaveLength(1);
    expect(alerts[0].id).toBe('all-clear');
    expect(alerts[0].severity).toBe('info');
  });

  it('flags overdue checkouts and out-of-stock as urgent, sorted first', () => {
    const alerts = deriveCommandCentreAlerts(
      snapshot({ overdueCheckouts: 2, outOfStock: 1, lowStock: 3, arrivalsToday: 4 }),
    );
    expect(alerts[0].severity).toBe('urgent');
    const ids = alerts.map((a) => a.id);
    expect(ids).toContain('overdue-checkouts');
    expect(ids).toContain('out-of-stock');
    // Urgent must come before attention/info.
    const firstAttention = alerts.findIndex((a) => a.severity === 'attention');
    const lastUrgent = alerts.map((a) => a.severity).lastIndexOf('urgent');
    expect(lastUrgent).toBeLessThan(firstAttention);
  });

  it('summarises pending recommendations and today movements', () => {
    const alerts = deriveCommandCentreAlerts(
      snapshot({ pendingRateRecs: 2, pendingReorderRecs: 1, arrivalsToday: 3, departuresToday: 1, inHouse: 20, occupancyRate: 0.57 }),
    );
    const rec = alerts.find((a) => a.id === 'pending-recommendations');
    expect(rec?.severity).toBe('attention');
    expect(rec?.title).toContain('2 rate');
    expect(rec?.title).toContain('1 reorder');
    const move = alerts.find((a) => a.id === 'today-movements');
    expect(move?.title).toContain('3 arrivals');
    expect(move?.detail).toContain('57% occupancy');
  });
});
