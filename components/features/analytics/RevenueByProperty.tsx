/**
 * Revenue by Property Component
 * 
 * Purpose: Display revenue breakdown by property
 * Location: /components/features/analytics/RevenueByProperty.tsx
 * 
 * Features:
 * - List of properties with revenue
 * - Percentage of total revenue
 * - Hover effects
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-200
 * 
 * Accessibility:
 * - Semantic HTML structure
 * - Proper heading hierarchy (h2)
 * 
 * @param {Array} revenueByProperty - Array of property revenue objects
 * 
 * @module RevenueByProperty
 */

interface PropertyRevenue {
  propertyId: string;
  propertyName: string;
  revenue: number;
  percentage: number;
}

interface RevenueByPropertyProps {
  revenueByProperty: PropertyRevenue[];
}

export default function RevenueByProperty({ revenueByProperty }: RevenueByPropertyProps) {
  return (
    <div className="card bg-base-100 shadow-lg card-hover animate-slide-up">
      <div className="card-header">
        <h2 className="card-title text-xl font-display">Revenue by Property</h2>
      </div>
      <div className="card-body">
        <div className="space-y-4">
          {revenueByProperty.map((property, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div>
                <p className="font-medium text-base-content">{property.propertyName}</p>
                <p className="text-sm text-base-content/60">
                  {property.percentage}% of total revenue
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-base-content">N${property.revenue.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
