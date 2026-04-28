/**
 * General Settings Form Component
 * 
 * Purpose: Form section for general settings (site name, email, language, timezone)
 * Location: /components/features/settings/GeneralSettingsForm.tsx
 * 
 * Features:
 * - Site name and email
 * - Default language selection
 * - Timezone selection
 * - Grid layout (2 columns on desktop)
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Input size: min-h-[44px] (Fitt's Law)
 * 
 * Accessibility:
 * - Proper labels for all inputs
 * - Keyboard navigation support
 * 
 * @param {Object} formData - Form data object
 * @param {Function} onChange - Change handler function
 * 
 * @module GeneralSettingsForm
 */

interface GeneralSettingsFormProps {
  formData: {
    siteName: string;
    siteEmail: string;
    defaultLanguage: string;
    timezone: string;
  };
  onChange: (field: string, value: string) => void;
}

export default function GeneralSettingsForm({ formData, onChange }: GeneralSettingsFormProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Site Name</span>
          </label>
          <input
            type="text"
            className="input input-bordered min-h-[44px]"
            value={formData.siteName}
            onChange={(e) => onChange('siteName', e.target.value)}
          />
        </div>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text">Site Email</span>
          </label>
          <input
            type="email"
            className="input input-bordered min-h-[44px]"
            value={formData.siteEmail}
            onChange={(e) => onChange('siteEmail', e.target.value)}
          />
        </div>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text">Default Language</span>
          </label>
          <select
            className="select select-bordered min-h-[44px]"
            value={formData.defaultLanguage}
            onChange={(e) => onChange('defaultLanguage', e.target.value)}
          >
            <option value="en">English</option>
            <option value="de">German</option>
            <option value="af">Afrikaans</option>
          </select>
        </div>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text">Timezone</span>
          </label>
          <select
            className="select select-bordered min-h-[44px]"
            value={formData.timezone}
            onChange={(e) => onChange('timezone', e.target.value)}
          >
            <option value="Africa/Windhoek">Africa/Windhoek</option>
            <option value="Africa/Johannesburg">Africa/Johannesburg</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
      </div>
    </div>
  );
}
