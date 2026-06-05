'use client';

import { useEffect } from 'react';
import { securityLogger } from '@/lib/utils/security-logger.client';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    // Emergency production safeguard:
    // clear older SW controllers/caches that can serve stale App Router payloads.
    // We keep offline features disabled until SW strategy is fully stabilized.
    const cleanup = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      } catch (error) {
        securityLogger.error('[SW] Unregister failed:', error);
      }

      if ('caches' in window) {
        try {
          const keys = await caches.keys();
          const targets = keys.filter((key) => key.startsWith('hotel-etuna-'));
          await Promise.all(targets.map((key) => caches.delete(key)));
        } catch (error) {
          securityLogger.error('[SW] Cache cleanup failed:', error);
        }
      }
    };

    void cleanup();
  }, []);

  return null;
}
