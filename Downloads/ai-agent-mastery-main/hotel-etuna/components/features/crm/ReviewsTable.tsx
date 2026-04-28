/**
 * Reviews Table Component
 * 
 * Purpose: Display guest reviews in table format
 * Location: /components/features/crm/ReviewsTable.tsx
 * 
 * Features:
 * - Table with guest, rating, review, date
 * - Star rating display
 * - Property filter dropdown
 * - Staggered row animations
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Table hover effects
 * 
 * Accessibility:
 * - Semantic HTML table structure
 * - Proper table headers
 * 
 * @param {Array} reviews - Array of review objects
 * @param {Array} properties - Array of property objects
 * @param {string} selectedPropertyId - Currently selected property ID
 * @param {Function} onPropertyChange - Property change handler
 * 
 * @module ReviewsTable
 */

import { Star } from 'lucide-react';

interface GuestReview {
  id: string;
  guest_id: string;
  property_id: string;
  rating: number;
  review_text?: string;
  created_at: string;
  is_public?: boolean;
  guest_name?: string;
  property_name?: string;
}

interface Property {
  id: string;
  name: string;
}

interface ReviewsTableProps {
  reviews: GuestReview[];
  properties: Property[];
  selectedPropertyId: string | null;
  onPropertyChange: (propertyId: string) => void;
  onTogglePublic?: (reviewId: string, isPublic: boolean) => Promise<void> | void;
  isTogglingReviewId?: string | null;
  showPublicToggle?: boolean;
}

export default function ReviewsTable({
  reviews,
  properties,
  selectedPropertyId,
  onPropertyChange,
  onTogglePublic,
  isTogglingReviewId,
  showPublicToggle = false,
}: ReviewsTableProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="card-title text-xl font-display">Guest Reviews</h3>
        <select
          className="select select-bordered select-sm min-h-[44px]"
          value={selectedPropertyId || ''}
          onChange={(e) => onPropertyChange(e.target.value)}
        >
          {properties.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-base-content/70">No reviews found for the selected property.</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto scrollbar-thin -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="table w-full min-w-[640px] sm:min-w-0">
            <thead>
              <tr>
                <th className="text-base-content/70">Guest</th>
                <th className="text-base-content/70">Property</th>
                <th className="text-base-content/70">Rating</th>
                <th className="text-base-content/70">Review</th>
                <th className="text-base-content/70">Date</th>
                {showPublicToggle && <th className="text-base-content/70">Public</th>}
              </tr>
            </thead>
            <tbody>
              {reviews.map((review, index) => (
                <tr 
                  key={review.id}
                  className="hover:bg-base-200 transition-colors duration-200 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="font-medium">{review.guest_name ?? `${review.guest_id.slice(0, 8)}...`}</td>
                  <td className="text-base-content/70">{review.property_name ?? review.property_id.slice(0, 8)}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={i < review.rating ? 'h-4 w-4 fill-current text-warning' : 'h-4 w-4 text-base-content/20'}
                          aria-hidden
                        />
                      ))}
                    </div>
                  </td>
                  <td className="text-base-content/70 max-w-xs truncate">
                    {review.review_text?.substring(0, 50) || 'No review text'}...
                  </td>
                  <td className="text-base-content/60 text-sm">
                    {new Date(review.created_at).toLocaleDateString()}
                  </td>
                  {showPublicToggle && (
                    <td>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={Boolean(review.is_public)}
                        disabled={!onTogglePublic || isTogglingReviewId === review.id}
                        onChange={(event) => {
                          if (onTogglePublic) {
                            void onTogglePublic(review.id, event.target.checked);
                          }
                        }}
                        aria-label={`Set review ${review.id} public visibility`}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
