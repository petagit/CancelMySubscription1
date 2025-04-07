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
import React, { useEffect } from "react";
import { SWRConfig } from "swr";

// Simple protected route that redirects to auth if not in guest mode
function GuestProtectedRoute({ path, component: Component }: { path: string, component: React.ComponentType<any> }) {
  const [, navigate] = useLocation();

  useEffect(() => {
    const hasGuestId = !!localStorage.getItem("guestId");
    if (!hasGuestId) {
      navigate("/auth");
    }
  }, [navigate]);

  const hasGuestId = !!localStorage.getItem("guestId");
  if (!hasGuestId) {
    return <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-gray-700" />
    </div>;
  }
  
  return (
    <Route path={path} component={Component} />
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <GuestProtectedRoute path="/dashboard" component={Dashboard} />
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
    <SWRConfig value={{ provider: () => new Map() }}>
      <QueryClientProvider client={queryClient}>
        <DebugEnvironment />
        <Router />
        <Toaster />
      </QueryClientProvider>
    </SWRConfig>
  );
}

export default App;
