import { Switch, Route, useLocation } from "wouter";
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
import { Loader2 } from "lucide-react";
import DebugEnvironment from "./debug-env";
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { ClerkErrorBoundary } from "@/components/ClerkErrorBoundary";

// Create a ClerkProtectedRoute component
function ClerkProtectedRoute({ path, component: Component }: { path: string, component: React.ComponentType<any> }) {
  const [, navigate] = useLocation();

  return (
    <Route path={path}>
      <>
        <SignedIn>
          <Component />
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn redirectUrl={`${window.location.origin}${path}`} />
        </SignedOut>
      </>
    </Route>
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
        <ClerkProtectedRoute path="/dashboard" component={Dashboard} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:slug" component={BlogPost} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  // Get publishable key from environment or server endpoint
  const [clerkKey, setClerkKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);
  
  useEffect(() => {
    try {
      // First try to get from environment variables
      const envKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 
                     import.meta.env.VITE_CLERK_DEV_PUBLISHABLE_KEY;
      
      console.log("VITE_CLERK_PUBLISHABLE_KEY:", import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
      console.log("VITE_CLERK_DEV_PUBLISHABLE_KEY:", import.meta.env.VITE_CLERK_DEV_PUBLISHABLE_KEY);
      
      if (envKey) {
        console.log("Using Clerk key from environment variables");
        setClerkKey(envKey);
        setLoading(false);
        return;
      }
      
      // If not available in env, fetch from server
      fetch('/api/clerk-key')
        .then(res => res.json())
        .then(data => {
          if (data.key) {
            console.log("Using Clerk key from server:", data.key);
            setClerkKey(data.key);
          } else {
            // If there's no key from the server, use a hardcoded production key 
            // This is a temporary solution until environment variables are properly loaded
            const hardcodedKey = "pk_live_Y2xlcmsuY2FuY2VsbXlzdWIuYXBwJA";  // Production key
            console.log("Using hardcoded Clerk production key as fallback");
            setClerkKey(hardcodedKey);
          }
        })
        .catch(err => {
          console.error("Failed to fetch Clerk key:", err);
          // Use hardcoded production key on error
          const hardcodedKey = "pk_live_Y2xlcmsuY2FuY2VsbXlzdWIuYXBwJA";  // Production key
          console.log("Using hardcoded Clerk production key as fallback after fetch error");
          setClerkKey(hardcodedKey);
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (err) {
      console.error("Error in Clerk key provider:", err);
      setError(true);
      setLoading(false);
    }
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-black" />
        <span className="ml-3 text-lg font-medium">Loading application...</span>
      </div>
    );
  }
  
  if (error || !clerkKey) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-4 bg-red-50 text-red-500 rounded-md">
          <h2 className="text-lg font-bold mb-2">Authentication Error</h2>
          <p>Could not initialize Clerk authentication. Please check your credentials.</p>
        </div>
      </div>
    );
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <DebugEnvironment />
      <ClerkErrorBoundary>
        <ClerkProvider 
          publishableKey={clerkKey}
          appearance={{
            baseTheme: undefined, // Use "dark" or undefined for light
            elements: {
              formButtonPrimary: "bg-black hover:bg-gray-800 text-white",
              card: "shadow-none"
            }
          }}
        >
          <Router />
          <Toaster />
        </ClerkProvider>
      </ClerkErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
