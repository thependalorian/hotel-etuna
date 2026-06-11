/**
 * SofiaTypingIndicator — shared assistant "thinking" state for Sofia chat UIs.
 * Location: components/features/sofia/SofiaTypingIndicator.tsx
 */

import { SofiaAvatar } from '@/components/ui';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { cn } from '@/lib/utils/cn';

type SofiaTypingIndicatorProps = {
  variant?: 'luxury' | 'default' | 'compact';
  label?: string;
  className?: string;
};

export function SofiaTypingIndicator({
  variant = 'default',
  label = 'Sofia is thinking...',
  className,
}: SofiaTypingIndicatorProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex gap-3 justify-start', className)}>
        <SofiaAvatar size="sm" variant="gradient" />
        <div className="bg-base-200 rounded-lg px-4 py-2">
          <LoadingSpinner size="sm" />
        </div>
      </div>
    );
  }

  if (variant === 'luxury') {
    return (
      <div className={cn('flex justify-start animate-fade-in', className)}>
        <div className="max-w-[80%] p-4 rounded-2xl rounded-bl-sm bg-white text-nude-900 border border-luxury-charlotte/30 shadow-luxury-soft animate-ai-pulse">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-luxury-charlotte animate-bounce-subtle" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-luxury-charlotte animate-bounce-subtle" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-luxury-charlotte animate-bounce-subtle" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-nude-600">{label}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex justify-start', className)}>
      <div className="bg-base-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <SofiaAvatar size="sm" showStatus isOnline variant="gradient" />
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
