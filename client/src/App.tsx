import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Layout from "@/components/Layout";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

// For development purposes, we'll bypass authentication
const isDevelopment = true;

function ProtectedDashboard() {
  // In development mode, render Dashboard without authentication
  if (isDevelopment) {
    return <Dashboard />;
  }
  
  // In production, require authentication
  return (
    <SignedIn>
      <Dashboard />
    </SignedIn>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard">
          <ProtectedDashboard />
        </Route>
        <Route path="/sign-in">
          {!isDevelopment && (
            <>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
              <SignedIn>
                <Route path="/dashboard" />
              </SignedIn>
            </>
          )}
          {isDevelopment && <Route path="/dashboard" />}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
