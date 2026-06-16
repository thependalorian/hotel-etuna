'use client';

/**
 * Guest DSAR (Data Subject Access Request) Page
 *
 * Purpose: Allow guests to submit data rights requests per Namibia Data Protection Bill.
 * Location: /app/guest/dsar/page.tsx
 */

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { securityLogger } from '@/lib/utils/security-logger.client';
import { Button } from '@/components/ui/Button';

const REQUEST_TYPES = [
  { value: 'access', label: 'Access my data', description: 'Request a copy of all personal data we hold about you' },
  { value: 'correction', label: 'Correct my data', description: 'Request correction of inaccurate or incomplete information' },
  { value: 'deletion', label: 'Delete my data', description: 'Request erasure of your personal data' },
  { value: 'portability', label: 'Export my data', description: 'Request a machine-readable copy of your data' },
  { value: 'restriction', label: 'Restrict processing', description: 'Request we limit how we use your data' },
  { value: 'objection', label: 'Object to processing', description: 'Object to us using your data for marketing or profiling' },
  { value: 'complaint', label: 'Submit a complaint', description: 'Raise a concern about how your data has been handled' },
] as const;

export default function GuestDsarPage() {
  const { status } = useSession();
  const router = useRouter();

  const [requestType, setRequestType] = useState<string>('access');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ reference: string; message: string } | null>(null);
  const [error, setError] = useState('');
  const [existingRequests, setExistingRequests] = useState<{ requestReference: string; requestType: string; requestDate: string; status: string }[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const loadExisting = async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch('/api/guest/dsar');
      if (res.ok) {
        const data = await res.json();
        setExistingRequests(data.requests ?? []);
      }
    } catch (e) {
      securityLogger.error('[DSARPage] load existing error', e);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 10) {
      setError('Please provide at least 10 characters describing your request.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/guest/dsar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType, requestDescription: description.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Failed to submit request. Please try again.');
        return;
      }

      setSubmitted({ reference: data.requestReference, message: data.message });
      setDescription('');
      loadExisting();
    } catch (e) {
      securityLogger.error('[DSARPage] submit error', e);
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Data Rights Request</h1>
        <p className="text-base-content/70 mb-6">You must be signed in to submit a data rights request.</p>
        <Button onClick={() => router.push('/login?redirect=/guest/dsar')}>
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display">Data Rights Request</h1>
        <p className="text-base-content/70 mt-2">
          Under the Namibia Data Protection Bill, you have the right to access, correct, or delete your personal data.
          We will respond within <strong>30 days</strong>.
        </p>
      </div>

      {submitted ? (
        <div className="alert alert-success">
          <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <div className="font-semibold">Request submitted</div>
            <div className="text-sm">{submitted.message}</div>
            <div className="text-sm mt-1">Reference: <code className="font-mono">{submitted.reference}</code></div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body space-y-6">
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Request type</span></label>
              <div className="grid grid-cols-1 gap-2">
                {REQUEST_TYPES.map((t) => (
                  <label key={t.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${requestType === t.value ? 'border-primary bg-primary/5' : 'border-base-300 hover:border-base-400'}`}>
                    <input
                      type="radio"
                      name="requestType"
                      value={t.value}
                      checked={requestType === t.value}
                      onChange={(e) => setRequestType(e.target.value)}
                      className="radio radio-primary mt-0.5"
                    />
                    <div>
                      <div className="font-medium text-sm">{t.label}</div>
                      <div className="text-xs text-base-content/60">{t.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Description *</span>
                <span className="label-text-alt">{description.length}/2000</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-32"
                placeholder="Describe your request in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                required
              />
            </div>

            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" isLoading={submitting}>
              Submit Request
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Previous Requests</h2>
          <button className="btn btn-ghost btn-sm rounded-full" onClick={loadExisting} disabled={loadingRequests}>
            {loadingRequests ? <span className="loading loading-spinner loading-xs" /> : 'Refresh'}
          </button>
        </div>

        {existingRequests.length === 0 ? (
          <p className="text-base-content/50 text-sm">
            No previous requests.{' '}
            <button className="link link-primary" onClick={loadExisting}>Load history</button>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {existingRequests.map((r) => (
                  <tr key={r.requestReference}>
                    <td className="font-mono text-xs">{r.requestReference}</td>
                    <td className="capitalize">{r.requestType}</td>
                    <td>{r.requestDate}</td>
                    <td>
                      <span className={`badge badge-sm ${r.status === 'resolved' ? 'badge-success' : r.status === 'pending' ? 'badge-warning' : 'badge-info'}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-xs text-base-content/40 border-t border-base-200 pt-4">
        Requests processed under the Namibia Data Protection Bill (draft) and Electronic Transactions Act 2019.
        Contact <a href="mailto:admin@hoteletuna.com" className="link">admin@hoteletuna.com</a> for urgent matters.
      </div>
    </div>
  );
}
