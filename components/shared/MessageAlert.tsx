/**
 * Message Alert Component
 * 
 * Purpose: Reusable alert component for success and error messages
 * Location: /components/shared/MessageAlert.tsx
 * 
 * Features:
 * - Success and error variants
 * - Slide-down animation
 * - Auto-dismissible (optional)
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, alert-success, alert-error
 * - Animation: animate-slide-down
 * 
 * Accessibility:
 * - ARIA roles and labels
 * - Keyboard dismissible
 * 
 * @param {string} message - Alert message text
 * @param {string} type - Alert type ('success' | 'error')
 * @param {Function} onDismiss - Optional dismiss handler
 * 
 * @module MessageAlert
 */

interface MessageAlertProps {
  message: string;
  type: 'success' | 'error';
  onDismiss?: () => void;
}

const closeIconPath = 'M6 18L18 6M6 6l12 12';

export default function MessageAlert({ message, type, onDismiss }: MessageAlertProps) {
  const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
  const iconPath = type === 'success' 
    ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    : 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';

  return (
    <div className={`alert ${alertClass} animate-slide-down`} role="alert">
      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPath} />
      </svg>
      <span>{message}</span>
      {onDismiss && (
        <button 
          className="btn btn-sm btn-ghost" 
          onClick={onDismiss}
          aria-label="Dismiss alert"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 stroke-current" fill="none" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={closeIconPath} />
          </svg>
        </button>
      )}
    </div>
  );
}
