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
import { useState, useEffect } from "react";
import { 
  SignedIn, 
  SignedOut, 
  RedirectToSignIn, 
  ClerkLoaded,
  ClerkLoading
} from "@clerk/clerk-react";

// Enhanced protected route that checks for both Clerk auth and guest mode
function EnhancedProtectedRoute({ path, component: Component }: { path: string, component: React.ComponentType<any> }) {
  const [, navigate] = useLocation();
  const [isGuestUser, setIsGuestUser] = useState(false);
  const [isCheckingGuest, setIsCheckingGuest] = useState(true);
  const [clerkError, setClerkError] = useState(false);
  
  // Check for guest mode
  useEffect(() => {
    try {
      const hasGuestId = !!localStorage.getItem("guestId");
      setIsGuestUser(hasGuestId);
    } catch (e) {
      console.error("Error checking for guest ID:", e);
      // If we can't check localStorage, create a guest session anyway
      setIsGuestUser(true);
    } finally {
      setIsCheckingGuest(false);
    }
    
    // Also listen for Clerk errors
    const handleClerkError = (event: ErrorEvent) => {
      if (event.error && 
          (event.error.toString().includes('Clerk') || 
           event.message?.includes('Clerk'))) {
        setClerkError(true);
        // Create a guest ID if Clerk fails and we don't have one
        if (!localStorage.getItem("guestId")) {
          try {
            localStorage.setItem("guestId", "guest_" + Math.random().toString(36).substring(2, 15));
            setIsGuestUser(true);
          } catch (e) {
            console.error("Error setting guest ID:", e);
          }
        }
      }
    };
    
    window.addEventListener("error", handleClerkError);
    return () => window.removeEventListener("error", handleClerkError);
  }, []);
  
  // If it's a guest user or there's a Clerk error, grant access immediately
  if (isGuestUser || clerkError) {
    return <Route path={path} component={Component} />;
  }
  
  // If still checking guest status, show loading
  if (isCheckingGuest) {
    return (
      <Route path={path}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-700" />
        </div>
      </Route>
    );
  }
  
  // Otherwise, use Clerk's authentication with error fallback
  return (
    <Route path={path}>
      <ClerkLoading>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-700" />
        </div>
      </ClerkLoading>
      
      <ClerkLoaded>
        <SignedIn>
          <Component />
        </SignedIn>
        <SignedOut>
          <div className="flex flex-col items-center space-y-6 pt-10">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4 text-center">Authentication Required</h2>
              <p className="mb-6 text-gray-600">
                Please sign in to access this content or continue as a guest.
              </p>
              
              <div className="flex flex-col space-y-4">
                <button 
                  onClick={() => navigate("/auth")}
                  className="bg-black text-white w-full py-2 rounded-md font-medium"
                >
                  Sign In
                </button>
                
                <button 
                  onClick={() => {
                    try {
                      localStorage.setItem("guestId", "guest_" + Math.random().toString(36).substring(2, 15));
                      setIsGuestUser(true);
                    } catch (e) {
                      console.error("Error setting guest ID:", e);
                    }
                  }}
                  className="border border-gray-300 text-gray-700 w-full py-2 rounded-md font-medium"
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          </div>
        </SignedOut>
      </ClerkLoaded>
    </Route>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <EnhancedProtectedRoute path="/dashboard" component={Dashboard} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:slug" component={BlogPost} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  // Create a fallback to handle Clerk initialization failures
  const [clerkFailed, setClerkFailed] = useState(false);
  
  useEffect(() => {
    // Set up a global error listener to detect Clerk initialization failures
    const handleError = (event: ErrorEvent) => {
      if (event.error && 
          (event.error.toString().includes('Clerk') || 
           event.message?.includes('Clerk'))) {
        console.error('Detected Clerk error, activating guest mode fallback');
        setClerkFailed(true);
        
        // Ensure user can access the app by creating a guest ID
        if (!localStorage.getItem('guestId')) {
          localStorage.setItem('guestId', 'guest_' + Math.random().toString(36).substring(2, 15));
        }
      }
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  // If we detect a clerk failure but there's no guest ID yet, create one
  useEffect(() => {
    if (clerkFailed && !localStorage.getItem('guestId')) {
      localStorage.setItem('guestId', 'guest_' + Math.random().toString(36).substring(2, 15));
    }
  }, [clerkFailed]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <DebugEnvironment />
      {clerkFailed && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black p-2 z-50 text-center">
          Authentication service is currently unavailable. You're using guest mode.
        </div>
      )}
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
