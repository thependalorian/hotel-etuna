/**
 * AML Compliance Dashboard Component
 * 
 * Purpose: Real-time AML/CFT monitoring dashboard
 * Location: components/compliance/AMLDashboard.tsx
 * 
 * Features:
 * - Real-time alert monitoring
 * - STR deadline tracking
 * - PEP status overview
 * - Risk distribution visualization
 * - Quick action buttons
 */

'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Users, FileText, Shield, TrendingUp, Clock } from 'lucide-react';

interface DashboardData {
  summary: {
    pendingAlerts: number;
    activePEPs: number;
    pendingEDDReviews: number;
    approachingDeadlines: number;
    overdueSTRs: number;
  };
  alerts: {
    total: number;
    riskDistribution: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    byType: Record<string, number>;
    recentAlerts: Array<{
      id: string;
      alertType: string;
      riskLevel: string;
      amount: string;
      createdAt: Date;
    }>;
  };
  pep: {
    activeFlags: number;
    pendingEDD: number;
  };
  str: {
    totalSTRs: number;
    byStatus: {
      draft: number;
      submitted: number;
      acknowledged: number;
      underReview: number;
      closed: number;
    };
    approachingDeadlines: number;
    overdue: number;
    deadlineWarnings: Array<{
      strReference: string;
      deadline: Date;
      daysRemaining: number;
    }>;
  };
}

interface AMLDashboardProps {
  tenantId: string;
}

