/**
 * Tabs Component - Enhanced Tab Navigation
 * 
 * Purpose: Reusable tabs component with enhanced UX
 * Location: /components/ui/Tabs.tsx
 * 
 * Features:
 * - Smooth transitions (Doherty Threshold)
 * - Active state indicators (Von Restorff)
 * - Keyboard navigation (Accessibility)
 * - Fitt's Law - proper touch targets
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface Tab {
  label: string;
  content: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: number;
  variant?: 'default' | 'pills' | 'underline';
  onTabChange?: (index: number) => void;
}

export function Tabs({ tabs, defaultTab = 0, variant = 'default', onTabChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    onTabChange?.(index);
  };

  return (
    <div className="w-full">
      {/* Tab List (Hick's Law - limit choices) */}
      <div
        role="tablist"
        className={cn(
          'flex gap-2 border-b border-base-300',
          variant === 'pills' && 'gap-1 p-1 bg-base-200 rounded-lg border-0',
          variant === 'underline' && 'gap-6'
        )}
      >
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = index === activeTab;

          return (
            <button
              key={index}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${index}`}
              id={`tab-${index}`}
              onClick={() => handleTabChange(index)}
              className={cn(
                // Base styles (Fitt's Law - 44px minimum, Doherty Threshold - <400ms)
                'relative px-4 py-3 text-sm font-medium transition-all duration-200 ease-out',
                'min-h-[44px] flex items-center gap-2 rounded-lg',
                'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
                'active:scale-[0.98]', // Tactile feedback
                // Variants
                variant === 'default' && cn(
                  'border-b-2 border-transparent -mb-px',
                  isActive && 'border-primary text-primary',
                  !isActive && 'text-base-content/70 hover:text-base-content hover:border-base-400'
                ),
                variant === 'pills' && cn(
                  'rounded-lg',
                  isActive && 'bg-primary text-primary-content shadow-md shadow-nude-primary',
                  !isActive && 'text-base-content/70 hover:bg-base-300 hover:text-base-content hover:-translate-y-0.5'
                ),
                variant === 'underline' && cn(
                  'border-b-2 border-transparent -mb-px',
                  isActive && 'border-primary text-primary font-semibold',
                  !isActive && 'text-base-content/70 hover:text-base-content hover:border-base-400'
                )
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={cn(
                  'ml-1 px-2 py-0.5 text-xs rounded-full',
                  isActive ? 'bg-primary-content/20 text-primary-content' : 'bg-base-300 text-base-content/70'
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels (Doherty Threshold - smooth transitions) */}
      <div className="mt-4">
        {tabs.map((tab, index) => (
          <div
            key={index}
            role="tabpanel"
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            hidden={index !== activeTab}
            className={cn(
              index === activeTab && 'animate-fade-in',
              index !== activeTab && 'hidden'
            )}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
