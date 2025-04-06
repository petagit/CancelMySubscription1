import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import AuthPage from "@/pages/auth-page";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import Layout from "@/components/Layout";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { Loader2 } from "lucide-react";
import DebugEnvironment from "./debug-env";
import { ClerkProvider } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

// Component to fetch and provide Clerk key
function ClerkKeyProvider({ children }: { children: React.ReactNode }) {
  const [clerkKey, setClerkKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // First try to get from environment variables
    const envKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 
                  import.meta.env.VITE_CLERK_DEV_PUBLISHABLE_KEY;
    
    if (envKey) {
      setClerkKey(envKey);
      setLoading(false);
      return;
    }
    
    // If not available in env, fetch from server
    fetch('/api/clerk-key')
      .then(res => res.json())
      .then(data => {
        if (data.key) {
          setClerkKey(data.key);
        } else {
          console.warn("No Clerk publishable key found");
        }
      })
      .catch(err => {
        console.error("Failed to fetch Clerk key:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-black" />
        <span className="ml-3 text-lg font-medium">Loading application...</span>
      </div>
    );
  }
  
  if (!clerkKey) {
    // Render without Clerk if key is not available
    return <>{children}</>;
  }
  
  return (
    <ClerkProvider publishableKey={clerkKey}>
      {children}
    </ClerkProvider>
  );
}

// Loading component for authentication
function AuthLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-black" />
      <span className="ml-3 text-lg font-medium">Loading authentication...</span>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <ProtectedRoute path="/dashboard" component={Dashboard} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:slug" component={BlogPost} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DebugEnvironment />
      <ClerkKeyProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ClerkKeyProvider>
    </QueryClientProvider>
  );
}

export default App;
