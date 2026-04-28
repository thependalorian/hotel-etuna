/**
 * DaisyUI toast stack for platform admin (and any child under this provider)
 *
 * Purpose: Accessible toasts for API/network errors and success confirmations
 * Location: components/PlatformToastProvider.tsx
 */

'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useId,
  useState,
} from 'react';
import { X } from 'lucide-react';

export type PlatformToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ShowToastInput {
  variant?: PlatformToastVariant;
  title?: string;
  message: string;
  /** ms; 0 = sticky until dismissed */
  duration?: number;
}

interface ToastItem extends Required<Pick<ShowToastInput, 'message'>> {
  id: string;
  variant: PlatformToastVariant;
  title?: string;
  duration: number;
}

interface PlatformToastContextValue {
  showToast: (input: ShowToastInput) => void;
  dismiss: (id: string) => void;
}

const PlatformToastContext = createContext<PlatformToastContextValue | null>(null);

export function usePlatformToast(): PlatformToastContextValue {
  const ctx = useContext(PlatformToastContext);
  if (!ctx) {
    throw new Error('usePlatformToast must be used within PlatformToastProvider');
  }
  return ctx;
}

const VARIANT_CLASS: Record<PlatformToastVariant, string> = {
  info: 'alert-info',
  success: 'alert-success',
  warning: 'alert-warning',
  error: 'alert-error',
};

export function PlatformToastProvider({ children }: { children: React.ReactNode }) {
  const baseId = useId();
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (input: ShowToastInput) => {
      const id = `${baseId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const duration = input.duration === undefined ? 6500 : input.duration;
      const item: ToastItem = {
        id,
        variant: input.variant ?? 'info',
        title: input.title,
        message: input.message,
        duration,
      };

      setItems((prev) => [...prev, item]);

      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
    },
    [baseId, dismiss]
  );

  const value = React.useMemo(
    () => ({ showToast, dismiss }),
    [showToast, dismiss]
  );

  return (
    <PlatformToastContext.Provider value={value}>
      {children}
      <div
        className="toast toast-end toast-top z-[200] w-full max-w-md flex flex-col gap-2 p-0 pointer-events-none"
        aria-live="polite"
        aria-relevant="additions"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`alert ${VARIANT_CLASS[t.variant]} shadow-lg pointer-events-auto flex flex-row items-start gap-2 py-3`}
          >
            <div className="flex-1 min-w-0">
              {t.title ? (
                <p className="font-semibold text-sm">{t.title}</p>
              ) : null}
              <p className={`text-sm ${t.title ? 'opacity-90' : ''}`}>{t.message}</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-square shrink-0 min-h-9 min-w-9"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </PlatformToastContext.Provider>
  );
}
