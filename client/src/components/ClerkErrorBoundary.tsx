import React, { Component, ErrorInfo, ReactNode, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component specifically for Clerk authentication
 * This catches errors that occur when initializing or using Clerk
 * and prevents them from crashing the entire application
 */
class ClerkErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console
    console.error('Clerk Error Boundary caught an error:', error, errorInfo);
    
    // Call the error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Still render children but with error state
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
  const hasShownToast = useRef(false);
  
  const handleError = (error: Error) => {
    if (!hasShownToast.current) {
      console.log('Showing toast for Clerk error:', error.message);
      toast({
        title: "Authentication Notice",
        description: "We're having trouble with our login service. You can continue using the app as a guest or try again later.",
        variant: "destructive",
        duration: 5000,
      });
      hasShownToast.current = true;
    }
  };
  
  // Reset toast flag when component remounts
  useEffect(() => {
    return () => {
      hasShownToast.current = false;
    };
  }, []);
  
  return (
    <ClerkErrorBoundaryClass
      onError={(error) => handleError(error)}
    >
      {children}
    </ClerkErrorBoundaryClass>
  );
}