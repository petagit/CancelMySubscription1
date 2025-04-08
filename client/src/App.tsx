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
import AuthError from "@/pages/AuthError";
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

// Protected route without guest mode
function EnhancedProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useClerkAuth();
  
  const [showLoader, setShowLoader] = useState(true);
  
  // Only show loading spinner briefly
  useEffect(() => {
    // If loading takes more than 1 second, stop showing the spinner
    const timeoutId = setTimeout(() => {
      setShowLoader(false);
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // If user is signed in, show the content immediately
  if (isSignedIn) {
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
  
  // Otherwise, redirect to auth
  return (
    <div className="flex flex-col items-center space-y-6 pt-10">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">Authentication Required</h2>
        <p className="mb-6 text-gray-600">
          Please sign in to access this content.
        </p>
        
        <div className="flex flex-col space-y-4">
          <button 
            onClick={() => navigate("/auth")}
            className="bg-black text-white w-full py-2 rounded-md font-medium"
          >
            Sign In
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
        <Route path="/auth-error" element={<AuthError />} />
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

/**
 * Main App component
 */
function App() {
  // Clear any existing guest data to disable guest mode
  useEffect(() => {
    // Remove any guest mode data
    localStorage.removeItem('guestId');
    
    // Clear any other subscription data
    const localStorageKeys = Object.keys(localStorage);
    localStorageKeys.forEach(key => {
      if (key.startsWith('guest_') || key.includes('subscription')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log("Guest mode disabled - removed guest data");
  }, []);
  
  // Set up a timeout to detect Clerk initialization failures
  const [clerkFailed, setClerkFailed] = useState(false);
  const { isLoaded } = useClerkAuth();
  
  // Set a timeout to detect if Clerk is taking too long to load or failing
  useEffect(() => {
    // If Clerk doesn't load within 2 seconds, consider it failed
    const timeoutId = setTimeout(() => {
      if (!isLoaded) {
        console.log("Clerk failed to load in time");
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
        console.error('Detected Clerk error');
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
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-2 z-50 text-center flex items-center justify-center">
          <span>Authentication service is unavailable. Please try again later.</span>
          <button 
            onClick={() => window.location.href = '/'}
            className="ml-4 bg-black text-white px-3 py-1 rounded text-sm"
          >
            Return Home
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="ml-2 bg-white text-black px-3 py-1 rounded text-sm"
          >
            Retry
          </button>
        </div>
      )}
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
