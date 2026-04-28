'use client';

import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_BEFORE_MS = 2 * 60 * 1000;
const ABSOLUTE_MAX_MS = 8 * 60 * 60 * 1000;
const LOGIN_TS_KEY = 'etuna-session-start-ts';

/**
 * Session timeout wrapper
 *
 * Purpose: Auto-logout authenticated users after inactivity.
 * Location: /components/providers/SessionTimeoutWrapper.tsx
 */
export function SessionTimeoutWrapper({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const absoluteRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  };

  const forceLogout = useCallback(
    async (reason: 'inactivity' | 'expired') => {
      await signOut({ redirect: false });
      router.push(`/login?reason=${reason}`);
    },
    [router]
  );

  const startTimer = useCallback(() => {
    clearTimer();
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
    }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS);
    timeoutRef.current = setTimeout(async () => {
      await forceLogout('inactivity');
    }, INACTIVITY_TIMEOUT_MS);
  }, [forceLogout]);

  const onActivity = useCallback(() => {
    setShowWarning(false);
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    const now = Date.now();
    const existingStart = Number(window.sessionStorage.getItem(LOGIN_TS_KEY) ?? '');
    const sessionStart = Number.isFinite(existingStart) && existingStart > 0 ? existingStart : now;
    if (!existingStart) window.sessionStorage.setItem(LOGIN_TS_KEY, String(now));

    const remainingAbsolute = sessionStart + ABSOLUTE_MAX_MS - now;
    if (remainingAbsolute <= 0) {
      forceLogout('expired');
      return;
    }
    absoluteRef.current = setTimeout(() => {
      forceLogout('expired');
    }, remainingAbsolute);

    const events: Array<keyof WindowEventMap> = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    for (const eventName of events) {
      window.addEventListener(eventName, onActivity, { passive: true });
    }
    startTimer();

    return () => {
      for (const eventName of events) {
        window.removeEventListener(eventName, onActivity);
      }
      clearTimer();
      if (absoluteRef.current) {
        clearTimeout(absoluteRef.current);
        absoluteRef.current = null;
      }
    };
  }, [forceLogout, onActivity, startTimer]);

  return (
    <>
      {showWarning ? (
        <div className="fixed right-4 bottom-4 z-120 max-w-sm rounded-xl border border-warning bg-warning/10 p-4 shadow-lg">
          <p className="text-sm text-terracotta-900 mb-3">
            You will be logged out in 2 minutes due to inactivity.
          </p>
          <button
            type="button"
            onClick={onActivity}
            className="h-9 px-4 rounded-lg bg-khaki-600 text-white hover:bg-rustic transition-colors"
          >
            Stay signed in
          </button>
        </div>
      ) : null}
      {children}
    </>
  );
}

