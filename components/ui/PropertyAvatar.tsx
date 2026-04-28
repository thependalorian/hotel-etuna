/**
 * PropertyAvatar Component
 * 
 * Purpose: Reusable property/tenant avatar with fallback to property icon
 * Location: /components/ui/PropertyAvatar.tsx
 * 
 * Features:
 * - Property image with fallback
 * - Multiple sizes
 * - Property type indicator
 * - Status badge support
 */

'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Building, Hotel, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface PropertyAvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  propertyType?: 'hotel' | 'restaurant' | 'both' | string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  status?: 'active' | 'inactive' | 'pending';
  badge?: React.ReactNode;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const iconSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

const propertyIcons = {
  hotel: Hotel,
  restaurant: Utensils,
  both: Building,
  default: Building,
};

export const PropertyAvatar: React.FC<PropertyAvatarProps> = ({
  src,
  alt,
  name,
  propertyType,
  size = 'md',
  className = '',
  status = 'active',
  badge,
}) => {
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const Icon = propertyIcons[propertyType as keyof typeof propertyIcons] ?? propertyIcons.default;
  const sizeClass = sizeClasses[size];
  const iconSize = iconSizeClasses[size];

  const statusColors = {
    active: 'bg-success',
    inactive: 'bg-base-300',
    pending: 'bg-warning',
  };

  return (
    <div className={cn('relative inline-flex', className)}>
      <div className={cn(
        'relative rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center',
        'border-2 border-base-300',
        sizeClass
      )}>
        {src && !hasError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-base-200" />
            )}
            <Image
              src={src}
              alt={alt || name || 'Property'}
              fill
              className={cn(
                'object-cover transition-opacity duration-300',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setHasError(true)}
            />
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <Icon className={cn('text-primary', iconSize)} />
          </div>
        )}
      </div>

      {/* Status indicator */}
      {status && (
        <div className={cn(
          'absolute bottom-0 right-0 rounded-full border-2 border-base-100',
          statusColors[status],
          size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-3 h-3' : 'w-3.5 h-3.5'
        )} />
      )}

      {/* Custom badge */}
      {badge && (
        <div className="absolute -top-1 -right-1 z-10">
          {badge}
        </div>
      )}
    </div>
  );
};
