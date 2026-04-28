/**
 * Guest Preferences Form Section
 * 
 * Purpose: Form section for guest preferences and consent
 * Location: /components/features/crm/forms/GuestPreferencesForm.tsx
 * 
 * Features:
 * - Marketing consent checkbox
 * - Preferences management
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Checkbox with proper label (Fitt's Law: min-h-[44px])
 * 
 * Accessibility:
 * - Proper labels for checkboxes
 * - Keyboard navigation support
 * 
 * @param {Object} formData - Form data object
 * @param {Function} onChange - Change handler function
 * 
 * @module GuestPreferencesForm
 */

interface GuestPreferencesFormProps {
  formData: {
    marketing_consent?: boolean;
    preferences?: Record<string, unknown>;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export default function GuestPreferencesForm({ formData, onChange }: GuestPreferencesFormProps) {
  return (
    <div>
      <h3 className="text-xl font-semibold font-display mb-4">Preferences</h3>
      <div className="form-control">
        <label className="label cursor-pointer min-h-[44px]">
          <span className="label-text font-medium">Marketing Consent</span>
          <input 
            type="checkbox" 
            name="marketing_consent" 
            checked={formData.marketing_consent || false} 
            onChange={onChange} 
            className="checkbox checkbox-primary" 
          />
        </label>
      </div>
    </div>
  );
}
