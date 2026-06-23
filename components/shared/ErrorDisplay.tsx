/**
 * ErrorDisplay Component
 * 
 * Purpose: Standardized error display UI across the application
 * Location: /components/shared/ErrorDisplay.tsx
 * 
 * Features:
 * - Consistent error styling
 * - Optional retry functionality
 * - Accessible error messages
 * - Follows design system (DaisyUI + Tailwind)
 */

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';

interface ErrorDisplayProps {
  error: string | Error;
  title?: string;
  onRetry?: () => void;
  className?: string;
  variant?: 'default' | 'minimal' | 'full';
}

function ErrorDisplay({
  error,
  title = 'Error',
  onRetry,
  className = '',
  variant = 'default',
}: ErrorDisplayProps) {
  const errorMessage = error instanceof Error ? error.message : error;

  if (variant === 'minimal') {
    return (
      <div className={cn('alert alert-error', className)}>
        <AlertCircle className="w-5 h-5" />
        <span>{errorMessage}</span>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={cn('card bg-error/10 border border-error', className)}>
        <div className="card-body text-center py-16">
          <div className="w-20 h-20 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-error" />
          </div>
          <h3 className="text-xl font-bold font-display mb-2">{title}</h3>
          <p className="text-error font-medium mb-6">{errorMessage}</p>
          {onRetry && (
            <Button type="button" onClick={onRetry} aria-label="Retry operation">
              <RefreshCw className="w-4 h-4" aria-hidden />
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('card bg-error/10 border border-error', className)}>
      <div className="card-body text-center py-12">
        <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-error" />
        </div>
        <h3 className="text-lg font-bold font-display mb-2">{title}</h3>
        <p className="text-error font-medium mb-4">{errorMessage}</p>
        {onRetry && (
          <Button type="button" size="sm" onClick={onRetry} aria-label="Retry operation">
            <RefreshCw className="w-4 h-4" aria-hidden />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

export default ErrorDisplay;
