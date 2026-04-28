/**
 * Security Settings Form Component
 * 
 * Purpose: Form section for security settings
 * Location: /components/features/settings/SecuritySettingsForm.tsx
 * 
 * Features:
 * - Two-factor authentication toggle
 * - Session timeout configuration
 * - Password expiry configuration
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
 * @module SecuritySettingsForm
 */

interface SecuritySettingsFormProps {
  formData: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordExpiry: number;
  };
  onChange: (field: string, value: boolean | number) => void;
}

export default function SecuritySettingsForm({ formData, onChange }: SecuritySettingsFormProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Security Settings</h3>
        
        <div className="form-control">
          <label className="label cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={formData.twoFactorAuth}
              onChange={(e) => onChange('twoFactorAuth', e.target.checked)}
            />
            <span className="label-text ml-2">Two-Factor Authentication</span>
          </label>
          <label className="label">
            <span className="label-text-alt">Add an extra layer of security to your account</span>
          </label>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Session Timeout (hours)</span>
          </label>
          <input
            type="number"
            className="input input-bordered min-h-[44px]"
            value={formData.sessionTimeout}
            onChange={(e) => onChange('sessionTimeout', parseInt(e.target.value))}
            min="1"
            max="168"
          />
          <label className="label">
            <span className="label-text-alt">Automatically log out after period of inactivity</span>
          </label>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Password Expiry (days)</span>
          </label>
          <input
            type="number"
            className="input input-bordered min-h-[44px]"
            value={formData.passwordExpiry}
            onChange={(e) => onChange('passwordExpiry', parseInt(e.target.value))}
            min="30"
            max="365"
          />
          <label className="label">
            <span className="label-text-alt">Force password change after specified days</span>
          </label>
        </div>
      </div>
    </div>
  );
}
