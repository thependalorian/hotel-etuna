/**
 * Command Centre — real-time staff operations dashboard.
 * Location: /app/(dashboard)/command-centre/page.tsx
 *
 * Today's live snapshot (arrivals/departures/in-house/occupancy/F&B) + colour-coded smart alerts
 * (🔴 urgent / 🟡 attention / 🟢 info). Polls every 45s for near-real-time refresh.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Gauge,
  LogIn,
  LogOut,
  BedDouble,
  UtensilsCrossed,
  Banknote,
  Sparkles,
  Wrench,
  AlertTriangle,
  AlertCircle,
  Info,
  RefreshCw,
} from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { apiUrl } from '@/lib/utils/api-url';
import { securityLogger } from '@/lib/utils/security-logger.client';
import { formatCurrencyNAD } from '@/lib/formatters';
import type {
  CommandCentreSnapshot,
  CommandCentreAlert,
} from '@/lib/services/intelligence/command-centre-alerts';

const POLL_MS = 45_000;

const SEVERITY_STYLE = {
  urgent: { ring: 'border-error/30 bg-error/5', dot: 'text-error', Icon: AlertCircle },
  attention: { ring: 'border-warning/30 bg-warning/5', dot: 'text-warning', Icon: AlertTriangle },
  info: { ring: 'border-nude-200 bg-nude-50/60', dot: 'text-ink-500', Icon: Info },
} as const;

export default function CommandCentrePage() {
  const { data: session } = useSession();
  const [snapshot, setSnapshot] = useState<CommandCentreSnapshot | null>(null);
  const [alerts, setAlerts] = useState<CommandCentreAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (initial = false) => {
    try {
      if (initial) setLoading(true);
      else setRefreshing(true);
      const res = await fetch(apiUrl('/api/dashboard/command-centre'));
      if (res.ok) {
        const { data } = await res.json();
        setSnapshot(data.snapshot);
        setAlerts(data.alerts ?? []);
      }
    } catch (error) {
      securityLogger.error('[CommandCentre] load failed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    load(true);
    const t = setInterval(() => load(false), POLL_MS);
    return () => clearInterval(t);
  }, [session, load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" text="Loading command centre..." />
      </div>
    );
  }

  const s = snapshot;
  const tiles = s
    ? [
        { label: 'Occupancy', value: `${Math.round(s.occupancyRate * 100)}%`, sub: `${s.inHouse}/${s.totalRooms} rooms`, icon: Gauge },
        { label: 'Arrivals today', value: s.arrivalsToday, sub: 'expected check-ins', icon: LogIn },
        { label: 'Departures today', value: s.departuresToday, sub: 'expected check-outs', icon: LogOut },
        { label: 'In-house', value: s.inHouse, sub: 'guests staying', icon: BedDouble },
        { label: 'Orders today', value: s.ordersToday, sub: 'restaurant orders', icon: UtensilsCrossed },
        { label: 'F&B revenue today', value: formatCurrencyNAD(s.revenueToday), sub: 'gross', icon: Banknote },
        { label: 'Rooms to service', value: s.pendingHousekeeping, sub: 'dirty / cleaning', icon: Sparkles },
        { label: 'Open maintenance', value: s.openMaintenance, sub: 'requests', icon: Wrench },
      ]
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="etuna-page-title mb-2">Command centre</h1>
          <p className="text-ink-600">
            Live operations{' '}
            {s && (
              <span className="text-ink-400">
                · updated {new Date(s.generatedAt).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-nude-200 text-ink-800 font-medium hover:bg-nude-50 transition-colors min-h-[44px]"
          onClick={() => load(false)}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.label} className="rounded-etuna-card border border-nude-200 bg-white p-5">
              <div className="flex items-center gap-2 text-ink-500">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">{t.label}</span>
              </div>
              <p className="text-2xl font-bold text-ink-900 mt-2">{t.value}</p>
              <p className="text-xs text-ink-500 mt-0.5">{t.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Smart alerts */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-ink-900">Smart alerts</h2>
        <div className="space-y-2">
          {alerts.map((a) => {
            const style = SEVERITY_STYLE[a.severity];
            const Icon = style.Icon;
            const body = (
              <div className={`flex items-start gap-3 rounded-etuna-card border p-4 ${style.ring}`}>
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${style.dot}`} />
                <div>
                  <p className="font-semibold text-ink-900">{a.title}</p>
                  <p className="text-sm text-ink-600">{a.detail}</p>
                </div>
              </div>
            );
            return a.href ? (
              <Link key={a.id} href={a.href} className="block transition-transform hover:-translate-y-px">
                {body}
              </Link>
            ) : (
              <div key={a.id}>{body}</div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
