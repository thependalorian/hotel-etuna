/**
 * Settings Tabs Component
 * 
 * Purpose: Tab navigation for settings page
 * Location: /components/features/settings/SettingsTabs.tsx
 * 
 * Features:
 * - Tab navigation with icons
 * - Active tab highlighting
 * - Responsive design
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Tab size: min-h-[44px] (Fitt's Law)
 * 
 * Accessibility:
 * - Keyboard navigation support
 * - ARIA labels
 * 
 * @param {Array} tabs - Array of tab objects
 * @param {string} activeTab - Currently active tab ID
 * @param {Function} onTabChange - Tab change handler
 * 
 * @module SettingsTabs
 */

import { LucideIcon } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface SettingsTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function SettingsTabs({ tabs, activeTab, onTabChange }: SettingsTabsProps) {
  return (
    <div className="tabs tabs-boxed mb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`tab min-h-[44px] transition-all duration-200 ${
              activeTab === tab.id ? 'tab-active' : ''
            }`}
            onClick={() => onTabChange(tab.id)}
            aria-label={`${tab.label} settings tab`}
            aria-selected={activeTab === tab.id}
          >
            <Icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
