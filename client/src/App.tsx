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
  
  // Check for guest mode
  useEffect(() => {
    const hasGuestId = !!localStorage.getItem("guestId");
    setIsGuestUser(hasGuestId);
    setIsCheckingGuest(false);
  }, []);
  
  // If it's a guest user, grant access immediately
  if (isGuestUser) {
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
  
  // Otherwise, use Clerk's authentication
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
          <RedirectToSignIn />
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
  return (
    <QueryClientProvider client={queryClient}>
      <DebugEnvironment />
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
