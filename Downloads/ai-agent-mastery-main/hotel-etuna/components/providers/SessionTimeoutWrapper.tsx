'use client';

import { ReactNode, useCallback, useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Session timeout wrapper
 *
 * Purpose: Auto-logout authenticated users after inactivity.
 * Location: /components/providers/SessionTimeoutWrapper.tsx
 */
export function SessionTimeoutWrapper({ children }: { children: ReactNode }) {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startTimer = useCallback(() => {
    clearTimer();
    timeoutRef.current = setTimeout(async () => {
      await signOut({ redirect: false });
      router.push('/login?reason=inactivity');
    }, INACTIVITY_TIMEOUT_MS);
  }, [router]);

  useEffect(() => {
    const events: Array<keyof WindowEventMap> = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    for (const eventName of events) {
      window.addEventListener(eventName, startTimer, { passive: true });
    }
    startTimer();

    return () => {
      for (const eventName of events) {
        window.removeEventListener(eventName, startTimer);
      }
      clearTimer();
    };
  }, [startTimer]);

  return <>{children}</>;
}

