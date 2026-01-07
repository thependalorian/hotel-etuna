/**
 * ErrorBoundary Component
 * 
 * Location: components/common/ErrorBoundary.tsx
 * Purpose: React Error Boundary for catching and displaying React errors
 * 
 * Features:
 * - Catches React component errors
 * - Displays ErrorState component
 * - Optional reset functionality
 * - Logs errors for debugging
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View } from 'react-native';
import ErrorState from './ErrorState';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console or error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={{ flex: 1 }}>
          <ErrorState
            title="Something went wrong"
            message={this.state.error?.message || 'An unexpected error occurred'}
            retryLabel="Try Again"
            onRetry={this.handleReset}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
export default ErrorBoundary;
