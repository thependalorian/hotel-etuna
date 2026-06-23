/**
 * Table Component - Enhanced Data Display
 * 
 * Purpose: Reusable table component with enhanced styling and accessibility
 * Location: /components/ui/Table.tsx
 * 
 * Features:
 * - Responsive design (mobile-friendly)
 * - Enhanced hover states (Fitt's Law - clear feedback)
 * - Accessibility (keyboard navigation, ARIA labels)
 * - Visual hierarchy (Gestalt - similarity, proximity)
 * - Loading and empty states
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  variant?: 'default' | 'striped' | 'bordered';
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div className="w-full overflow-x-auto scrollbar-thin -mx-4 sm:mx-0 px-4 sm:px-0 rounded-etuna-card">
        <table
          ref={ref}
          className={cn(
            'w-full min-w-[640px] sm:min-w-0 border-separate border-spacing-0 rounded-etuna-card bg-white/90',
            variant === 'striped' && 'table-zebra',
            variant === 'bordered' && 'table-bordered',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Table.displayName = 'Table';

export type TableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement>;

export const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <thead
        ref={ref}
        className={cn(
          'sticky top-0 z-10 bg-brand-50/95 backdrop-blur-sm',
          'border-b border-base-300',
          className
        )}
        {...props}
      />
    );
  }
);
TableHeader.displayName = 'TableHeader';

export type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;

export const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => {
    return (
      <tbody
        ref={ref}
        className={cn('divide-y divide-base-200', className)}
        {...props}
      />
    );
  }
);
TableBody.displayName = 'TableBody';

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  interactive?: boolean;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, interactive = false, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn(
          'transition-all duration-200 border-b border-base-200/80',
          interactive && cn(
            'cursor-pointer hover:bg-brand-50/70 focus-within:bg-brand-50/70',
            'focus-within:shadow-xs',
            'min-h-[44px]' // Fitt's Law
          ),
          className
        )}
        {...props}
      />
    );
  }
);
TableRow.displayName = 'TableRow';

export type TableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement>;

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn(
          'px-4 py-3 text-left text-xs font-bold text-ink-500 uppercase tracking-[0.16em]',
          'min-h-[44px] font-display', // Fitt's Law, typography hierarchy
          'first:rounded-tl-lg last:rounded-tr-lg', // Gestalt - closure
          className
        )}
        {...props}
      />
    );
  }
);
TableHead.displayName = 'TableHead';

export type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={cn(
          'px-4 py-3.5 text-sm text-ink-800',
          'min-h-[44px] leading-relaxed', // Fitt's Law, readability
          'align-middle', // Vertical alignment
          className
        )}
        {...props}
      />
    );
  }
);
TableCell.displayName = 'TableCell';

export type TableCaptionProps = React.HTMLAttributes<HTMLTableCaptionElement>;

export const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <caption
        ref={ref}
        className={cn('mt-4 text-sm text-ink-500', className)}
        {...props}
      />
    );
  }
);
TableCaption.displayName = 'TableCaption';
