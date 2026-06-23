/**
 * Revenue Breakdown Component
 *
 * Purpose: Display revenue breakdown for Hotel Etuna (single property).
 * Location: /components/features/analytics/RevenueByProperty.tsx
 */

interface RevenueCategory {
  propertyId: string;
  propertyName: string;
  revenue: number;
  percentage: number;
}

interface RevenueByPropertyProps {
  revenueByProperty: RevenueCategory[];
}

export default function RevenueByProperty({ revenueByProperty }: RevenueByPropertyProps) {
  return (
    <div className="dashboard-card p-6 animate-slide-up">
      <h2 className="font-display text-xl font-bold text-ink-900 mb-4">Revenue Breakdown</h2>
      <div className="space-y-3">
        {revenueByProperty.map((item, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between p-3 bg-nude-50 rounded-etuna-input"
          >
            <div>
              <p className="font-medium text-ink-900">{item.propertyName}</p>
              <p className="text-sm text-ink-600">
                {item.percentage.toFixed(1)}% of total
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-ink-900">N${item.revenue.toLocaleString()}</p>
            </div>
          </div>
        ))}
        {revenueByProperty.length === 0 && (
          <p className="text-ink-600 text-center py-4">No revenue data available yet.</p>
        )}
      </div>
    </div>
  );
}
