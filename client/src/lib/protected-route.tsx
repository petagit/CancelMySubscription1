import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

// TEMPORARY: For testing purposes only - allows access without auth
const BYPASS_AUTH = true;

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      ) : !user && !BYPASS_AUTH ? (
        <Redirect to="/auth" />
      ) : (
        <Component />
      )}
    </Route>
  );
}