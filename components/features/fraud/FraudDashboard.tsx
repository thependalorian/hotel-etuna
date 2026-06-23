/**
 * Fraud Detection Dashboard
 * 
 * Purpose: Main dashboard for fraud detection and monitoring
 * Functionality:
 * - Display real-time fraud statistics
 * - Show active fraud alerts
 * - Visualize fraud trends
 * - Monitor detection effectiveness
 * 
 * Location: components/features/fraud/FraudDashboard.tsx
 * 
 * @implements Rule 1: Uses DaisyUI components
 * @implements Rule 2: Modular component design
 * @implements Rule 3: Documented purpose and location
 * @implements Rule 20: Consistent styling with existing components
 */

'use client';

import { useState, useEffect } from 'react';
import { FraudStatisticsCard } from './FraudStatisticsCard';
import { FraudAlertsTable } from './FraudAlertsTable';
import { FraudTrendChart } from './FraudTrendChart';
import { FraudRiskHeatmap } from './FraudRiskHeatmap';
import { FraudRuleEditor } from './FraudRuleEditor';
import { securityLogger } from '@/lib/utils/security-logger.client';

// Types
interface FraudStatistics {
  totalTransactions: number;
  flaggedTransactions: number;
  declinedTransactions: number;
  fraudRate: number;
  averageRiskScore: number;
  topFraudTypes: { type: string; count: number }[];
}

interface FraudDashboardProps {
  tenantId: string;
}

export function FraudDashboard({ tenantId }: FraudDashboardProps) {
  const [statistics, setStatistics] = useState<FraudStatistics | null>(null);
  const [periodType, setPeriodType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch fraud statistics
  useEffect(() => {
    async function fetchStatistics() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/fraud/statistics?tenantId=${tenantId}&periodType=${periodType}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch fraud statistics');
        }

        const data = await response.json();
        
        if (data.success) {
          setStatistics(data.data);
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (err) {
        securityLogger.error('Error fetching fraud statistics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    }

    fetchStatistics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatistics, 30000);

    return () => clearInterval(interval);
  }, [tenantId, periodType]);

  if (loading && !statistics) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fraud Detection Dashboard</h1>
          <p className="text-base-content/70 mt-1">
            Real-time fraud monitoring and prevention
          </p>
        </div>

        {/* Period Selector */}
        <div className="tabs tabs-boxed">
          <button
            className={`tab ${periodType === 'daily' ? 'tab-active' : ''}`}
            onClick={() => setPeriodType('daily')}
          >
            Daily
          </button>
          <button
            className={`tab ${periodType === 'weekly' ? 'tab-active' : ''}`}
            onClick={() => setPeriodType('weekly')}
          >
            Weekly
          </button>
          <button
            className={`tab ${periodType === 'monthly' ? 'tab-active' : ''}`}
            onClick={() => setPeriodType('monthly')}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <FraudStatisticsCard
          statistics={statistics}
          periodType={periodType}
        />
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FraudTrendChart tenantId={tenantId} periodType={periodType} />
        <FraudRiskHeatmap tenantId={tenantId} />
      </div>

      {/* Tenant rule configuration */}
      <FraudRuleEditor tenantId={tenantId} />

      {/* Active Alerts */}
      <FraudAlertsTable tenantId={tenantId} />

      {/* Status Indicator */}
      <div className="flex items-center justify-between p-4 bg-base-200 rounded-etuna-input">
        <div className="flex items-center gap-3">
          <div className="indicator">
            <span className="indicator-item badge badge-success badge-xs"></span>
            <div className="w-3 h-3 bg-success rounded-full"></div>
          </div>
          <span className="text-sm font-medium">
            Fraud Detection System Active
          </span>
        </div>
        
        <span className="text-sm text-base-content/70">
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
