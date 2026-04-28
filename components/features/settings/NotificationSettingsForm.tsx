/**
 * Notification Settings Form Component
 * 
 * Purpose: Form section for notification preferences
 * Location: /components/features/settings/NotificationSettingsForm.tsx
 * 
 * Features:
 * - Email notifications toggle
 * - SMS notifications toggle
 * - Push notifications toggle
 * - Booking notifications toggle
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
 * @module NotificationSettingsForm
 */

interface NotificationSettingsFormProps {
  formData: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    bookingNotifications: boolean;
  };
  onChange: (field: string, value: boolean) => void;
}

export default function NotificationSettingsForm({ formData, onChange }: NotificationSettingsFormProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Notification Preferences</h3>
        
        <div className="form-control">
          <label className="label cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={formData.emailNotifications}
              onChange={(e) => onChange('emailNotifications', e.target.checked)}
            />
            <span className="label-text ml-2">Email Notifications</span>
          </label>
          <label className="label">
            <span className="label-text-alt">Receive important updates via email</span>
          </label>
        </div>

        <div className="form-control">
          <label className="label cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={formData.smsNotifications}
              onChange={(e) => onChange('smsNotifications', e.target.checked)}
            />
            <span className="label-text ml-2">SMS Notifications</span>
          </label>
          <label className="label">
            <span className="label-text-alt">Receive text messages for urgent matters</span>
          </label>
        </div>

        <div className="form-control">
          <label className="label cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={formData.pushNotifications}
              onChange={(e) => onChange('pushNotifications', e.target.checked)}
            />
            <span className="label-text ml-2">Push Notifications</span>
          </label>
          <label className="label">
            <span className="label-text-alt">Browser push notifications</span>
          </label>
        </div>

        <div className="form-control">
          <label className="label cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={formData.bookingNotifications}
              onChange={(e) => onChange('bookingNotifications', e.target.checked)}
            />
            <span className="label-text ml-2">Booking Notifications</span>
          </label>
          <label className="label">
            <span className="label-text-alt">Notifications for new bookings and changes</span>
          </label>
        </div>
      </div>
    </div>
  );
}
