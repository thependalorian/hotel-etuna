/**
 * Generic React error boundary for use in any context.
 * Location: components/shared/ErrorBoundary.tsx
 */

'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { securityLogger } from '@/lib/utils/security-logger.client';

interface Props { children: ReactNode; fallback?: ReactNode; onError?: (error: Error, info: ErrorInfo) => void; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    securityLogger.error('[ErrorBoundary]', { message: error.message, componentStack: errorInfo.componentStack });
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="rounded-xl border border-error/30 bg-error/5 p-6 text-center">
          <p className="text-error font-medium mb-2">Something went wrong</p>
          <p className="text-sm text-base-content/60 mb-4">{this.state.error?.message ?? 'An unexpected error occurred.'}</p>
          <button className="btn btn-sm btn-outline" onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
