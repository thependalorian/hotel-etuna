/**
 * Fraud Trend Chart Component
 * 
 * Purpose: Visualize fraud trends over time
 * Functionality: Show transaction volume and fraud rate trends
 * Location: components/features/fraud/FraudTrendChart.tsx
 */

'use client';

import { useState, useEffect } from 'react';
import { securityLogger } from '@/lib/utils/security-logger.client';

interface FraudTrendChartProps {
  tenantId: string;
  periodType: 'daily' | 'weekly' | 'monthly';
}

interface TrendData {
  date: string;
  totalTransactions: number;
  flaggedTransactions: number;
  declinedTransactions: number;
}

export function FraudTrendChart({ tenantId, periodType }: FraudTrendChartProps) {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrendData() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/fraud/statistics?tenantId=${encodeURIComponent(tenantId)}&periodType=${periodType}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch fraud statistics: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success || !result.data?.trendData) {
          throw new Error('Invalid fraud statistics response');
        }

        setTrendData(result.data.trendData);
      } catch (error) {
        securityLogger.error('Error fetching trend data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrendData();
  }, [tenantId, periodType]);

  const maxValue = Math.max(...trendData.map((d) => d.totalTransactions));

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title text-lg">Fraud Trends</h3>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {/* Chart Legend */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span>Total</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning"></div>
                <span>Flagged</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-error"></div>
                <span>Declined</span>
              </div>
            </div>

            {/* Simple Bar Chart */}
            <div className="space-y-3">
              {trendData.map((data, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{data.date}</span>
                    <span className="text-base-content/70">{data.totalTransactions} txns</span>
                  </div>
                  
                  <div className="relative h-8 bg-base-200 rounded-full overflow-hidden">
                    {/* Total Transactions Bar */}
                    <div
                      className="absolute inset-y-0 left-0 bg-primary/20 rounded-full"
                      style={{ width: `${(data.totalTransactions / maxValue) * 100}%` }}
                    />
                    
                    {/* Flagged Transactions Bar */}
                    <div
                      className="absolute inset-y-0 left-0 bg-warning rounded-full"
                      style={{ width: `${(data.flaggedTransactions / maxValue) * 100}%` }}
                    />
                    
                    {/* Declined Transactions Bar */}
                    <div
                      className="absolute inset-y-0 left-0 bg-error rounded-full"
                      style={{ width: `${(data.declinedTransactions / maxValue) * 100}%` }}
                    />
                    
                    {/* Values */}
                    <div className="absolute inset-0 flex items-center px-3 text-xs font-medium">
                      <span className="text-base-content/80">{data.declinedTransactions}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-base-300">
              <div className="text-center">
                <p className="text-xs text-base-content/70">Avg Total</p>
                <p className="text-lg font-bold">
                  {Math.round(
                    trendData.reduce((sum, d) => sum + d.totalTransactions, 0) / trendData.length
                  )}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-base-content/70">Avg Flagged</p>
                <p className="text-lg font-bold text-warning">
                  {Math.round(
                    trendData.reduce((sum, d) => sum + d.flaggedTransactions, 0) / trendData.length
                  )}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-base-content/70">Avg Declined</p>
                <p className="text-lg font-bold text-error">
                  {Math.round(
                    trendData.reduce((sum, d) => sum + d.declinedTransactions, 0) / trendData.length
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
