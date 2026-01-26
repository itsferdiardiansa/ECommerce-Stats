'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent error={this.state.error} retry={this.retry} />
        );
      }

      return (
        <div className='border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center rounded-lg border p-6'>
          <div className='space-y-3 text-center'>
            <div className='text-destructive font-medium'>
              Something went wrong
            </div>
            <div className='text-muted-foreground text-sm'>
              {this.state.error?.message || 'An unexpected error occurred'}
            </div>
            <Button onClick={this.retry} variant='outline' size='sm'>
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
