/**
 * Guest Personal Information Form Section
 * 
 * Purpose: Form section for guest personal information fields
 * Location: /components/features/crm/forms/GuestPersonalInfoForm.tsx
 * 
 * Features:
 * - First name, last name, email, phone
 * - Date of birth, nationality
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
 * @module GuestPersonalInfoForm
 */

interface GuestPersonalInfoFormProps {
  formData: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    date_of_birth?: string;
    nationality?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export default function GuestPersonalInfoForm({ formData, onChange }: GuestPersonalInfoFormProps) {
  return (
    <div>
      <h3 className="text-xl font-semibold font-display mb-4">Personal Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label htmlFor="first_name" className="label">
            <span className="label-text font-medium">First Name</span>
          </label>
          <input 
            type="text" 
            id="first_name" 
            name="first_name" 
            value={formData.first_name || ''} 
            onChange={onChange} 
            className="input input-bordered min-h-[44px]" 
          />
        </div>
        <div className="form-control">
          <label htmlFor="last_name" className="label">
            <span className="label-text font-medium">Last Name</span>
          </label>
          <input 
            type="text" 
            id="last_name" 
            name="last_name" 
            value={formData.last_name || ''} 
            onChange={onChange} 
            className="input input-bordered min-h-[44px]" 
          />
        </div>
        <div className="form-control">
          <label htmlFor="email" className="label">
            <span className="label-text font-medium">Email</span>
          </label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            value={formData.email || ''} 
            onChange={onChange} 
            className="input input-bordered min-h-[44px] bg-base-200" 
            disabled 
          />
        </div>
        <div className="form-control">
          <label htmlFor="phone" className="label">
            <span className="label-text font-medium">Phone</span>
          </label>
          <input 
            type="text" 
            id="phone" 
            name="phone" 
            value={formData.phone || ''} 
            onChange={onChange} 
            className="input input-bordered min-h-[44px]" 
          />
        </div>
        <div className="form-control">
          <label htmlFor="date_of_birth" className="label">
            <span className="label-text font-medium">Date of Birth</span>
          </label>
          <input 
            type="date" 
            id="date_of_birth" 
            name="date_of_birth" 
            value={formData.date_of_birth || ''} 
            onChange={onChange} 
            className="input input-bordered min-h-[44px]" 
          />
        </div>
        <div className="form-control">
          <label htmlFor="nationality" className="label">
            <span className="label-text font-medium">Nationality</span>
          </label>
          <input 
            type="text" 
            id="nationality" 
            name="nationality" 
            value={formData.nationality || ''} 
            onChange={onChange} 
            className="input input-bordered min-h-[44px]" 
          />
        </div>
      </div>
    </div>
  );
}
