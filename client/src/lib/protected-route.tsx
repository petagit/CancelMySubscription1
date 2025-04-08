import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

// We allow all users access - both authenticated and guest users
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const [hasGuestId, setHasGuestId] = useState(false);
  const [isCheckingGuest, setIsCheckingGuest] = useState(true);

  // Check for guest mode and create one if none exists but clerk failed
  useEffect(() => {
    const guestId = localStorage.getItem("guestId");
    
    if (guestId) {
      console.log("Using existing guest ID:", guestId);
      setHasGuestId(true);
    } else if (!isLoaded || document.querySelector(".cl-userButtonPopoverFooter") === null) {
      // If Clerk failed to load or we detected an error, create a guest ID
      console.log("Creating fallback guest ID due to authentication issues");
      const newGuestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem("guestId", newGuestId);
      setHasGuestId(true);
    }
    
    setIsCheckingGuest(false);
  }, [isLoaded]);

  // Show loading state while checking auth status
  if (!isLoaded || isCheckingGuest) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Guest users or authenticated users can access protected routes
  if (hasGuestId || isSignedIn) {
    return <>{children}</>;
  }

  // Redirect to home page if not a guest and not authenticated
  return <Navigate to="/" replace />;
}