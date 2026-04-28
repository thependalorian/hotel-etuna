/**
 * NextAuth Type Definitions
 * 
 * Purpose: Extend NextAuth types to include Buffr Host specific fields
 * Location: /next-auth.d.ts
 * 
 * Implements:
 * - Multi-tenant support (tenantId)
 * - Property context (propertyId)
 * - Role-based access control
 * - Free platform (no subscription fields)
 */

import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name?: string;
    role: string;
    tenantId?: string;
    propertyId?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      role: string;
      tenantId?: string;
      propertyId?: string;
    } & DefaultSession['user'];
  }

  interface JWT {
    id: string;
    email: string;
    role: string;
    tenantId?: string;
    propertyId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    role: string;
    tenantId?: string;
    propertyId?: string;
  }
}
