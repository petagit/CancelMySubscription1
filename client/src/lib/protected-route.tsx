import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Navigate, Outlet } from "react-router-dom";

// We allow all users access - both authenticated and guest users
export function ProtectedRoute() {
  const { isLoading } = useAuth();
  const hasGuestId = !!localStorage.getItem("guestId");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Guest users or authenticated users can access protected routes
  if (hasGuestId) {
    return <Outlet />;
  }

  // Redirect to auth page if not a guest and not authenticated
  return <Navigate to="/auth" replace />;
}