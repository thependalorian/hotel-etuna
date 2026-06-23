/**
 * PropertySwitcher — hub facility context (single-property OS: guest rooms + conference + campsite)
 *
 * Purpose: Switch active inventory context from the dashboard header when multiple facility rows exist.
 * Location: /components/features/property/PropertySwitcher.tsx
 */

'use client';

import { Building2, ChevronDown } from 'lucide-react';
import { useActiveProperty } from '@/components/providers/ActivePropertyProvider';
import { cn } from '@/lib/utils/cn';

export function PropertySwitcher() {
  const {
    properties,
    activePropertyId,
    activeProperty,
    setActivePropertyId,
    loading,
    error,
  } = useActiveProperty();

  if (loading) {
    return (
      <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full bg-nude-50 border border-nude-200 min-h-[44px]">
        <span className="skeleton h-4 w-28" />
      </div>
    );
  }

  if (error || properties.length === 0) {
    return null;
  }

  if (properties.length === 1) {
    return (
      <div
        className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full bg-nude-50 border border-nude-200 text-sm text-ink-800 min-h-[44px]"
        title={activeProperty?.name}
      >
        <Building2 className="w-4 h-4 text-ink-600 shrink-0" aria-hidden="true" />
        <span className="font-medium truncate max-w-[12rem]">{activeProperty?.name}</span>
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center gap-2">
      <label htmlFor="property-switcher" className="sr-only">
        Active property
      </label>
      <div className="relative">
        <Building2
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-600 pointer-events-none"
          aria-hidden="true"
        />
        <select
          id="property-switcher"
          className={cn(
            'select select-bordered select-sm rounded-full pl-9 pr-8 min-h-[44px]',
            'bg-nude-50 border-nude-200 text-sm font-medium text-ink-800 max-w-[14rem]'
          )}
          value={activePropertyId ?? ''}
          onChange={(e) => setActivePropertyId(e.target.value)}
        >
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.type ? ` (${p.type})` : ''}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-600 pointer-events-none"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
