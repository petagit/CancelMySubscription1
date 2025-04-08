import { Routes, Route, useNavigate } from "react-router-dom";
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
import SimpleDebugPanel from "@/components/SimpleDebugPanel";
import { useState, useEffect } from "react";
import { 
  SignedIn, 
  SignedOut, 
  ClerkLoaded,
  ClerkLoading,
  useAuth as useClerkAuth
} from "@clerk/clerk-react";
// We no longer need the old AuthProvider
import { ProtectedRoute } from "./lib/protected-route";

// Protected route with fast guest mode fallback
function EnhancedProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useClerkAuth();
  
  // Check for guest ID
  const hasGuestId = !!localStorage.getItem("guestId");
  const [showLoader, setShowLoader] = useState(true);
  
  // Only show loading spinner briefly
  useEffect(() => {
    // If loading takes more than 1 second, stop showing the spinner
    const timeoutId = setTimeout(() => {
      setShowLoader(false);
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // If user is signed in or has a guest ID, show the content immediately
  if (isSignedIn || hasGuestId) {
    return <>{children}</>;
  }
  
  // If Clerk is still loading AND we haven't timed out the loader yet
  if (!isLoaded && showLoader) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-700" />
      </div>
    );
  }
  
  // Otherwise, show auth options
  return (
    <div className="flex flex-col items-center space-y-6 pt-10">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">Authentication Required</h2>
        <p className="mb-6 text-gray-600">
          Please sign in or continue as a guest to access this content.
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
              // Create a simple guest ID
              const guestId = `guest_${Date.now()}`;
              localStorage.setItem("guestId", guestId);
              console.log("Created guest ID:", guestId);
              // Navigate to dashboard without page reload
              navigate("/dashboard");
            }}
            className="border border-gray-300 text-gray-700 w-full py-2 rounded-md font-medium"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}

function Router() {
  // Using App Router pattern with nested routes and centralized layout
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        
        {/* Protected routes use EnhancedProtectedRoute as wrapper */}
        <Route path="/dashboard" element={
          <EnhancedProtectedRoute>
            <Dashboard />
          </EnhancedProtectedRoute>
        } />
        
        {/* Removed complex callback routes to simplify the flow */}
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function App() {
  // Auto-create a guest ID if none exists
  useEffect(() => {
    if (!localStorage.getItem('guestId')) {
      const newGuestId = `guest_${Date.now()}`;
      console.log("Creating default guest ID:", newGuestId);
      localStorage.setItem('guestId', newGuestId);
    }
  }, []);
  
  // Set up a timeout to detect Clerk initialization failures
  const [clerkFailed, setClerkFailed] = useState(false);
  const { isLoaded } = useClerkAuth();
  
  // Set a timeout to detect if Clerk is taking too long to load or failing
  useEffect(() => {
    // If Clerk doesn't load within 2 seconds, consider it failed
    const timeoutId = setTimeout(() => {
      if (!isLoaded) {
        console.log("Clerk failed to load in time, activating guest mode");
        setClerkFailed(true);
      }
    }, 2000);
    
    // If Clerk loads successfully, clear the timeout
    if (isLoaded) {
      clearTimeout(timeoutId);
    }
    
    // Also set up an error listener for explicit Clerk errors
    const handleError = (event: ErrorEvent) => {
      if (event.error && 
          (event.error.toString().includes('Clerk') || 
           event.message?.includes('Clerk'))) {
        console.error('Detected Clerk error, activating guest mode fallback');
        setClerkFailed(true);
      }
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('error', handleError);
    };
  }, [isLoaded]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <SimpleDebugPanel />
      {clerkFailed && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black p-2 z-50 text-center">
          Authentication service is unavailable. Using guest mode.
        </div>
      )}
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
