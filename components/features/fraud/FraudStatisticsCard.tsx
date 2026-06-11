/**
 * Fraud Statistics Card Component
 * 
 * Purpose: Display key fraud detection metrics in card format
 * Functionality: Show transaction counts, fraud rates, and risk scores
 * Location: components/features/fraud/FraudStatisticsCard.tsx
 */

'use client';

import { formatNumber } from '@/lib/formatters';

interface FraudStatistics {
  totalTransactions: number;
  flaggedTransactions: number;
  declinedTransactions: number;
  fraudRate: number;
  averageRiskScore: number;
  topFraudTypes: { type: string; count: number }[];
}

interface FraudStatisticsCardProps {
  statistics: FraudStatistics;
  periodType: 'daily' | 'weekly' | 'monthly';
}

export function FraudStatisticsCard({ statistics, periodType }: FraudStatisticsCardProps) {
  const getRiskLevelColor = (score: number) => {
    if (score >= 75) return 'badge-error';
    if (score >= 50) return 'badge-warning';
    if (score >= 25) return 'badge-info';
    return 'badge-success';
  };

  const getFraudRateColor = (rate: number) => {
    if (rate >= 5) return 'text-error';
    if (rate >= 2) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Transactions */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/70">Total Transactions</p>
              <h2 className="text-3xl font-bold mt-2">
                {formatNumber(statistics.totalTransactions)}
              </h2>
              <p className="text-xs text-base-content/60 mt-1 capitalize">
                {periodType} period
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-primary"
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
            </div>
          </div>
        </div>
      </div>

      {/* Flagged Transactions */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/70">Flagged</p>
              <h2 className="text-3xl font-bold mt-2 text-warning">
                {formatNumber(statistics.flaggedTransactions)}
              </h2>
              <p className="text-xs text-base-content/60 mt-1">
                {statistics.totalTransactions > 0
                  ? `${((statistics.flaggedTransactions / statistics.totalTransactions) * 100).toFixed(1)}%`
                  : '0%'}{' '}
                of total
              </p>
            </div>
            <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-warning"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Declined Transactions */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-content/70">Declined</p>
              <h2 className="text-3xl font-bold mt-2 text-error">
                {formatNumber(statistics.declinedTransactions)}
              </h2>
              <p className="text-xs text-base-content/60 mt-1">
                {statistics.totalTransactions > 0
                  ? `${((statistics.declinedTransactions / statistics.totalTransactions) * 100).toFixed(1)}%`
                  : '0%'}{' '}
                of total
              </p>
            </div>
            <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-error"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Fraud Rate & Risk Score */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-base-content/70">Fraud Rate</p>
              <h2 className={`text-3xl font-bold mt-2 ${getFraudRateColor(statistics.fraudRate)}`}>
                {statistics.fraudRate.toFixed(2)}%
              </h2>
            </div>
            <div className="divider my-0"></div>
            <div>
              <p className="text-sm text-base-content/70">Avg Risk Score</p>
              <div className="flex items-center gap-2 mt-2">
                <h2 className="text-2xl font-bold">{statistics.averageRiskScore.toFixed(1)}</h2>
                <span className={`badge ${getRiskLevelColor(statistics.averageRiskScore)}`}>
                  {statistics.averageRiskScore >= 75
                    ? 'Critical'
                    : statistics.averageRiskScore >= 50
                    ? 'High'
                    : statistics.averageRiskScore >= 25
                    ? 'Medium'
                    : 'Low'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Fraud Types */}
      {statistics.topFraudTypes.length > 0 && (
        <div className="card bg-base-100 shadow-xl col-span-full lg:col-span-2">
          <div className="card-body">
            <h3 className="card-title text-lg">Top Fraud Types</h3>
            <div className="space-y-3 mt-4">
              {statistics.topFraudTypes.map((fraudType, index) => (
                <div key={fraudType.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="badge badge-ghost">{index + 1}</div>
                    <span className="font-medium capitalize">
                      {fraudType.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-base-content/70">
                      {formatNumber(fraudType.count)} incidents
                    </span>
                    <div className="w-32 h-2 bg-base-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${Math.min(
                            (fraudType.count / (statistics.declinedTransactions || 1)) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
