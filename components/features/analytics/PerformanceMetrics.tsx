/**
 * Performance Metrics Component
 * 
 * Purpose: Display key performance metrics
 * Location: /components/features/analytics/PerformanceMetrics.tsx
 * 
 * Features:
 * - Booking conversion rate
 * - Revenue per available room
 * - Customer lifetime value
 * - Grid layout (3 columns)
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-200
 * - Grid: grid-cols-1 md:grid-cols-3
 * 
 * Accessibility:
 * - Semantic HTML structure
 * - Proper heading hierarchy (h2)
 * 
 * @param {Object} performance - Performance metrics object
 * 
 * @module PerformanceMetrics
 */

interface PerformanceMetricsProps {
  performance: {
    bookingConversionRate: number;
    revenuePerAvailableRoom: number;
    customerLifetimeValue: number;
  };
}

export default function PerformanceMetrics({ performance }: PerformanceMetricsProps) {
  return (
    <div className="card bg-base-100 card-hover animate-slide-up" style={{ animationDelay: '200ms' }}>
      <div className="card-header">
        <h2 className="card-title text-xl font-display">Performance Metrics</h2>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-base-200 rounded-etuna-input">
            <div className="text-4xl font-bold text-primary mb-2">
              {performance.bookingConversionRate.toFixed(1)}%
            </div>
            <div className="text-sm font-medium text-base-content/70">Booking Conversion Rate</div>
          </div>
          
          <div className="text-center p-6 bg-base-200 rounded-etuna-input">
            <div className="text-4xl font-bold text-secondary mb-2">
              N${performance.revenuePerAvailableRoom.toFixed(2)}
            </div>
            <div className="text-sm font-medium text-base-content/70">Revenue Per Available Room</div>
          </div>
          
          <div className="text-center p-6 bg-base-200 rounded-etuna-input">
            <div className="text-4xl font-bold text-accent mb-2">
              N${performance.customerLifetimeValue.toLocaleString()}
            </div>
            <div className="text-sm font-medium text-base-content/70">Customer Lifetime Value</div>
          </div>
        </div>
      </div>
    </div>
  );
}
