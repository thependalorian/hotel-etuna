/**
 * RoomCard Component
 * 
 * Purpose: Display a single room card with details and actions
 * Location: /components/features/property/RoomCard.tsx
 * 
 * Features:
 * - Room information display
 * - CMS image support
 * - Quick actions (edit, view, manage content)
 * - Status indicators
 * - Responsive design
 */

'use client';

import React from 'react';
import type { Room } from '@/lib/db/schema';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { ImagePlaceholder } from '@/components/ui';
import { Edit, Image as ImageIcon, Bed, Users } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface RoomCardProps {
  room: Room;
  imageUrl?: string;
  onEdit?: (room: Room) => void;
  onManageContent?: (room: Room) => void;
  className?: string;
}

export default function RoomCard({
  room,
  imageUrl,
  onEdit,
  onManageContent,
  className = '',
}: RoomCardProps) {
  return (
    <Card className={cn('overflow-hidden hover:shadow-nude-medium hover:-translate-y-0.5 transition-all duration-200', className)} variant="elevated">
      {/* Room Image with gradient overlay */}
      <figure className="relative h-48 w-full overflow-hidden bg-nude-100 group">
        <ImagePlaceholder
          src={imageUrl}
          alt={`${room.roomType} - Room ${room.roomNumber}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-nude-900/70 via-nude-900/20 to-transparent" />
        
        {/* Room Number Badge */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg font-mono text-sm font-bold bg-white/95 text-nude-900 shadow-nude-soft">
            #{room.roomNumber}
          </span>
        </div>
        
        {/* Availability Indicator */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-semantic-success-light text-semantic-success-dark border border-semantic-success/20">
            <span className="w-2 h-2 rounded-full bg-semantic-success animate-pulse-soft" />
            Available
          </span>
        </div>
      </figure>
      
      <CardContent className="p-5">
        {/* Room Details */}
        <div className="mb-4">
          <h3 className="font-display text-lg font-semibold text-nude-900 mb-3">
            {room.roomType}
          </h3>
          
          <div className="flex items-center gap-4 text-sm text-nude-600">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>Max: {room.maxOccupancy}</span>
            </div>
            {room.baseRate && (
              <div className="flex items-center gap-1">
                <span className="font-display text-lg font-bold text-nude-900">
                  N$ {room.baseRate}
                </span>
                <span className="text-xs text-nude-500">/night</span>
              </div>
            )}
          </div>
        </div>

        {/* Amenities */}
        {room.amenities?.length ? (
          <div className="mb-4 p-3 bg-nude-50 rounded-lg border border-nude-200">
            <p className="text-xs font-semibold text-nude-700 mb-2">Amenities</p>
            <div className="flex flex-wrap gap-1.5">
              {room.amenities.slice(0, 3).map((amenity, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white text-nude-700 border border-nude-200">
                  {amenity}
                </span>
              ))}
              {room.amenities.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-nude-600">
                  +{room.amenities.length - 3} more
                </span>
              )}
            </div>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-nude-200">
          {onEdit && (
            <button
              onClick={() => onEdit(room)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-nude-700 hover:bg-nude-50 rounded-lg transition-colors duration-200 min-h-[44px]"
              aria-label={`Edit ${room.roomType} - Room ${room.roomNumber}`}
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
          {onManageContent && (
            <button
              onClick={() => onManageContent(room)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-nude-700 hover:bg-nude-50 rounded-lg transition-colors duration-200 min-h-[44px]"
              aria-label={`Manage content for ${room.roomType} - Room ${room.roomNumber}`}
            >
              <ImageIcon className="w-4 h-4" />
              Content
            </button>
          )}
          <Link
            href={`/cms?roomId=${room.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-nude-600 text-white rounded-lg font-semibold text-sm hover:bg-nude-700 transition-colors duration-200 ml-auto min-h-[44px]"
            aria-label={`View full details for ${room.roomType} - Room ${room.roomNumber}`}
          >
            View Details
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
