import { ReactNode } from "react";
import { useAuth } from "./clerk";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

/**
 * A component that protects routes by checking if the user is authenticated
 * If not authenticated, redirects to sign-in page unless in development mode
 * If auth is still loading, shows a loading spinner
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoading, isSignedIn } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // In development mode, always allow access
  if (isDevelopment) {
    console.log("Development mode: bypassing authentication check");
    return <>{children}</>;
  }
  
  // If not signed in and not in development, redirect to sign-in
  if (!isSignedIn) {
    return <Navigate to="/sign-in" />;
  }

  // If authenticated, render the children
  return <>{children}</>;
}