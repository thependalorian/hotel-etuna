/**
 * FraudRuleEditor
 *
 * Purpose: Tenant admin UI to view and toggle fraud detection rules.
 * Location: components/features/fraud/FraudRuleEditor.tsx
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { securityLogger } from '@/lib/utils/security-logger.client';

type FraudRule = {
  id: string;
  ruleName: string;
  ruleType: string;
  description: string | null;
  action: string;
  isActive: boolean | null;
  priority: number | null;
  triggerCount: number | null;
  thresholdValue: string | null;
  thresholdOperator: string | null;
};

interface FraudRuleEditorProps {
  tenantId: string;
}

export function FraudRuleEditor({ tenantId }: FraudRuleEditorProps) {
  const [rules, setRules] = useState<FraudRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fraud/rules?tenantId=${tenantId}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'Failed to load rules');
      }
      setRules(json.data ?? []);
    } catch (e) {
      securityLogger.error('[FraudRuleEditor] load', e);
      setError(e instanceof Error ? e.message : 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  async function toggleRule(rule: FraudRule) {
    setBusyId(rule.id);
    try {
      const res = await fetch('/api/fraud/rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId: rule.id, isActive: !rule.isActive }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'Update failed');
      }
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, isActive: json.data.isActive } : r))
      );
    } catch (e) {
      securityLogger.error('[FraudRuleEditor] toggle', e);
      setError(e instanceof Error ? e.message : 'Failed to update rule');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">Detection rules</h2>
        <p className="text-sm text-base-content/70">
          Toggle tenant rules for card-not-present limits, EFT thresholds, and geo mismatch checks.
        </p>

        {error && (
          <div className="alert alert-error" role="alert">
            <span>{error}</span>
            <button
              type="button"
              className="btn btn-sm btn-ghost rounded-full"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {rules.length === 0 ? (
          <p className="text-base-content/60 py-4">No rules configured for this tenant.</p>
        ) : (
          <div className="overflow-x-auto table-scroll">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Rule</th>
                  <th>Type</th>
                  <th>Action</th>
                  <th>Triggers</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id}>
                    <td>
                      <div className="font-medium">{rule.ruleName}</div>
                      {rule.description && (
                        <div className="text-xs text-base-content/60">{rule.description}</div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-ghost badge-sm">{rule.ruleType}</span>
                    </td>
                    <td>{rule.action}</td>
                    <td>{rule.triggerCount ?? 0}</td>
                    <td>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={rule.isActive ?? false}
                        disabled={busyId === rule.id}
                        aria-label={`Toggle ${rule.ruleName}`}
                        onChange={() => toggleRule(rule)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
