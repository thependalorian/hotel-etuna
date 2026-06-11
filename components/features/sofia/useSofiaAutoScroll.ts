/**
 * useSofiaAutoScroll — scroll chat pane when messages or loading state changes.
 * Location: components/features/sofia/useSofiaAutoScroll.ts
 */

import { useEffect, useRef } from 'react';

export function useSofiaAutoScroll(messageCount: number, loading: boolean, enabled = true) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageCount, loading, enabled]);

  return endRef;
}
