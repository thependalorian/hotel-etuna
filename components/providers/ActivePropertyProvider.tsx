/**
 * ActivePropertyProvider — hub operator multi-property context (OSS W6 / pesan-pms pattern)
 *
 * Purpose: Persist selected property across dashboard routes for hub tenants.
 * Location: /components/providers/ActivePropertyProvider.tsx
 */

'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiUrl } from '@/lib/utils/api-url';

export const ACTIVE_PROPERTY_STORAGE_KEY = 'etuna-active-property-id';

export interface ActivePropertySummary {
  id: string;
  name: string;
  type?: string;
}

interface ActivePropertyContextValue {
  properties: ActivePropertySummary[];
  activePropertyId: string | null;
  activeProperty: ActivePropertySummary | null;
  setActivePropertyId: (propertyId: string) => void;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const ActivePropertyContext = createContext<ActivePropertyContextValue | null>(null);

export function ActivePropertyProvider({ children }: { children: React.ReactNode }) {
  const [properties, setProperties] = useState<ActivePropertySummary[]>([]);
  const [activePropertyId, setActivePropertyIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/properties'), { credentials: 'include' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          json?.error?.message ?? json?.message ?? json?.error ?? 'Failed to load properties';
        throw new Error(typeof msg === 'string' ? msg : 'Failed to load properties');
      }
      const list = (json?.data ?? json) as Array<Record<string, unknown>>;
      const mapped: ActivePropertySummary[] = Array.isArray(list)
        ? list.map((p) => ({
            id: String(p.id),
            name: String(p.name ?? 'Property'),
            type: p.type ? String(p.type) : undefined,
          }))
        : [];
      setProperties(mapped);

      const stored =
        typeof window !== 'undefined'
          ? window.localStorage.getItem(ACTIVE_PROPERTY_STORAGE_KEY)
          : null;
      const validStored = mapped.find((p) => p.id === stored);
      const nextId = validStored?.id ?? mapped[0]?.id ?? null;
      setActivePropertyIdState(nextId);
      if (nextId && typeof window !== 'undefined') {
        window.localStorage.setItem(ACTIVE_PROPERTY_STORAGE_KEY, nextId);
      }
    } catch (e) {
      setProperties([]);
      setActivePropertyIdState(null);
      setError(e instanceof Error ? e.message : 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProperties();
  }, [loadProperties]);

  const setActivePropertyId = useCallback((propertyId: string) => {
    setActivePropertyIdState(propertyId);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ACTIVE_PROPERTY_STORAGE_KEY, propertyId);
      window.dispatchEvent(
        new CustomEvent('etuna:active-property-changed', { detail: { propertyId } })
      );
    }
  }, []);

  const activeProperty = useMemo(
    () => properties.find((p) => p.id === activePropertyId) ?? null,
    [properties, activePropertyId]
  );

  const value = useMemo(
    () => ({
      properties,
      activePropertyId,
      activeProperty,
      setActivePropertyId,
      loading,
      error,
      refresh: loadProperties,
    }),
    [
      properties,
      activePropertyId,
      activeProperty,
      setActivePropertyId,
      loading,
      error,
      loadProperties,
    ]
  );

  return (
    <ActivePropertyContext.Provider value={value}>{children}</ActivePropertyContext.Provider>
  );
}

export function useActiveProperty(): ActivePropertyContextValue {
  const ctx = useContext(ActivePropertyContext);
  if (!ctx) {
    throw new Error('useActiveProperty must be used within ActivePropertyProvider');
  }
  return ctx;
}
