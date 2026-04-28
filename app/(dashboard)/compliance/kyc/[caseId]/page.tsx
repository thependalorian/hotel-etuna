/**
 * KYC/KYB case detail
 *
 * Purpose: Wrapper for reviewer panel
 * Location: /app/(dashboard)/compliance/kyc/[caseId]/page.tsx
 */

import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { KycCaseReviewPanel } from '@/components/features/compliance/KycCaseReviewPanel';

export const dynamic = 'force-dynamic';

export default async function KycCaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Verification case"
        description="View evidence, run the LangGraph validation graph, and apply a manual decision."
      />
      <KycCaseReviewPanel caseId={caseId} />
    </div>
  );
}
