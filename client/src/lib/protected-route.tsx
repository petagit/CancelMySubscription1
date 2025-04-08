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

  // Check for guest mode
  useEffect(() => {
    setHasGuestId(!!localStorage.getItem("guestId"));
  }, []);

  if (!isLoaded) {
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

  // Redirect to auth page if not a guest and not authenticated
  return <Navigate to="/#/auth" replace />;
}