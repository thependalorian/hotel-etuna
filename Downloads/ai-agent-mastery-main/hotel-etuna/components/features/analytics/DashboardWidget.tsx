/**
 * DashboardWidget Component
 * 
 * Purpose: Reusable analytics widget for dashboard display
 * Location: /components/features/analytics/DashboardWidget.tsx
 * 
 * Features:
 * - Customizable metrics display
 * - Trend indicators
 * - Icon support
 * - Clickable actions
 * - Responsive design
 */

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';

interface DashboardWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
}

export default function DashboardWidget({
  title,
  value,
  subtitle,
  trend,
  icon,
  href,
  onClick,
  className = '',
  variant = 'default',
}: DashboardWidgetProps) {
  const variantClasses = {
    default: 'bg-base-100',
    primary: 'bg-primary/10 border-primary/20',
    success: 'bg-success/10 border-success/20',
    warning: 'bg-warning/10 border-warning/20',
    error: 'bg-error/10 border-error/20',
  };

  const content = (
    <Card className={cn('card-hover', variantClasses[variant], className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-base-content/70 mb-1">{title}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-display">{value}</span>
              {subtitle && (
                <span className="text-sm text-base-content/60">{subtitle}</span>
              )}
            </div>
          </div>
          {icon && (
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-base-200 flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>

        {trend && (
          <div className="flex items-center gap-2 mt-4">
            {trend.isPositive !== false ? (
              <TrendingUp className="w-4 h-4 text-success" />
            ) : (
              <TrendingDown className="w-4 h-4 text-error" />
            )}
            <span
              className={cn(
                'text-sm font-medium',
                trend.isPositive !== false ? 'text-success' : 'text-error'
              )}
            >
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-base-content/60">{trend.label}</span>
          </div>
        )}

        {(href || onClick) && (
          <div className="mt-4 pt-4 border-t border-base-200">
            {href ? (
              <Link
                href={href}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-focus"
              >
                View Details
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                onClick={onClick}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-focus"
                aria-label={`View details for ${title}`}
              >
                View Details
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href && !onClick) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
