'use client';

import { useEffect, useState } from 'react';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const update = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online && navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'REPLAY_BOOKINGS' });
      }
    };
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-rustic text-white text-sm text-center py-2 px-4">
      You are offline. Booking will sync when you reconnect.
    </div>
  );
}
