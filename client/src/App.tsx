import { Routes, Route } from "react-router-dom";
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
import SimpleDebugPanel from "@/components/SimpleDebugPanel";
import { useEffect } from "react";
import { 
  SignedIn, 
  SignedOut, 
  RedirectToSignIn
} from "@clerk/clerk-react";

/**
 * Main App component
 */
function App() {
  // Clear any existing guest data to disable guest mode
  useEffect(() => {
    localStorage.removeItem('guestId');
    const localStorageKeys = Object.keys(localStorage);
    localStorageKeys.forEach(key => {
      if (key.startsWith('guest_') || key.includes('subscription')) {
        localStorage.removeItem(key);
      }
    });
    console.log("Guest mode disabled - removed guest data");
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <SimpleDebugPanel />
      <Routes>
        <Route element={<Layout />}>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/sign-in/*" element={<AuthPage defaultTab="sign-in" />} />
          <Route path="/sign-up/*" element={<AuthPage defaultTab="sign-up" />} />
          <Route path="/auth-error" element={<AuthError />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          
          {/* Protected routes using Clerk's built-in components - exactly like the example */}
          <Route 
            path="/dashboard" 
            element={
              <>
                <SignedIn>
                  <Dashboard />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } 
          />
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
