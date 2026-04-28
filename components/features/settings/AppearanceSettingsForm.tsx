/**
 * Appearance Settings Form Component
 * 
 * Purpose: Form section for appearance settings
 * Location: /components/features/settings/AppearanceSettingsForm.tsx
 * 
 * Features:
 * - Theme selection
 * - Primary color selection
 * - Accent color selection
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Select size: min-h-[44px] (Fitt's Law)
 * 
 * Accessibility:
 * - Proper labels for all selects
 * - Keyboard navigation support
 * 
 * @param {Object} formData - Form data object
 * @param {Function} onChange - Change handler function
 * 
 * @module AppearanceSettingsForm
 */

interface AppearanceSettingsFormProps {
  formData: {
    theme: string;
    primaryColor: string;
    accentColor: string;
  };
  onChange: (field: string, value: string) => void;
}

export default function AppearanceSettingsForm({ formData, onChange }: AppearanceSettingsFormProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Appearance Settings</h3>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text">Theme</span>
          </label>
          <select
            className="select select-bordered min-h-[44px]"
            value={formData.theme}
            onChange={(e) => onChange('theme', e.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Primary Color</span>
          </label>
          <select
            className="select select-bordered min-h-[44px]"
            value={formData.primaryColor}
            onChange={(e) => onChange('primaryColor', e.target.value)}
          >
            <option value="nude">Nude (Default)</option>
            <option value="nude-light">Nude Light</option>
            <option value="nude-medium">Nude Medium</option>
            <option value="nude-dark">Nude Dark</option>
          </select>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Accent Color</span>
          </label>
          <select
            className="select select-bordered min-h-[44px]"
            value={formData.accentColor}
            onChange={(e) => onChange('accentColor', e.target.value)}
          >
            <option value="nude">Nude</option>
            <option value="charlotte">Charlotte (Warm Gold)</option>
            <option value="champagne">Champagne (Cream)</option>
            <option value="bronze">Bronze</option>
          </select>
        </div>
      </div>
    </div>
  );
}
