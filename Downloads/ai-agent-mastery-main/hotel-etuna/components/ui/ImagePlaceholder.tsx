/**
 * ImagePlaceholder Component
 *
 * Purpose: Reusable placeholder for images with loading states and fallback
 * Location: /components/ui/ImagePlaceholder.tsx
 *
 * Features:
 * - Loading skeleton state
 * - Error fallback with icon
 * - Customizable size and aspect ratio
 * - Supports Next.js Image component
 */

'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ImagePlaceholderProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  placeholder?: 'blur' | 'empty';
  priority?: boolean;
  quality?: number;
  sizes?: string;
  fallbackIcon?: React.ReactNode;
  aspectRatio?: 'square' | 'video' | 'wide' | 'portrait' | string;
}

export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  placeholder = 'empty',
  priority = false,
  quality = 75,
  sizes,
  fallbackIcon,
  aspectRatio,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Aspect ratio classes
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
    portrait: 'aspect-[3/4]',
  };

  const aspectClass = typeof aspectRatio === 'string' && aspectRatio in aspectClasses
    ? aspectClasses[aspectRatio as keyof typeof aspectClasses]
    : aspectRatio || '';

  // Fallback UI
  const FallbackUI = (
    <div className={cn(
      'flex items-center justify-center bg-base-200 text-base-content/40',
      fill ? 'absolute inset-0' : aspectClass,
      !fill && !aspectClass && 'w-full h-full',
      className
    )}>
      {fallbackIcon || <ImageIcon className="w-8 h-8" />}
    </div>
  );

  // Loading skeleton
  const LoadingSkeleton = (
    <div className={cn(
      'animate-pulse bg-base-200',
      fill ? 'absolute inset-0' : aspectClass,
      !fill && !aspectClass && 'w-full h-full',
      className
    )} />
  );

  // No image provided
  if (!src) {
    return FallbackUI;
  }

  // Error state
  if (hasError) {
    return FallbackUI;
  }

  // Image component
  const imageProps = fill
    ? {
        fill: true,
        sizes: sizes || '100vw',
      }
    : {
        width: width || 400,
        height: height || 300,
      };

  // When using fill, the wrapper must be absolutely positioned to fill parent
  // Parent container MUST have position: relative and defined height
  const containerClasses = fill
    ? cn('absolute inset-0 overflow-hidden', className)
    : cn('relative overflow-hidden', aspectClass, className);

  return (
    <div className={containerClasses}>
      {isLoading && LoadingSkeleton}
      <Image
        src={src}
        alt={alt}
        {...imageProps}
        className={cn(
          'object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        placeholder={placeholder}
        priority={priority}
        quality={quality}
        sizes={sizes}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
};
