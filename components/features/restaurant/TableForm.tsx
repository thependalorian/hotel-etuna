/**
 * Table Form Component
 * 
 * Purpose: Form for adding new restaurant tables
 * Location: /components/features/restaurant/TableForm.tsx
 * 
 * Features:
 * - Table number input
 * - Table name input (optional)
 * - Capacity input
 * - Location input
 * - Form validation
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
 * @param {Function} onSubmit - Form submit handler
 * @param {boolean} loading - Loading state
 * @param {string} error - Error message
 * @param {Function} onCancel - Cancel handler
 * 
 * @module TableForm
 */

import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/Button';

interface TableFormProps {
  formData: {
    tableNumber: string;
    tableName: string;
    capacity: number;
    location: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string;
  onCancel: () => void;
}

export default function TableForm({ formData, onChange, onSubmit, loading, error, onCancel }: TableFormProps) {
  return (
    <div className="card bg-base-100 shadow-xl mb-6 animate-scale-in">
      <div className="card-body">
        <h4 className="text-lg font-bold font-display mb-4">Add New Table</h4>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="alert alert-error animate-slide-down">
              {error}
            </div>
          )}
          <div className="form-control">
            <label htmlFor="tableNumber" className="label">
              <span className="label-text font-medium">Table Number</span>
            </label>
            <input 
              type="text" 
              id="tableNumber" 
              name="tableNumber" 
              value={formData.tableNumber} 
              onChange={onChange} 
              className="input input-bordered w-full min-h-[44px]" 
              required 
            />
          </div>
          <div className="form-control">
            <label htmlFor="tableName" className="label">
              <span className="label-text font-medium">Table Name (Optional)</span>
            </label>
            <input 
              type="text" 
              id="tableName" 
              name="tableName" 
              value={formData.tableName} 
              onChange={onChange} 
              className="input input-bordered w-full min-h-[44px]" 
            />
          </div>
          <div className="form-control">
            <label htmlFor="capacity" className="label">
              <span className="label-text font-medium">Capacity</span>
            </label>
            <input 
              type="number" 
              id="capacity" 
              name="capacity" 
              value={formData.capacity} 
              onChange={onChange} 
              className="input input-bordered w-full min-h-[44px]" 
              min="1" 
              required 
            />
          </div>
          <div className="form-control">
            <label htmlFor="location" className="label">
              <span className="label-text font-medium">Location (e.g., Main Dining, Patio)</span>
            </label>
            <input 
              type="text" 
              id="location" 
              name="location" 
              value={formData.location} 
              onChange={onChange} 
              className="input input-bordered w-full min-h-[44px]" 
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button 
              type="button"
              onClick={onCancel}
              className="btn btn-outline gentle-lift min-h-[44px]"
            >
              Cancel
            </button>
            <Button type="submit" className="gentle-lift" isLoading={loading}>
              Add Table
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
