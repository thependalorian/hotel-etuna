/**
 * PageHeader Component - Design System v1.0.0
 * 
 * Purpose: Standardized page header with gradient background
 * Location: /components/shared/PageHeader.tsx
 * 
 * Features:
 * - Gradient background from nude-50 to surface-elevated
 * - Optional breadcrumbs
 * - Title with display font
 * - Description with max-width prose
 * - Action buttons (right-aligned desktop, full-width mobile)
 * - Divider below header
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  className?: string;
}

function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={cn('bg-gradient-to-b from-nude-50 to-surface-elevated rounded-xl border-b border-nude-200', className)}>
      <div className="py-6 px-4 md:py-8 md:px-6">
        <div className="flex flex-col gap-4">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-2 text-sm text-nude-600" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <ChevronRight className="w-4 h-4 text-nude-400" aria-hidden="true" />
                  )}
                  {crumb.href ? (
                    <Link 
                      href={crumb.href}
                      className="hover:text-nude-800 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-nude-800 font-medium">
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}

          {/* Title and Actions */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              {eyebrow ? (
                <p className="etuna-eyebrow mb-2">{eyebrow}</p>
              ) : null}
              <h1 className="font-display text-3xl md:text-4xl font-bold text-nude-900 mb-2">
                {title}
              </h1>
              {description && (
                <p className="text-nude-600 text-base md:text-lg max-w-prose leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {/* Actions */}
            {actions && (
              <div className="flex items-center gap-2 md:shrink-0 w-full md:w-auto">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PageHeader;
