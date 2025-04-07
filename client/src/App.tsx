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
import { SignedIn, SignedOut, RedirectToSignIn, useClerk } from "@clerk/clerk-react";
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
  // The ClerkProvider is now in main.tsx
  return (
    <QueryClientProvider client={queryClient}>
      <DebugEnvironment />
      <ClerkErrorBoundary>
        <Router />
        <Toaster />
      </ClerkErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
