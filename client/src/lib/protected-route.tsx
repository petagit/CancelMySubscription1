import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

// Simple protected route that allows either signed in users or users with a guest ID
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useClerkAuth();
  
  // Check if we have a guest ID in localStorage
  const hasGuestId = !!localStorage.getItem("guestId");
  
  // If Clerk is still loading, show a loader
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  
  // Allow access if user is signed in OR has a guest ID
  if (isSignedIn || hasGuestId) {
    return <>{children}</>;
  }
  
  // Otherwise, redirect to sign-in page
  return <Navigate to="/sign-in" replace />;
} 