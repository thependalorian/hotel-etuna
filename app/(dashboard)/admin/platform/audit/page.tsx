/**
 * Platform Admin - Audit Logs Page
 *
 * Purpose: Drizzle `audit_trail` with filters (resource type, action) for regulated evidence trails
 * Location: app/(dashboard)/admin/platform/audit/page.tsx
 */

import React from 'react';
import { getCurrentPlatformAdmin } from '@/lib/auth/platform-admin';
import AuditLogViewer from '@/components/features/admin/platform/AuditLogViewer';
import { AuditChainVerifyCard } from '@/components/features/compliance/AuditChainVerifyCard';
import { REGULATORY_PACK_FOLDER, REGULATORY_MATERIALS_INDEX } from '@/lib/compliance/regulatory-context';
import { Shield } from 'lucide-react';

export default async function PlatformAuditPage() {
  const user = await getCurrentPlatformAdmin();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="etuna-page-title mb-2">Audit logs</h1>
        <p className="text-base-content/70">
          Court-admissible-style trail (ETA-oriented) — filter by resource type and action. Pair entries with
          your counsel’s reading of PSD, NamQR, Open Banking, and fraud guidance.
        </p>
      </div>

      <div className="alert alert-info">
        <Shield className="w-5 h-5" />
        <div className="text-sm">
          <p className="font-medium mb-1">Regulation &amp; compliance pack (local)</p>
          <p className="text-base-content/80 mb-2">
            Cross-check implementation against PDFs in{' '}
            <kbd className="kbd kbd-sm">~/Downloads/{REGULATORY_PACK_FOLDER}</kbd> — e.g. ETA 2019, BoN
            PSD-1 / PSD-3 / PSD-12, NamQR standards, Namibia Open Banking, NPS fraud report.
          </p>
          <details className="collapse collapse-arrow bg-base-200 rounded-lg">
            <summary className="collapse-title text-sm font-medium min-h-0 py-2">
              Material index (engineering hints)
            </summary>
            <ul className="collapse-content text-xs text-base-content/80 list-disc pl-4 space-y-2 pt-0">
              {REGULATORY_MATERIALS_INDEX.map((m) => (
                <li key={m.key}>
                  <span className="font-medium">{m.label}</span>
                  <span className="block opacity-90">{m.file}</span>
                  <span className="block mt-0.5">{m.engineeringFocus}</span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>

      <AuditChainVerifyCard />

      <AuditLogViewer />
    </div>
  );
}
