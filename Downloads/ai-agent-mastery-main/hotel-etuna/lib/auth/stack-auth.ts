/**
 * Stack Auth Server Configuration
 * 
 * Purpose: Configure Stack Auth (Neon Auth) for server-side authentication
 * Location: /lib/auth/stack-auth.ts
 * 
 * Features:
 * - Email/password authentication via Stack Auth API
 * - JWT session management
 * - Server-side auth helpers
 * - User session validation
 * 
 * Stack Auth Project ID: 8935f921-3c67-4e2e-b40f-76c9af7bf79d
 * Trusted Domain: https://host.buffr.ai
 */

import { stackServerApp } from '@/stack';

// Helper function to get current user
export async function getCurrentUser() {
  if (!stackServerApp) {
    return null;
  }
  try {
    const user = await stackServerApp.getUser();
    return user;
  } catch (error) {
    console.error('[Stack Auth] Error getting current user:', error);
    return null;
  }
}

// Helper function to require authentication
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized: Authentication required');
  }
  return user;
}

// Helper function to check if user is admin
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // Check if user has admin role or specific email
  // Stack Auth doesn't have getProjectRole() - check email or use database lookup
  try {
    // For now, check by email - can be enhanced with database role lookup
    return user.primaryEmail === 'george@buffr.ai' || user.primaryEmail === 'pendanek@gmail.com';
  } catch (error) {
    console.error('[Stack Auth] Error checking admin:', error);
    return false;
  }
}

// Helper function to require admin access
export async function requireAdmin() {
  const user = await requireAuth();
  const admin = await isAdmin();
  
  if (!admin) {
    throw new Error('Forbidden: Admin access required');
  }
  
  return user;
}

// Helper function to get session
export async function getSession() {
  if (!stackServerApp) {
    return null;
  }
  try {
    const user = await stackServerApp.getUser();
    return user ? { user } : null;
  } catch (error) {
    console.error('[Stack Auth] Error getting session:', error);
    return null;
  }
}

// Export Stack Server App for direct use
export { stackServerApp };
