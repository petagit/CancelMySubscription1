import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Error boundary component specifically for Clerk authentication
 * This catches errors that occur when initializing or using Clerk
 * and prevents them from crashing the entire application
 */
class ClerkErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console
    console.error('Clerk Error Boundary caught an error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <>
          {this.props.children}
        </>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper component that combines the error boundary with toast functionality
 */
export function ClerkErrorBoundary({ children }: ErrorBoundaryProps): JSX.Element {
  const { toast } = useToast();
  
  const handleError = () => {
    toast({
      title: "Authentication Issue",
      description: "There was a problem with Google Sign-in. Standard login is still available.",
      variant: "destructive",
    });
  };
  
  return (
    <ClerkErrorBoundaryClass
      children={children}
    />
  );
}