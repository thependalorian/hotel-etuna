/**
 * Global 404 — marketing / auth / public routes (outside dashboard shell)
 *
 * Purpose: Next.js not-found UI for invalid URLs; DaisyUI + accessible actions.
 * Location: app/not-found.tsx
 */

import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-base-200 p-6">
      <div className="card w-full max-w-lg bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-base-200">
            <FileQuestion className="h-10 w-10 text-base-content/60" aria-hidden />
          </div>
          <h1 className="etuna-page-title--compact">Page not found</h1>
          <p className="mb-6 text-base-content/70">
            The page you&apos;re looking for doesn&apos;t exist or was moved.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn btn-primary min-h-[44px]">
              Home
            </Link>
            <Link href="/login" className="btn btn-outline min-h-[44px]">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
