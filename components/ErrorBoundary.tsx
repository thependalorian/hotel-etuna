/**
 * React error boundary with DaisyUI fallback
 *
 * Purpose: Catches client-side render errors in child trees and offers retry + navigation home.
 * Location: components/ErrorBoundary.tsx
 *
 * Use around interactive/dashboard subtrees (e.g. platform admin) where a thrown error
 * should not take down the entire app shell.
 */

'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import Link from 'next/link';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { captureClientException } from '@/lib/monitoring/capture-client-exception';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  /** Override whether to show the error message string (defaults: true in development only) */
  showDetails?: boolean;
  /** Primary navigation target from the fallback (default: /) */
  homeHref?: string;
  /** Label for the home button (default: Home) */
  homeLabel?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    captureClientException(error, { componentStack: errorInfo.componentStack ?? '' });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const err = this.state.error;
      const showDetails =
        this.props.showDetails ?? process.env.NODE_ENV === 'development';
      const homeHref = this.props.homeHref ?? '/';
      const homeLabel = this.props.homeLabel ?? 'Home';

      return (
        <div
          className="flex min-h-[40vh] flex-col items-center justify-center p-6"
          role="alert"
          aria-live="assertive"
        >
          <div className="card w-full max-w-lg bg-base-100 shadow-xl">
            <div className="card-body gap-4">
              <div className="alert alert-error">
                <AlertCircle className="h-6 w-6 shrink-0" aria-hidden />
                <div>
                  <h2 className="font-bold">Something went wrong</h2>
                  <p className="text-sm opacity-90">
                    This section hit an unexpected error. You can try again or continue to {homeLabel}.
                  </p>
                </div>
              </div>
              {showDetails && err?.message ? (
                <pre className="max-h-32 overflow-auto rounded-lg bg-base-200 p-3 text-xs whitespace-pre-wrap break-words">
                  {err.message}
                </pre>
              ) : null}
              <div className="card-actions flex-wrap justify-end gap-2">
                <button type="button" className="btn btn-outline btn-sm gap-2" onClick={this.handleReset}>
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  Try again
                </button>
                <Link href={homeHref} className="btn btn-primary btn-sm gap-2">
                  <Home className="h-4 w-4" aria-hidden />
                  {homeLabel}
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