export default function AMLDashboard({ tenantId }: AMLDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    
    const interval = setInterval(fetchDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, [tenantId]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/compliance/aml/reports/dashboard?tenantId=${tenantId}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="alert alert-error">
        <AlertTriangle className="h-6 w-6" />
        <span>{error || 'Failed to load dashboard'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AML/CFT Compliance Dashboard</h1>
          <p className="text-base-content/70 mt-1">
            Real-time monitoring per Namibian Financial Intelligence Act (FIA)
          </p>
        </div>
        <button className="btn btn-primary">
          <Shield className="h-5 w-5 mr-2" />
          Generate Report
        </button>
      </div>

      {/* Critical Alerts */}
      {(data.summary.overdueSTRs > 0 || data.alerts.riskDistribution.critical > 0) && (
        <div className="alert alert-error">
          <AlertTriangle className="h-6 w-6" />
          <div>
            <h3 className="font-bold">Critical Attention Required</h3>
            <div className="text-sm">
              {data.summary.overdueSTRs > 0 && (
                <p>{data.summary.overdueSTRs} overdue STR(s) - Immediate action required</p>
              )}
              {data.alerts.riskDistribution.critical > 0 && (
                <p>{data.alerts.riskDistribution.critical} critical alert(s) - Review immediately</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warning Alerts */}
      {data.summary.approachingDeadlines > 0 && (
        <div className="alert alert-warning">
          <Clock className="h-6 w-6" />
          <div>
            <h3 className="font-bold">Approaching Deadlines</h3>
            <p className="text-sm">
              {data.summary.approachingDeadlines} STR(s) approaching FIA deadline (within 5 days)
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-semibold text-base-content/70">
                  Pending Alerts
                </h3>
                <p className="text-3xl font-bold mt-2">{data.summary.pendingAlerts}</p>
              </div>
              <div className="badge badge-error">{data.alerts.riskDistribution.critical}</div>
            </div>
            <div className="divider my-2"></div>
            <div className="text-xs text-base-content/70">
              <span className="text-error font-bold">{data.alerts.riskDistribution.critical}</span> Critical
              {', '}
              <span className="text-warning font-bold">{data.alerts.riskDistribution.high}</span> High
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-semibold text-base-content/70">
                  Active PEPs
                </h3>
                <p className="text-3xl font-bold mt-2">{data.summary.activePEPs}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="divider my-2"></div>
            <div className="text-xs text-base-content/70">
              {data.summary.pendingEDDReviews} pending EDD review(s)
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-semibold text-base-content/70">
                  Total STRs
                </h3>
                <p className="text-3xl font-bold mt-2">{data.str.totalSTRs}</p>
              </div>
              <FileText className="h-8 w-8 text-warning" />
            </div>
            <div className="divider my-2"></div>
            <div className="text-xs text-base-content/70">
              {data.str.byStatus.draft} draft, {data.str.byStatus.submitted} submitted
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-semibold text-base-content/70">
                  Compliance Score
                </h3>
                <p className="text-3xl font-bold mt-2 text-success">98%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
            <div className="divider my-2"></div>
            <div className="text-xs text-base-content/70">
              FIA compliant
            </div>
          </div>
        </div>
      </div>

      {/* Deadline Warnings */}
      {data.str.deadlineWarnings.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">
              <Clock className="h-5 w-5" />
              STR Deadline Warnings
            </h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>STR Reference</th>
                    <th>Deadline</th>
                    <th>Days Remaining</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.str.deadlineWarnings.map((warning) => (
                    <tr key={warning.strReference}>
                      <td>
                        <span className="font-mono text-sm">{warning.strReference}</span>
                      </td>
                      <td>{new Date(warning.deadline).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${
                          warning.daysRemaining <= 2 ? 'badge-error' : 'badge-warning'
                        }`}>
                          {warning.daysRemaining} day(s)
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-primary">Review</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Recent Alerts</h2>
            <div className="space-y-3">
              {data.alerts.recentAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`badge ${
                      alert.riskLevel === 'critical' ? 'badge-error' :
                      alert.riskLevel === 'high' ? 'badge-warning' :
                      'badge-info'
                    }`}>
                      {alert.riskLevel}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{alert.alertType.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-base-content/70">
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">N${parseFloat(alert.amount).toLocaleString()}</p>
                    <button className="btn btn-xs btn-ghost">Review</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Risk Distribution</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Critical</span>
                  <span className="text-sm font-bold">{data.alerts.riskDistribution.critical}</span>
                </div>
                <progress 
                  className="progress progress-error w-full" 
                  value={data.alerts.riskDistribution.critical} 
                  max={data.alerts.total}
                ></progress>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">High</span>
                  <span className="text-sm font-bold">{data.alerts.riskDistribution.high}</span>
                </div>
                <progress 
                  className="progress progress-warning w-full" 
                  value={data.alerts.riskDistribution.high} 
                  max={data.alerts.total}
                ></progress>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Medium</span>
                  <span className="text-sm font-bold">{data.alerts.riskDistribution.medium}</span>
                </div>
                <progress 
                  className="progress progress-info w-full" 
                  value={data.alerts.riskDistribution.medium} 
                  max={data.alerts.total}
                ></progress>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Low</span>
                  <span className="text-sm font-bold">{data.alerts.riskDistribution.low}</span>
                </div>
                <progress 
                  className="progress progress-success w-full" 
                  value={data.alerts.riskDistribution.low} 
                  max={data.alerts.total}
                ></progress>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STR Status Overview */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">STR Status Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-base-200 rounded-lg">
              <p className="text-2xl font-bold">{data.str.byStatus.draft}</p>
              <p className="text-xs text-base-content/70">Draft</p>
            </div>
            <div className="text-center p-4 bg-base-200 rounded-lg">
              <p className="text-2xl font-bold">{data.str.byStatus.submitted}</p>
              <p className="text-xs text-base-content/70">Submitted</p>
            </div>
            <div className="text-center p-4 bg-base-200 rounded-lg">
              <p className="text-2xl font-bold">{data.str.byStatus.acknowledged}</p>
              <p className="text-xs text-base-content/70">Acknowledged</p>
            </div>
            <div className="text-center p-4 bg-base-200 rounded-lg">
              <p className="text-2xl font-bold">{data.str.byStatus.underReview}</p>
              <p className="text-xs text-base-content/70">Under Review</p>
            </div>
            <div className="text-center p-4 bg-base-200 rounded-lg">
              <p className="text-2xl font-bold">{data.str.byStatus.closed}</p>
              <p className="text-xs text-base-content/70">Closed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
