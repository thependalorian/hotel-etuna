/**
 * Loading Component
 * 
 * Purpose: Loading boundary for Stack Auth hooks (useUser, etc.)
 * Location: /app/loading.tsx
 * 
 * This is required by Stack Auth to handle async user data loading
 */

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="loading loading-spinner loading-lg text-primary"></div>
    </div>
  );
}
