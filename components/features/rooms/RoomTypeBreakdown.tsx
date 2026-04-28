/**
 * Room Type Breakdown Component
 * 
 * Purpose: Display breakdown of rooms by type
 * Location: /components/features/rooms/RoomTypeBreakdown.tsx
 * 
 * Features:
 * - Grid of room types with counts
 * - Type icons
 * - Hover effects
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-200
 * - Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
 * 
 * Accessibility:
 * - Semantic HTML structure
 * 
 * @param {Array} typeBreakdown - Array of type breakdown objects
 * @param {string} typeBreakdown[].type - Room type name
 * @param {number} typeBreakdown[].count - Number of rooms of this type
 * 
 * @module RoomTypeBreakdown
 */

import { BedDouble, Home, Hotel, Star, Users } from 'lucide-react';

interface TypeBreakdown {
  type: string;
  count: number;
}

interface RoomTypeBreakdownProps {
  typeBreakdown: TypeBreakdown[];
}

const roomTypeIcons = {
  standard: Hotel,
  deluxe: Star,
  suite: BedDouble,
  family: Users,
} as const;

function RoomTypeGlyph({ type }: { type: string }) {
  const Icon = roomTypeIcons[type.toLowerCase() as keyof typeof roomTypeIcons] ?? Home;
  return <Icon className="w-6 h-6 mx-auto mb-2 text-primary" aria-hidden />;
}

export default function RoomTypeBreakdown({ typeBreakdown }: RoomTypeBreakdownProps) {
  if (typeBreakdown.length === 0) return null;

  return (
    <div className="card bg-base-100 shadow-lg card-hover animate-slide-up">
      <div className="card-body">
        <h3 className="card-title text-xl font-display mb-4">Room Type Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {typeBreakdown.map((type, index) => (
            <div
              key={type.type}
              className="text-center p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <RoomTypeGlyph type={type.type} />
              <div className="font-semibold text-base-content">{type.type}</div>
              <div className="text-sm text-base-content/60">{type.count} rooms</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
