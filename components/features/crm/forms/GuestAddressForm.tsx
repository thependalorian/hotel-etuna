/**
 * Guest Address Form Section
 * 
 * Purpose: Form section for guest address information
 * Location: /components/features/crm/forms/GuestAddressForm.tsx
 * 
 * Features:
 * - Address, city, state, country, postal code
 * - Grid layout (2 columns on desktop, address spans 2 columns)
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
 * @module GuestAddressForm
 */

interface GuestAddressFormProps {
  formData: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export default function GuestAddressForm({ formData, onChange }: GuestAddressFormProps) {
  return (
    <div>
      <h3 className="text-xl font-semibold font-display mb-4">Address Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control md:col-span-2">
          <label htmlFor="address" className="label">
            <span className="label-text font-medium">Address</span>
          </label>
          <input 
            type="text" 
            id="address" 
            name="address" 
            value={formData.address || ''} 
            onChange={onChange} 
            className="input input-bordered min-h-[44px]" 
          />
        </div>
        <div className="form-control">
          <label htmlFor="city" className="label">
            <span className="label-text font-medium">City</span>
          </label>
          <input 
            type="text" 
            id="city" 
            name="city" 
            value={formData.city || ''} 
            onChange={onChange} 
            className="input input-bordered min-h-[44px]" 
          />
        </div>
        <div className="form-control">
          <label htmlFor="state" className="label">
            <span className="label-text font-medium">State</span>
          </label>
          <input 
            type="text" 
            id="state" 
            name="state" 
            value={formData.state || ''} 
            onChange={onChange} 
            className="input input-bordered min-h-[44px]" 
          />
        </div>
        <div className="form-control">
          <label htmlFor="country" className="label">
            <span className="label-text font-medium">Country</span>
          </label>
          <input 
            type="text" 
            id="country" 
            name="country" 
            value={formData.country || ''} 
            onChange={onChange} 
            className="input input-bordered min-h-[44px]" 
          />
        </div>
        <div className="form-control">
          <label htmlFor="postal_code" className="label">
            <span className="label-text font-medium">Postal Code</span>
          </label>
          <input 
            type="text" 
            id="postal_code" 
            name="postal_code" 
            value={formData.postal_code || ''} 
            onChange={onChange} 
            className="input input-bordered min-h-[44px]" 
          />
        </div>
      </div>
    </div>
  );
}
