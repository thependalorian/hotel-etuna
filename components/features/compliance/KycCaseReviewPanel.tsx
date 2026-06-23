/**
 * KycCaseReviewPanel — documents, run workflow, manual approve/reject
 *
 * Purpose: Reviewer UI for a single compliance case (DaisyUI)
 * Location: /components/features/compliance/KycCaseReviewPanel.tsx
 */

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/shared/StatusBadge';

type CaseRow = {
  id: string;
  status: string;
  subjectType: string;
  subjectId: string | null;
  subjectParty: string;
  kycTier: string;
  profile: Record<string, unknown>;
  workflowStage: string | null;
  workflowSnapshot: Record<string, unknown> | null;
  reviewerNotes: string | null;
};

type DocRow = {
  id: string;
  documentType: string;
  fileUrl: string;
  fileName: string | null;
  createdAt: string | null;
};

const DOC_HELP = [
  'national_id_or_passport — ID or passport scan',
  'proof_of_address — utility / bank statement',
  'company_registration — business registry',
  'proof_of_business_activity — lease, license, or similar',
].join('\n');

const TERMINAL_STATUSES = new Set(['approved', 'rejected', 'closed']);

export function KycCaseReviewPanel({ caseId }: { caseId: string }) {
  const [kase, setKase] = useState<CaseRow | null>(null);
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const docTypeRef = useRef<HTMLSelectElement>(null);
  const docUrlRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/compliance/kyc-cases/${caseId}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json?.error?.message || 'Failed to load case');
      return;
    }
    setKase(json.data.case);
    setDocuments(json.data.documents || []);
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addDocument(e: React.FormEvent) {
    e.preventDefault();
    const documentType = docTypeRef.current?.value;
    const fileUrl = docUrlRef.current?.value?.trim();
    if (!documentType || !fileUrl) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/compliance/kyc-cases/${caseId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType, fileUrl }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error?.message || 'Could not add document');
        return;
      }
      if (docUrlRef.current) docUrlRef.current.value = '';
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function runWorkflow() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/compliance/kyc-cases/${caseId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowAutoApproveLite: false }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error?.message || 'Workflow failed');
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function submitDecision(decision: 'approve' | 'reject' | 'needs_info') {
    setBusy(true);
    setError(null);
    const notes = notesRef.current?.value?.trim();
    try {
      const res = await fetch(`/api/compliance/kyc-cases/${caseId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, notes: notes || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error?.message || 'Decision failed');
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!kase) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-12">
        {error ? (
          <div className="alert alert-error max-w-xl text-sm" role="alert">
            {error}
          </div>
        ) : (
          <span className="loading loading-spinner loading-lg" />
        )}
      </div>
    );
  }

  const isTerminalStatus = TERMINAL_STATUSES.has(kase.status.toLowerCase());

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 p-4 bg-semantic-error-light text-semantic-error-dark rounded-etuna-input border border-semantic-error/20" role="alert">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Case Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between p-4 bg-nude-50 rounded-etuna-input border border-nude-200">
        <div className="flex flex-wrap gap-3 items-center">
          <StatusBadge status={kase.status} showDot />
          <span className="text-sm font-semibold text-ink-700">
            {kase.subjectParty} · {kase.kycTier}
          </span>
          {kase.workflowStage && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-nude-200 text-ink-800 border border-nude-300">
              {kase.workflowStage}
            </span>
          )}
        </div>
        <Link 
          href="/compliance/kyc" 
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-nude-100 rounded-etuna-input transition-colors duration-200 min-h-[44px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Back to Queue
        </Link>
      </div>

      {/* Profile and Workflow Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-etuna-input border border-nude-200 bg-surface-elevated">
          <div className="p-6">
            <h2 className="font-display text-xl font-semibold text-ink-900 mb-4">Subject Profile</h2>
            <pre className="bg-nude-50 rounded-etuna-input p-4 text-xs font-mono overflow-x-auto max-h-64 border border-nude-200 text-ink-800 scrollbar-thin">
              {JSON.stringify(kase.profile, null, 2)}
            </pre>
          </div>
        </div>

        <div className="rounded-etuna-input border border-nude-200 bg-surface-elevated">
          <div className="p-6">
            <h2 className="font-display text-xl font-semibold text-ink-900 mb-4">Last Workflow Snapshot</h2>
            <pre className="bg-nude-50 rounded-etuna-input p-4 text-xs font-mono overflow-x-auto max-h-64 border border-nude-200 text-ink-800 scrollbar-thin">
              {JSON.stringify(kase.workflowSnapshot, null, 2) || '—'}
            </pre>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-200">
        <div className="card-body gap-4">
          <h2 className="card-title text-lg">Documents</h2>
          <ul className="space-y-2">
            {documents.length === 0 && (
              <li className="text-sm opacity-60">No documents registered yet.</li>
            )}
            {documents.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center gap-2 justify-between border border-base-200 rounded-etuna-input p-3"
              >
                <span className="font-mono text-sm">{d.documentType}</span>
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary text-sm break-all"
                >
                  Open file
                </a>
              </li>
            ))}
          </ul>

          <form onSubmit={addDocument} className="flex flex-col gap-3 border-t border-base-200 pt-4">
            <p className="text-xs text-base-content/70 whitespace-pre-line">{DOC_HELP}</p>
            <div className="flex flex-col md:flex-row gap-2">
              <select
                ref={docTypeRef}
                className="select select-bordered flex-1"
                defaultValue="national_id_or_passport"
              >
                <option value="national_id_or_passport">national_id_or_passport</option>
                <option value="proof_of_address">proof_of_address</option>
                <option value="company_registration">company_registration</option>
                <option value="proof_of_business_activity">proof_of_business_activity</option>
                <option value="other">other</option>
              </select>
              <input
                ref={docUrlRef}
                type="url"
                className="input input-bordered flex-1"
                placeholder="https://… public or signed URL"
              />
            </div>
            <button type="submit" className="btn btn-outline min-h-[44px]" disabled={busy}>
              Register document
            </button>
          </form>
        </div>
      </div>

      {/* Workflow & Decisions */}
      <div className="rounded-etuna-input border border-nude-200 bg-surface-elevated">
        <div className="p-6 space-y-6">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink-900 mb-2">Workflow & Decisions</h2>
            <p className="text-sm text-ink-600 leading-relaxed">
              Run validation runs the LangGraph state machine (required fields + document types).
              Manual approve/reject records the reviewer and updates linked staff when applicable.
            </p>
          </div>

          {isTerminalStatus && (
            <div className="flex items-start gap-3 p-4 bg-semantic-info-light text-semantic-info-dark rounded-etuna-input border border-semantic-info/20">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <p className="font-semibold mb-1">Terminal State</p>
                <p className="text-sm">This case is in a terminal state. Decisions are locked to preserve the audit record.</p>
              </div>
            </div>
          )}

          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 bg-nude-600 text-white rounded-etuna-input font-semibold hover:bg-nude-700 shadow-nude-soft transition-all duration-200 min-h-[52px] w-full md:w-auto"
            disabled={busy || isTerminalStatus}
            onClick={runWorkflow}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Run Validation Workflow
          </button>

          <div className="border-t border-nude-200 pt-6">
            <h3 className="font-display text-lg font-semibold text-ink-900 mb-4">Reviewer Decision</h3>
            <textarea
              ref={notesRef}
              className="w-full min-h-[120px] p-4 border border-nude-300 rounded-etuna-input focus:border-nude-500 focus:ring-2 focus:ring-ci-primary/20 transition-all duration-200 text-ink-900 placeholder:text-nude-400"
              placeholder="Add your review notes here (optional, stored on the case)"
              defaultValue={kase.reviewerNotes || ''}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3 bg-semantic-success text-white rounded-etuna-input font-semibold hover:bg-semantic-success-dark transition-all duration-200 min-h-[52px]"
              disabled={busy || isTerminalStatus}
              onClick={() => submitDecision('approve')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approve Case
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3 bg-semantic-error text-white rounded-etuna-input font-semibold hover:bg-semantic-error-dark transition-all duration-200 min-h-[52px]"
              disabled={busy || isTerminalStatus}
              onClick={() => submitDecision('reject')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject Case
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3 bg-semantic-warning text-white rounded-etuna-input font-semibold hover:bg-semantic-warning-dark transition-all duration-200 min-h-[52px]"
              disabled={busy || isTerminalStatus}
              onClick={() => submitDecision('needs_info')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Request More Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
