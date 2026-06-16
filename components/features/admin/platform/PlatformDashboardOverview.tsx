/**
 * Platform Dashboard Overview Component
 * 
 * Purpose: Display platform statistics and quick actions
 * Location: components/features/admin/platform/PlatformDashboardOverview.tsx
 * 
 * Features:
 * - Platform statistics cards
 * - Quick action buttons
 * - Recent activity feed
 * - System health indicators
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { apiUrl } from '@/lib/utils/api-url';
import { Button } from '@/components/ui/Button';
import { 
  Building2, 
  Users, 
  Home, 
  TrendingUp,
  Activity,
  CheckCircle,
  Shield
} from 'lucide-react';
import PlatformIntelligenceDigest from '@/components/features/admin/platform/PlatformIntelligenceDigest';

interface ComplianceSnapshot {
  openSupportTickets: number;
  pendingConsumerRights: number;
  openCyberIncidents: number;
  auditEvents24h: number;
  activeNamqrCodes: number;
  openBankingApiErrors24h: number;
  failedTransactions24h: number;
}

interface PaymentRailsSummary {
  market: string;
  defaultCurrency: string;
  cardRail: string;
  rails: { key: string; label: string; paymentMethodType: string; paymentGatewayLabel: string }[];
}

interface PaymentsByRailReport {
  windowDays: number;
  rows: { bucket: string; label: string; transactionCount: number; totalAmountNad: string }[];
}

interface PlatformDashboardOverviewProps {
  stats: {
    totalTenants: number;
    totalUsers: number;
    totalProperties: number;
    compliance: ComplianceSnapshot;
  };
  userRole: string;
  paymentRails?: PaymentRailsSummary;
  paymentsByRail?: PaymentsByRailReport;
}

export default function PlatformDashboardOverview({
  stats,
  userRole,
  paymentRails,
  paymentsByRail,
}: PlatformDashboardOverviewProps) {
  const isSuperAdmin = userRole === 'super-admin';

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tenants Card */}
        <div className="rounded-lg border border-nude-200 bg-surface-elevated shadow-nude-soft hover:shadow-nude-medium transition-all duration-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-nude-600 mb-2">Total Tenants</p>
                <p className="font-display text-4xl font-bold text-nude-900">{stats.totalTenants}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-nude-100 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-nude-600" />
              </div>
            </div>
            <div className="flex justify-end">
              <Link 
                href="/admin/platform/tenants"
                className="inline-flex items-center gap-2 px-4 py-2 bg-nude-600 text-white rounded-lg font-semibold text-sm hover:bg-nude-700 transition-colors duration-200 min-h-[44px]"
              >
                Manage Tenants
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Users Card */}
        <div className="rounded-lg border border-nude-200 bg-surface-elevated shadow-nude-soft hover:shadow-nude-medium transition-all duration-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-nude-600 mb-2">Total Users</p>
                <p className="font-display text-4xl font-bold text-nude-900">{stats.totalUsers}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-nude-100 flex items-center justify-center">
                <Users className="w-8 h-8 text-nude-600" />
              </div>
            </div>
            <div className="flex justify-end">
              <Link 
                href="/admin/platform/users"
                className="inline-flex items-center gap-2 px-4 py-2 bg-nude-600 text-white rounded-lg font-semibold text-sm hover:bg-nude-700 transition-colors duration-200 min-h-[44px]"
              >
                Manage Users
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Properties Card */}
        <div className="rounded-lg border border-nude-200 bg-surface-elevated shadow-nude-soft hover:shadow-nude-medium transition-all duration-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-nude-600 mb-2">Total Properties</p>
                <p className="font-display text-4xl font-bold text-nude-900">{stats.totalProperties}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-nude-100 flex items-center justify-center">
                <Home className="w-8 h-8 text-nude-600" />
              </div>
            </div>
            <div className="flex justify-end">
              <Link 
                href="/admin/platform/properties"
                className="inline-flex items-center gap-2 px-4 py-2 bg-nude-600 text-white rounded-lg font-semibold text-sm hover:bg-nude-700 transition-colors duration-200 min-h-[44px]"
              >
                Manage Properties
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <PlatformIntelligenceDigest />

      {/* Compliance & reporting */}
      <div className="rounded-lg border border-nude-200 bg-surface-elevated shadow-nude-soft">
        <div className="p-6">
          <h2 className="font-display text-2xl font-bold text-nude-900 mb-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-semantic-info-light flex items-center justify-center">
              <Shield className="w-5 h-5 text-semantic-info-dark" />
            </div>
            Compliance Snapshot
          </h2>
          <p className="text-sm text-nude-600 mb-6 leading-relaxed">
            Indicators tied to <code className="px-1.5 py-0.5 bg-nude-100 text-nude-800 rounded text-xs font-mono">audit_trail</code>, support tickets, consumer rights,
            and cybersecurity incident tables. Use Audit Logs for detail; confirm obligations with your counsel.
          </p>
          <p className="text-xs font-bold text-nude-700 uppercase tracking-wider mb-3">
            Consumer Protection &amp; Records
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-nude-50 rounded-lg border border-nude-200">
              <div className="text-xs font-semibold text-nude-600 mb-2">Open Support</div>
              <div className="font-display text-3xl font-bold text-nude-900">{stats.compliance.openSupportTickets}</div>
            </div>
            <div className="p-4 bg-nude-50 rounded-lg border border-nude-200">
              <div className="text-xs font-semibold text-nude-600 mb-2">Pending Consumer Rights</div>
              <div className="font-display text-3xl font-bold text-nude-900">{stats.compliance.pendingConsumerRights}</div>
            </div>
            <div className="p-4 bg-nude-50 rounded-lg border border-nude-200">
              <div className="text-xs font-semibold text-nude-600 mb-2">Open Cyber Incidents</div>
              <div className="font-display text-3xl font-bold text-nude-900">{stats.compliance.openCyberIncidents}</div>
            </div>
            <div className="p-4 bg-nude-50 rounded-lg border border-nude-200">
              <div className="text-xs font-semibold text-nude-600 mb-2">Audit Events (24h)</div>
              <div className="font-display text-3xl font-bold text-nude-900">{stats.compliance.auditEvents24h}</div>
            </div>
          </div>
          <p className="text-xs font-medium text-base-content/60 uppercase tracking-wide mt-6 mb-2">
            NamQR · Open banking · Fraud / payment signals
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-title text-xs">Active NamQR codes</div>
              <div className="stat-value text-2xl">{stats.compliance.activeNamqrCodes}</div>
            </div>
            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-title text-xs">OB API errors (24h)</div>
              <div className={`stat-value text-2xl ${stats.compliance.openBankingApiErrors24h > 0 ? 'text-warning' : ''}`}>
                {stats.compliance.openBankingApiErrors24h}
              </div>
            </div>
            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-title text-xs">Failed txs (24h)</div>
              <div className={`stat-value text-2xl ${stats.compliance.failedTransactions24h > 0 ? 'text-error' : ''}`}>
                {stats.compliance.failedTransactions24h}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link href="/admin/platform/support" className="btn btn-outline btn-sm min-h-[44px]">
              Support
            </Link>
            <Link href="/admin/platform/audit" className="btn btn-outline btn-sm min-h-[44px]">
              Audit trail
            </Link>
            <a
              href={apiUrl('/api/admin/platform/compliance/summary')}
              className="btn btn-ghost btn-sm min-h-[44px]"
              target="_blank"
              rel="noreferrer"
            >
              Reporting pack (JSON)
            </a>
            <Button asChild size="sm">
              <Link href="/admin/platform/soc2">SOC 2 audit</Link>
            </Button>
          </div>
          {paymentRails && (
            <div className="mt-4 p-3 rounded-lg bg-base-200 text-sm">
              <p className="font-medium mb-1">
                Namibia payment rails ({paymentRails.defaultCurrency}) — card:{' '}
                {paymentRails.cardRail.replace(/_/g, ' ')}
              </p>
              <p className="text-base-content/80 mb-2">
                Intended acceptance: {paymentRails.rails.map((r) => r.label).join(' · ')}.
              </p>
              <p className="text-xs text-base-content/60">
                Persist <code className="text-xs">metadata.rail</code> and{' '}
                <code className="text-xs">payment_gateway</code> on payment session rows at initiation time.
              </p>
            </div>
          )}
          {paymentsByRail && paymentsByRail.rows.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <p className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-2">
                Volume by rail (last {paymentsByRail.windowDays}d · NAD)
              </p>
              <table className="table table-sm table-zebra w-full">
                <thead>
                  <tr>
                    <th>Rail</th>
                    <th>Bucket</th>
                    <th className="text-right">Count</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsByRail.rows.map((r) => (
                    <tr key={r.bucket}>
                      <td>{r.label}</td>
                      <td className="font-mono text-xs">{r.bucket}</td>
                      <td className="text-right">{r.transactionCount}</td>
                      <td className="text-right">{r.totalAmountNad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {paymentsByRail && paymentsByRail.rows.length === 0 && (
            <p className="mt-4 text-sm text-base-content/60">
              No transactions in the last {paymentsByRail.windowDays} days — reporting will populate when
              integrations write rows using <code className="text-xs">buildTransactionMetadata</code>.
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-nude-200 bg-surface-elevated shadow-nude-soft">
        <div className="p-6">
          <h2 className="font-display text-2xl font-bold text-nude-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              href="/admin/platform/tenants"
              className="flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-nude-200 text-nude-700 rounded-lg font-semibold text-sm hover:border-nude-400 hover:bg-nude-50 transition-all duration-200 min-h-[56px]"
            >
              <Building2 className="w-5 h-5" />
              View Tenants
            </Link>
            <Link 
              href="/admin/platform/users"
              className="flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-nude-200 text-nude-700 rounded-lg font-semibold text-sm hover:border-nude-400 hover:bg-nude-50 transition-all duration-200 min-h-[56px]"
            >
              <Users className="w-5 h-5" />
              View Users
            </Link>
            <Link 
              href="/admin/platform/analytics"
              className="flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-nude-200 text-nude-700 rounded-lg font-semibold text-sm hover:border-nude-400 hover:bg-nude-50 transition-all duration-200 min-h-[56px]"
            >
              <TrendingUp className="w-5 h-5" />
              View Analytics
            </Link>
            <Link 
              href="/admin/platform/audit"
              className="flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-nude-200 text-nude-700 rounded-lg font-semibold text-sm hover:border-nude-400 hover:bg-nude-50 transition-all duration-200 min-h-[56px]"
            >
              <Activity className="w-5 h-5" />
              Audit Logs
            </Link>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="rounded-lg border border-nude-200 bg-surface-elevated shadow-nude-soft">
        <div className="p-6">
          <h2 className="font-display text-2xl font-bold text-nude-900 mb-6">System Health</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-semantic-success-light rounded-lg border border-semantic-success/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-semantic-success" />
                <span className="font-semibold text-nude-900">Database</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-semantic-success text-white">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse-soft" />
                Healthy
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-semantic-success-light rounded-lg border border-semantic-success/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-semantic-success" />
                <span className="font-semibold text-nude-900">Authentication</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-semantic-success text-white">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse-soft" />
                Healthy
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-semantic-success-light rounded-lg border border-semantic-success/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-semantic-success" />
                <span className="font-semibold text-nude-900">API Services</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-semantic-success text-white">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse-soft" />
                Healthy
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Super Admin Notice */}
      {isSuperAdmin && (
        <div className="flex items-start gap-3 p-4 bg-semantic-info-light text-semantic-info-dark rounded-lg border border-semantic-info/20">
          <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Super Admin Access</p>
            <p className="text-sm">You have full platform permissions with unrestricted access to all features.</p>
          </div>
        </div>
      )}
    </div>
  );
}
