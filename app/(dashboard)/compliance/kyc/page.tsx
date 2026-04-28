/**
 * KYC/KYB compliance queue (dashboard)
 *
 * Purpose: List verification cases and link to reviewer detail
 * Location: /app/(dashboard)/compliance/kyc/page.tsx
 */

import React from 'react';
import Link from 'next/link';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { ComplianceVerificationService } from '@/lib/services/compliance/ComplianceVerificationService';
import PageHeader from '@/components/shared/PageHeader';

export const dynamic = 'force-dynamic';

function kycStatusBadge(status: string): string {
  if (status === 'approved') return 'badge-success';
  if (status === 'rejected') return 'badge-error';
  if (status === 'needs_info') return 'badge-warning';
  if (status === 'pending_manual_review' || status === 'in_review') return 'badge-info';
  return 'badge-outline';
}

function isTerminalKycStatus(status: string): boolean {
  return status === 'approved' || status === 'rejected';
}

export default async function ComplianceKycPage() {
  const session = await getSessionWithTenantContext();
  const tenantId = session?.user?.tenantId as string | undefined;
  let cases: Awaited<ReturnType<ComplianceVerificationService['listCases']>> = [];

  if (tenantId) {
    const svc = new ComplianceVerificationService();
    cases = await svc.listCases(tenantId).catch(() => []);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="KYC / KYB queue"
        description="Tiered verification workflows (LangGraph). Open a case to view documents and approve manually."
        actions={
          <Link href="/compliance/kyc/new" className="btn btn-primary min-h-[44px]">
            New case
          </Link>
        }
      />

      <div className="alert border border-info/20 bg-info/10 text-base-content">
        <div>
          <h2 className="font-semibold">Reviewer workflow guardrails</h2>
          <p className="text-sm text-base-content/70">
            Cases move through validated states. Approved and rejected cases are terminal audit
            states; create a new case if fresh evidence changes the review.
          </p>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Subject</th>
                  <th>Party</th>
                  <th>Tier</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {cases.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-base-content/60 py-8">
                      No cases yet. Create a case and attach document URLs, then run the workflow.
                    </td>
                  </tr>
                )}
                {cases.map((c) => (
                  <tr key={c.id} className="hover">
                    <td>
                      <span className={`badge capitalize ${kycStatusBadge(c.status)}`}>
                        {c.status.replaceAll('_', ' ')}
                      </span>
                      {isTerminalKycStatus(c.status) ? (
                        <span className="ml-2 text-xs text-success">terminal</span>
                      ) : null}
                    </td>
                    <td className="font-mono text-sm">
                      {c.subjectType}
                      {c.subjectId ? ` · ${c.subjectId.slice(0, 8)}…` : ''}
                    </td>
                    <td>{c.subjectParty}</td>
                    <td>{c.kycTier}</td>
                    <td className="text-sm text-base-content/70">
                      {c.updatedAt
                        ? new Date(c.updatedAt).toLocaleString()
                        : '—'}
                    </td>
                    <td>
                      <Link
                        href={`/compliance/kyc/${c.id}`}
                        className="btn btn-sm btn-ghost min-h-[44px]"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
