/**
 * Guest Identification Form Section
 * 
 * Purpose: Form section for guest identification fields
 * Location: /components/features/crm/forms/GuestIdentificationForm.tsx
 * 
 * Features:
 * - Passport number
 * - ID number
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
 * @module GuestIdentificationForm
 */

interface GuestIdentificationFormProps {
  formData: {
    passport_number?: string;
    id_number?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export default function GuestIdentificationForm({ formData, onChange }: GuestIdentificationFormProps) {
  return (
    <div>
      <h3 className="text-xl font-semibold font-display mb-4">Identification</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label htmlFor="passport_number" className="label">
            <span className="label-text font-medium">Passport Number</span>
          </label>
          <input 
            type="text" 
            id="passport_number" 
            name="passport_number" 
            value={formData.passport_number || ''} 
            onChange={onChange} 
            className="input input-bordered min-h-[44px]" 
          />
        </div>
        <div className="form-control">
          <label htmlFor="id_number" className="label">
            <span className="label-text font-medium">ID Number</span>
          </label>
          <input 
            type="text" 
            id="id_number" 
            name="id_number" 
            value={formData.id_number || ''} 
            onChange={onChange} 
            className="input input-bordered min-h-[44px]" 
          />
        </div>
      </div>
    </div>
  );
}
