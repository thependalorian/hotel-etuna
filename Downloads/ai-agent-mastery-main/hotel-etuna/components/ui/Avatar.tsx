/**
 * Avatar Component
 * 
 * Purpose: Reusable user avatar with fallback to initials
 * Location: /components/ui/Avatar.tsx
 * 
 * Features:
 * - Image with fallback to initials
 * - Multiple sizes (sm, md, lg, xl)
 * - Online status indicator
 * - Badge support
 */

'use client';

import Image from 'next/image';
import { useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showOnline?: boolean;
  isOnline?: boolean;
  badge?: React.ReactNode;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const badgeSizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  className = '',
  showOnline = false,
  isOnline = false,
  badge,
}) => {
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get initials from name
  const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name || alt);
  const sizeClass = sizeClasses[size];
  const badgeSize = badgeSizeClasses[size];

  return (
    <div className={cn('relative inline-flex', className)}>
      <div className={cn(
        'relative rounded-full overflow-hidden bg-primary/20 flex items-center justify-center',
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
              alt={alt || name || 'Avatar'}
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
            {name || alt ? (
              <span className="font-semibold text-primary">{initials}</span>
            ) : (
              <User className={cn('text-base-content/40', size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : size === 'lg' ? 'w-6 h-6' : 'w-8 h-8')} />
            )}
          </div>
        )}
      </div>

      {/* Online status indicator */}
      {showOnline && (
        <div className={cn(
          'absolute bottom-0 right-0 rounded-full border-2 border-base-100',
          isOnline ? 'bg-success' : 'bg-base-300',
          badgeSize
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
