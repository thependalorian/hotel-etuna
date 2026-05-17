/**
 * Cloudflare Turnstile widget for registration bot protection.
 * Location: /components/features/auth/TurnstileWidget.tsx
 */

'use client';

import { useEffect, useRef, useState } from 'react';

type TurnstileWidgetProps = {
  onToken: (token: string) => void;
  onExpire?: () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const SCRIPT_ID = 'cf-turnstile-script';
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '';

export function TurnstileWidget({ onToken, onExpire }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const enabled = SITE_KEY.length > 0;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const mount = () => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        theme: 'auto',
        callback: (token) => onToken(token),
        'expired-callback': () => onExpire?.(),
      });
    };

    if (window.turnstile) {
      setReady(true);
      mount();
      return () => {
        cancelled = true;
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
        }
      };
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const onLoad = () => {
      if (!cancelled) {
        setReady(true);
        mount();
      }
    };

    if (existing) {
      existing.addEventListener('load', onLoad);
      return () => {
        cancelled = true;
        existing.removeEventListener('load', onLoad);
      };
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = onLoad;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [enabled, onExpire, onToken]);

  if (!enabled) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={ready ? 'min-h-[65px]' : 'min-h-[65px] skeleton rounded-lg'}
      aria-label="Security check"
    />
  );
}
