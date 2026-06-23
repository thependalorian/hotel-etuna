/**
 * Fraud Alerts Table Component
 * 
 * Purpose: Display and manage active fraud alerts
 * Functionality: Show alert details, status, and actions
 * Location: components/features/fraud/FraudAlertsTable.tsx
 */

'use client';

import { useState, useEffect } from 'react';
import { securityLogger } from '@/lib/utils/security-logger.client';

interface FraudAlert {
  id: string;
  alertType: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  status: string;
  priority: number;
  createdAt: string;
  transactionId?: string;
  guestId?: string;
}

interface FraudAlertsTableProps {
  tenantId: string;
}

export function FraudAlertsTable({ tenantId }: FraudAlertsTableProps) {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'critical'>('open');

  // Fetch alerts
  useEffect(() => {
    async function fetchAlerts() {
      try {
        setLoading(true);

        let url = `/api/fraud/alerts?tenantId=${tenantId}&limit=10`;
        
        if (filter === 'open') {
          url += '&status=open';
        } else if (filter === 'critical') {
          url += '&severity=critical';
        }

        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch alerts');
        }

        const data = await response.json();
        
        if (data.success) {
          setAlerts(data.data);
        }
      } catch (error) {
        securityLogger.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();

    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchAlerts, 15000);

    return () => clearInterval(interval);
  }, [tenantId, filter]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'badge-error';
      case 'warning':
        return 'badge-warning';
      case 'info':
        return 'badge-info';
      default:
        return 'badge-ghost';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return 'badge-error';
      case 'investigating':
        return 'badge-warning';
      case 'resolved':
        return 'badge-success';
      default:
        return 'badge-ghost';
    }
  };

  const formatDate = (dateString: string) => {
    // en-NA locale for consistency with the rest of the app (see lib/formatters.ts)
    return new Date(dateString).toLocaleString('en-NA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="card bg-base-100">
      <div className="card-body">
        <div className="flex items-center justify-between mb-6">
          <h2 className="card-title text-xl">Active Fraud Alerts</h2>

          {/* Filter Tabs */}
          <div className="tabs tabs-boxed">
            <button
              className={`tab tab-sm ${filter === 'all' ? 'tab-active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`tab tab-sm ${filter === 'open' ? 'tab-active' : ''}`}
              onClick={() => setFilter('open')}
            >
              Open
            </button>
            <button
              className={`tab tab-sm ${filter === 'critical' ? 'tab-active' : ''}`}
              onClick={() => setFilter('critical')}
            >
              Critical
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-base-content/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium">No fraud alerts</h3>
            <p className="mt-1 text-sm text-base-content/70">
              All transactions are processing normally
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Alert</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover">
                    <td>
                      <div>
                        <div className="font-medium">{alert.title}</div>
                        <div className="text-sm text-base-content/70 truncate max-w-xs">
                          {alert.description}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-sm capitalize">
                        {alert.alertType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-sm ${getSeverityBadge(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-sm ${getStatusBadge(alert.status)}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {[...Array(10)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 h-4 rounded ${
                              i < alert.priority ? 'bg-warning' : 'bg-base-300'
                            }`}
                          ></div>
                        ))}
                      </div>
                    </td>
                    <td className="text-sm">{formatDate(alert.createdAt)}</td>
                    <td>
                      <button className="btn btn-xs btn-ghost">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {alerts.length > 0 && (
          <div className="card-actions justify-end mt-4">
            <button className="btn btn-sm btn-ghost">View All Alerts</button>
          </div>
        )}
      </div>
    </div>
  );
}
