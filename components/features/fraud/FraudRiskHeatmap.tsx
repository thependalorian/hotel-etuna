/**
 * Fraud Risk Heatmap Component
 * 
 * Purpose: Visualize fraud risk distribution
 * Functionality: Show risk levels across different fraud types
 * Location: components/features/fraud/FraudRiskHeatmap.tsx
 */

'use client';

import { useState, useEffect } from 'react';
import { securityLogger } from '@/lib/utils/security-logger.client';

interface RiskData {
  fraudType: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  count: number;
  averageScore: number;
}

interface FraudRiskHeatmapProps {
  tenantId: string;
}

export function FraudRiskHeatmap({ tenantId }: FraudRiskHeatmapProps) {
  const [riskData, setRiskData] = useState<RiskData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRiskData() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/fraud/statistics?periodType=monthly`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch fraud statistics');
        }

        const payload = await response.json();
        if (!payload.success || !payload.data) {
          throw new Error(payload.error || 'Invalid fraud statistics response');
        }

        const { topFraudTypes, averageRiskScore } = payload.data as {
          topFraudTypes: { type: string; count: number }[];
          averageRiskScore: number;
        };

        const maxCount = Math.max(
          1,
          ...topFraudTypes.map((item) => item.count)
        );

        const mapped: RiskData[] = topFraudTypes.map((item) => {
          const ratio = item.count / maxCount;
          let riskLevel: RiskData['riskLevel'] = 'low';
          if (ratio >= 0.75 || averageRiskScore >= 85) riskLevel = 'critical';
          else if (ratio >= 0.5 || averageRiskScore >= 70) riskLevel = 'high';
          else if (ratio >= 0.25 || averageRiskScore >= 50) riskLevel = 'medium';

          return {
            fraudType: item.type,
            riskLevel,
            count: item.count,
            averageScore: averageRiskScore,
          };
        });

        setRiskData(mapped);
      } catch (error) {
        securityLogger.error('Error fetching risk data:', error);
        setRiskData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRiskData();
  }, [tenantId]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-error';
      case 'high':
        return 'bg-warning';
      case 'medium':
        return 'bg-info';
      case 'low':
        return 'bg-success';
      default:
        return 'bg-base-300';
    }
  };

  const getRiskTextColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-error';
      case 'high':
        return 'text-warning';
      case 'medium':
        return 'text-info';
      case 'low':
        return 'text-success';
      default:
        return 'text-base-content';
    }
  };

  return (
    <div className="card bg-base-100">
      <div className="card-body">
        <h3 className="card-title text-lg">Risk Distribution by Type</h3>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {riskData.map((data, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{data.fraudType}</span>
                    <span className={`badge badge-sm ${getRiskColor(data.riskLevel)} text-white`}>
                      {data.riskLevel}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-base-content/70">{data.count} cases</span>
                    <span className={`font-bold ${getRiskTextColor(data.riskLevel)}`}>
                      {data.averageScore.toFixed(1)}
                    </span>
                  </div>
                </div>
                
                {/* Risk Score Bar */}
                <div className="relative h-6 bg-base-200 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 ${getRiskColor(data.riskLevel)} rounded-full transition-all duration-500`}
                    style={{ width: `${data.averageScore}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-3">
                    <span className="text-xs font-medium text-base-content/80">
                      {data.averageScore.toFixed(1)} Risk Score
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="pt-4 border-t border-base-300">
              <p className="text-sm font-medium mb-3">Risk Levels</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-success"></div>
                  <span>Low (0-24)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-info"></div>
                  <span>Medium (25-49)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-warning"></div>
                  <span>High (50-74)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-error"></div>
                  <span>Critical (75-100)</span>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="alert alert-info mt-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span className="text-sm">
                Based on NPS Fraud Trend Report (2013-2022): Phone scams and SIM swap attacks 
                show highest risk scores due to their high financial impact.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
