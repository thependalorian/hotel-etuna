/**
 * LoadingSpinner Component - Design System v1.0.0
 * 
 * Purpose: Reusable loading indicator with Lucide Loader2 icon
 * Location: /components/shared/LoadingSpinner.tsx
 * 
 * Features:
 * - Uses Lucide Loader2 icon with animate-spin
 * - Three sizes: sm (16px), md (24px), lg (32px)
 * - Color: nude-600
 * - Optional center variant for full-screen with backdrop
 * - Accessible with aria-label
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
  center?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  text,
  center = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2
        className={cn(
          'animate-spin text-nude-600',
          sizeClasses[size]
        )}
        role="status"
        aria-label="Loading"
        aria-live="polite"
      />
      {text && (
        <p className="text-sm font-medium text-nude-600 animate-fade-in">
          {text}
        </p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (center) {
    return (
      <div className="fixed inset-0 bg-nude-900/20 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
