/**
 * Property Selector Component
 * 
 * Purpose: Dropdown selector for restaurant properties
 * Location: /components/features/restaurant/PropertySelector.tsx
 * 
 * Features:
 * - Property dropdown
 * - Auto-selects first property
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Select size: min-h-[44px] (Fitt's Law)
 * 
 * Accessibility:
 * - Proper label for select
 * - Keyboard navigation support
 * 
 * @param {Array} properties - Array of property objects
 * @param {string} selectedPropertyId - Currently selected property ID
 * @param {Function} onPropertyChange - Property change handler
 * 
 * @module PropertySelector
 */

interface Property {
  id: string;
  name: string;
  type: string;
  has_restaurant_features: boolean;
}

interface PropertySelectorProps {
  properties: Property[];
  selectedPropertyId: string | null;
  onPropertyChange: (propertyId: string) => void;
}

export default function PropertySelector({ properties, selectedPropertyId, onPropertyChange }: PropertySelectorProps) {
  return (
    <div className="card bg-base-100">
      <div className="card-body">
        <label htmlFor="propertySelect" className="label">
          <span className="label-text font-medium">Select Restaurant Property:</span>
        </label>
        <select
          id="propertySelect"
          className="select select-bordered w-full max-w-md min-h-[44px]"
          value={selectedPropertyId || ''}
          onChange={(e) => onPropertyChange(e.target.value)}
        >
          {properties.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.type})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
