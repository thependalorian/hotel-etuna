'use client';

/**
 * CookieConsentBanner — GDPR-style analytics consent for guest-facing pages.
 * Location: components/features/compliance/CookieConsentBanner.tsx
 */

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'hoteletuna_cookie_consent_v1';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = (analytics: boolean) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ essential: true, analytics, at: new Date().toISOString() })
    );
    setVisible(false);
    if (analytics && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hoteletuna:analytics-consent', { detail: { granted: true } }));
    }
  };

  if (!visible) return null;

  return (
    <div
      className="toast toast-bottom toast-center z-50 w-full max-w-lg px-4 pb-4"
      role="dialog"
      aria-labelledby="cookie-consent-title"
    >
      <div className="alert shadow-lg bg-base-100 border border-base-300 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 text-sm">
          <p id="cookie-consent-title" className="font-medium">
            Cookies & privacy
          </p>
          <p className="text-base-content/70 mt-1">
            We use essential cookies for sign-in and optional analytics to improve your stay.
            See our{' '}
            <a href="/guest/dsar" className="link link-primary">
              data & privacy
            </a>{' '}
            page.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            className="btn btn-ghost btn-sm rounded-full px-4"
            onClick={() => accept(false)}
          >
            Essential only
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm rounded-full px-4"
            onClick={() => accept(true)}
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
