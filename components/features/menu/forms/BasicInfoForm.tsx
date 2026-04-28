/**
 * Basic Information Form Component
 * 
 * Purpose: Form section for menu item basic information
 * Location: /components/features/menu/forms/BasicInfoForm.tsx
 * 
 * Features:
 * - Item name and price
 * - Description textarea
 * - Category and property selection
 * - Dietary information
 * - Availability checkbox
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
 * @param {Array} categories - Available categories array
 * 
 * @module BasicInfoForm
 */

interface BasicInfoFormProps {
  formData: {
    name: string;
    description: string;
    price: string;
    category: string;
    propertyId: string;
    dietary: string;
    isAvailable: boolean;
  };
  onChange: (field: string, value: string | boolean) => void;
  categories: string[];
}

export default function BasicInfoForm({ formData, onChange, categories }: BasicInfoFormProps) {
  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-header">
        <h2 className="card-title">Basic Information</h2>
      </div>
      <div className="card-body">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Item Name *</span>
              </label>
              <input
                type="text"
                className="input input-bordered min-h-[44px]"
                value={formData.name}
                onChange={(e) => onChange('name', e.target.value)}
                placeholder="e.g., Grilled Salmon"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Price (NAD) *</span>
              </label>
              <input
                type="number"
                step="0.01"
                className="input input-bordered min-h-[44px]"
                value={formData.price}
                onChange={(e) => onChange('price', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-24 min-h-[120px]"
              value={formData.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Describe the dish, ingredients, preparation method..."
              aria-label="Menu item description"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Category *</span>
              </label>
              <select
                className="select select-bordered min-h-[44px]"
                value={formData.category}
                onChange={(e) => onChange('category', e.target.value)}
                required
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Property *</span>
              </label>
              <select
                className="select select-bordered min-h-[44px]"
                value={formData.propertyId}
                onChange={(e) => onChange('propertyId', e.target.value)}
                required
              >
                <option value="">Select property</option>
                {/* Add properties dynamically */}
              </select>
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Dietary Information</span>
            </label>
            <input
              type="text"
              className="input input-bordered min-h-[44px]"
              value={formData.dietary}
              onChange={(e) => onChange('dietary', e.target.value)}
              placeholder="e.g., Vegan, Gluten-free, Vegetarian"
            />
            <label className="label">
              <span className="label-text-alt">Separate multiple options with commas</span>
            </label>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={formData.isAvailable}
                onChange={(e) => onChange('isAvailable', e.target.checked)}
              />
              <span className="label-text ml-2">Item is available for ordering</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
