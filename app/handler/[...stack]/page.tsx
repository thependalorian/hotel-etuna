/**
 * Stack Auth Handler
 * 
 * Purpose: Handle all Stack Auth routes (sign-in, sign-up, etc.)
 * Location: /app/handler/[...stack]/page.tsx
 * 
 * This catch-all route handles:
 * - /handler/sign-in
 * - /handler/sign-up
 * - /handler/forgot-password
 * - /handler/reset-password
 * - And other Stack Auth routes
 */

import { StackHandler } from '@stackframe/stack';
import { stackServerApp } from '@/stack';

export default function HandlerPage(props: {
  params: { stack: string[] };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return (
    <StackHandler
      app={stackServerApp}
      routeProps={props}
      fullPage={true}
    />
  );
}
