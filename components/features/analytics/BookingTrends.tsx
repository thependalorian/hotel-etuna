/**
 * Booking Trends Component
 * 
 * Purpose: Display booking trends over time
 * Location: /components/features/analytics/BookingTrends.tsx
 * 
 * Features:
 * - List of booking trends by date
 * - Booking count and revenue per date
 * - Hover effects
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-200
 * 
 * Accessibility:
 * - Semantic HTML structure
 * - Proper heading hierarchy (h2)
 * 
 * @param {Array} bookingTrends - Array of booking trend objects
 * 
 * @module BookingTrends
 */

interface BookingTrend {
  date: string;
  bookings: number;
  revenue: number;
}

interface BookingTrendsProps {
  bookingTrends: BookingTrend[];
}

export default function BookingTrends({ bookingTrends }: BookingTrendsProps) {
  return (
    <div className="card bg-base-100 card-hover animate-slide-up" style={{ animationDelay: '100ms' }}>
      <div className="card-header">
        <h2 className="card-title text-xl font-display">Booking Trends</h2>
      </div>
      <div className="card-body">
        <div className="space-y-4">
          {bookingTrends.slice(0, 7).map((trend, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-3 bg-base-200 rounded-etuna-input hover:bg-base-300 transition-colors duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div>
                <p className="font-medium text-base-content">{trend.date}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-base-content">{trend.bookings} bookings</p>
                <p className="text-sm text-base-content/60">
                  N${trend.revenue.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
