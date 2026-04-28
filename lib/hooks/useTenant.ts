/**
 * useTenant Hook
 *
 * Purpose: Expose tenant (and optional property) context for client components
 *          so UI can show tenant-scoped data and pass tenantId to API calls.
 * Location: /lib/hooks/useTenant.ts
 *
 * Uses next-auth useSession; tenantId is set in JWT/session by auth config.
 * RLS is enforced server-side; this hook is for client-side context only.
 */

'use client';

import { useSession } from 'next-auth/react';

export type TenantSession = {
  tenantId: string | null;
  propertyId: string | null;
  userId: string | null;
  role: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

/**
 * Returns tenant and user context from the current session.
 * Use in client components that need tenantId for API calls or display.
 */
export function useTenant(): TenantSession {
  const { data: session, status } = useSession();
  const user = session?.user as
    | { id?: string; tenantId?: string; propertyId?: string; role?: string }
    | undefined;

  return {
    tenantId: user?.tenantId ?? null,
    propertyId: user?.propertyId ?? null,
    userId: user?.id ?? session?.user?.email ?? null,
    role: user?.role ?? null,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated' && !!session?.user,
  };
}
