/**
 * SofiaAvatar Component
 * 
 * Purpose: Reusable Sofia AI avatar with animated indicator
 * Location: /components/ui/SofiaAvatar.tsx
 * 
 * Features:
 * - Sofia AI branding
 * - Online/active status with pulse animation
 * - Multiple sizes
 * - Gradient background
 */

import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SofiaAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showStatus?: boolean;
  isOnline?: boolean;
  variant?: 'gradient' | 'solid' | 'outline';
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const iconSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

const variantClasses = {
  gradient: 'bg-gradient-to-br from-nude-600 to-nude-500',
  solid: 'bg-primary',
  outline: 'bg-transparent border-2 border-primary',
};

export const SofiaAvatar: React.FC<SofiaAvatarProps> = ({
  size = 'md',
  className = '',
  showStatus = true,
  isOnline = true,
  variant = 'gradient',
}) => {
  const sizeClass = sizeClasses[size];
  const iconSize = iconSizeClasses[size];
  const variantClass = variantClasses[variant];

  return (
    <div className={cn('relative inline-flex', className)}>
      <div className={cn(
        'relative rounded-full overflow-hidden flex items-center justify-center',
        'border-2 border-base-300 shadow-md',
        variantClass,
        sizeClass
      )}>
        {variant === 'outline' ? (
          <Bot className={cn('text-primary', iconSize)} />
        ) : (
          <span className={cn('text-primary-content font-bold', size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : size === 'lg' ? 'text-base' : 'text-lg')}>S</span>
        )}
      </div>

      {/* Online status indicator with pulse animation */}
      {showStatus && isOnline && (
        <div className={cn(
          'absolute bottom-0 right-0 rounded-full border-2 border-base-100',
          'bg-success animate-pulse',
          size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-3 h-3' : 'w-3.5 h-3.5'
        )} />
      )}

      {/* Glow effect for online status */}
      {showStatus && isOnline && (
        <div className={cn(
          'absolute inset-0 rounded-full',
          'bg-success/20 animate-ping',
          sizeClass
        )} style={{ animationDuration: '2s' }} />
      )}
    </div>
  );
};
