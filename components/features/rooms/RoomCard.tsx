/**
 * Room Card Component
 * 
 * Purpose: Display individual room information in card format
 * Location: /components/features/rooms/RoomCard.tsx
 * 
 * Features:
 * - Room number and type
 * - Availability badge
 * - Property name
 * - Capacity and bed type
 * - Amenities list
 * - Booking count
 * - Action buttons (View, Edit)
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Card shadows: shadow-lg with hover:shadow-xl
 * - Button sizes: min-h-[36px] for small buttons
 * 
 * Accessibility:
 * - Semantic HTML structure
 * - Proper heading hierarchy (h3)
 * - ARIA labels for buttons
 * 
 * @param {Object} room - Room data object
 * @param {number} index - Index for animation delay
 * 
 * @module RoomCard
 */

import Link from 'next/link';
import { BedDouble, Home, Hotel, Star, Users } from 'lucide-react';

interface Room {
  id: string;
  number: string;
  type: string;
  capacity: number;
  description?: string;
  amenities: string[];
  images: string[];
  size?: number;
  bedType?: string;
  isAvailable: boolean;
  isActive: boolean;
  property: {
    name: string;
    type: string;
  };
  bookingCount: number;
}

interface RoomCardProps {
  room: Room;
  index: number;
}

const roomTypeIcons = {
  standard: Hotel,
  deluxe: Star,
  suite: BedDouble,
  family: Users,
} as const;

function RoomTypeGlyph({ type }: { type: string }) {
  const Icon = roomTypeIcons[type.toLowerCase() as keyof typeof roomTypeIcons] ?? Home;
  return <Icon className="w-6 h-6 text-primary" aria-hidden />;
}

export default function RoomCard({ room, index }: RoomCardProps) {
  return (
    <div 
      className="card bg-base-100 shadow-lg card-hover animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="card-body">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <RoomTypeGlyph type={room.type} />
            </div>
            <div>
              <h3 className="font-semibold text-lg font-display">Room {room.number}</h3>
              <div className="badge badge-sm badge-outline">{room.type}</div>
            </div>
          </div>
          {room.isAvailable ? (
            <span className="badge badge-success">Available</span>
          ) : (
            <span className="badge badge-error">Occupied</span>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-base-content/60">Property:</span>
            <span className="font-medium text-base-content">{room.property.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-base-content/60">Capacity:</span>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-base-content/70" />
              <span className="font-medium text-base-content">{room.capacity} guests</span>
            </div>
          </div>
          {room.bedType && (
            <div className="flex items-center justify-between">
              <span className="text-base-content/60">Bed Type:</span>
              <span className="text-base-content">{room.bedType}</span>
            </div>
          )}
          {room.size && (
            <div className="flex items-center justify-between">
              <span className="text-base-content/60">Size:</span>
              <span className="text-base-content">{room.size} m²</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-base-content/60">Status:</span>
            <span className={`font-semibold ${room.isAvailable ? 'text-success' : 'text-error'}`}>
              {room.isAvailable ? 'Available' : 'Occupied'}
            </span>
          </div>
        </div>

        {room.amenities.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-base-content/60 mb-2">Amenities:</div>
            <div className="flex flex-wrap gap-1">
              {room.amenities.slice(0, 3).map((amenity, idx) => (
                <span key={idx} className="badge badge-sm badge-outline">
                  {amenity}
                </span>
              ))}
              {room.amenities.length > 3 && (
                <span className="badge badge-sm badge-ghost">
                  +{room.amenities.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {room.bookingCount > 0 && (
          <div className="mb-4 text-sm text-base-content/60">
            {room.bookingCount} booking{room.bookingCount > 1 ? 's' : ''}
          </div>
        )}

        <div className="card-actions justify-end mt-4 pt-4 border-t">
          <Link 
            href={`/rooms?selected=${encodeURIComponent(room.id)}`} 
            className="btn btn-ghost btn-sm gentle-lift min-h-[36px]"
            aria-label={`View room ${room.number}`}
          >
            View
          </Link>
          <Link 
            href={`/rooms?edit=${encodeURIComponent(room.id)}`} 
            className="btn btn-primary btn-sm gentle-lift min-h-[36px]"
            aria-label={`Edit room ${room.number}`}
          >
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}
