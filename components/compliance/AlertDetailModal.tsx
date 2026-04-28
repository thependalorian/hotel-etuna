/**
 * Alert Detail Modal Component
 * 
 * Purpose: Display detailed information about AML alerts
 * Location: components/compliance/AlertDetailModal.tsx
 * 
 * Features:
 * - Alert details and context
 * - Risk assessment visualization
 * - Investigation actions
 * - STR creation workflow
 */

'use client';

import { useState } from 'react';
import { X, AlertTriangle, FileText, CheckCircle, XCircle } from 'lucide-react';

interface Alert {
  id: string;
  alertType: string;
  riskLevel: string;
  riskScore: string;
  amount: string;
  currency: string;
  status: string;
  transactionReference: string;
  detectionTimestamp: Date;
  patternDetails: any;
  requiresStr: boolean;
}

interface AlertDetailModalProps {
  alert: Alert | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (alertId: string, action: string) => Promise<void>;
}

export default function AlertDetailModal({ 
  alert, 
  isOpen, 
  onClose, 
  onResolve 
}: AlertDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');

  if (!isOpen || !alert) return null;

  const handleAction = async (action: 'clear' | 'escalate' | 'create_str') => {
    setLoading(true);
    try {
      await onResolve(alert.id, action);
      onClose();
    } catch (error) {
      console.error('Error resolving alert:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'text-error';
      case 'high': return 'text-warning';
      case 'medium': return 'text-info';
      default: return 'text-success';
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alert Details
            </h3>
            <p className="text-sm text-base-content/70 mt-1">
              Transaction Reference: {alert.transactionReference}
            </p>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Alert Type & Risk Level */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="text-xs font-semibold text-base-content/70">Alert Type</h4>
              <p className="text-lg font-bold">
                {alert.alertType.replace(/_/g, ' ').toUpperCase()}
              </p>
            </div>
          </div>
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="text-xs font-semibold text-base-content/70">Risk Level</h4>
              <p className={`text-lg font-bold ${getRiskColor(alert.riskLevel)}`}>
                {alert.riskLevel.toUpperCase()}
              </p>
              <div className="text-xs text-base-content/70">
                Score: {alert.riskScore}/100
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="card bg-base-200 mb-6">
          <div className="card-body p-4">
            <h4 className="font-semibold mb-3">Transaction Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-base-content/70">Amount</p>
                <p className="text-lg font-mono">
                  {alert.currency} {parseFloat(alert.amount).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-base-content/70">Detection Time</p>
                <p className="text-sm">
                  {new Date(alert.detectionTimestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pattern Details */}
        {alert.patternDetails && (
          <div className="card bg-base-200 mb-6">
            <div className="card-body p-4">
              <h4 className="font-semibold mb-3">Pattern Analysis</h4>
              <p className="text-sm">
                {alert.patternDetails.message || 'No additional details available'}
              </p>
            </div>
          </div>
        )}

        {/* STR Requirement */}
        {alert.requiresStr && (
          <div className="alert alert-warning mb-6">
            <FileText className="h-5 w-5" />
            <span className="text-sm">
              This alert requires Suspicious Transaction Report (STR) submission to FIC
            </span>
          </div>
        )}

        {/* Investigation Notes */}
        <div className="form-control mb-6">
          <label className="label">
            <span className="label-text font-semibold">Investigation Notes</span>
          </label>
          <textarea
            className="textarea textarea-bordered h-24"
            placeholder="Add your investigation findings..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button 
            onClick={() => handleAction('clear')} 
            className="btn btn-success"
            disabled={loading}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Clear Alert
          </button>
          <button 
            onClick={() => handleAction('escalate')} 
            className="btn btn-warning"
            disabled={loading}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Escalate
          </button>
          {alert.requiresStr && (
            <button 
              onClick={() => handleAction('create_str')} 
              className="btn btn-error"
              disabled={loading}
            >
              <FileText className="h-4 w-4 mr-2" />
              Create STR
            </button>
          )}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}
