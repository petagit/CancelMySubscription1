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
import { useEffect } from "react";
import ProtectedRoute from "./lib/protected-route";

/**
 * Main App component
 */
function App() {
  // Initialize dev mode state and guest ID persistence
  useEffect(() => {
    // Check if dev mode is enabled
    const isDevMode = localStorage.getItem('devMode') === 'true';
    
    // Only clear guest data if not in dev mode
    if (!isDevMode) {
      // Check if there's already a guest ID - if not, don't remove it
      if (!localStorage.getItem('guestId')) {
        console.log("No guest ID found, nothing to remove");
      } else {
        // Only remove guest ID if not in dev mode
        localStorage.removeItem('guestId');
        const localStorageKeys = Object.keys(localStorage);
        localStorageKeys.forEach(key => {
          if (key.startsWith('guest_') || key.includes('subscription')) {
            localStorage.removeItem(key);
          }
        });
        console.log("Guest mode disabled - removed guest data");
      }
    } else {
      // In dev mode, ensure we have a guest ID
      if (!localStorage.getItem('guestId')) {
        const newGuestId = `guest_${Date.now()}`;
        localStorage.setItem('guestId', newGuestId);
        console.log(`Dev mode: created new guest ID ${newGuestId}`);
      } else {
        console.log("Dev mode enabled - keeping guest ID:", localStorage.getItem('guestId'));
      }
    }
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route element={<Layout />}>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/sign-in/*" element={<AuthPage defaultTab="sign-in" />} />
          <Route path="/sign-up/*" element={<AuthPage defaultTab="sign-up" />} />
          <Route path="/auth-error" element={<AuthError />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          
          {/* Protected routes using our custom ProtectedRoute component */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
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
