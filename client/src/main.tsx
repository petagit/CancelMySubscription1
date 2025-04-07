import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { ClerkErrorBoundary } from "./components/ClerkErrorBoundary";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// Get the publishable key (trying production first, fallback to dev)
const prodKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const devKey = import.meta.env.VITE_CLERK_DEV_PUBLISHABLE_KEY;
const clerkPubKey = prodKey || devKey;

// Log the environment keys for debugging
console.log("VITE_CLERK_PUBLISHABLE_KEY:", prodKey);
console.log("Current environment keys loaded:", {
  dev: devKey,
  prod: prodKey
});
console.log("VITE_CLERK_DEV_PUBLISHABLE_KEY:", devKey);

if (!clerkPubKey) {
  console.error("Missing Clerk publishable key in environment variables");
  // Continue anyway - our error handling will catch this and use guest mode
}

// Define Clerk routing configuration
const clerkConfig = {
  // Use path-based routing
  routerType: "path",
  
  // Define specific paths for authentication
  signInPath: "/auth",
  signUpPath: "/auth",
  
  // Define where to redirect after auth actions (updated props per Clerk docs)
  fallbackRedirectUrl: "/dashboard",
  forceRedirectUrl: "/dashboard",
  
  // Customize the navigation to use our app's routing
  navigate: (to: string) => {
    console.log("Clerk navigating to:", to);
    window.location.href = to;
  }
};

// Render the app with Clerk provider, error boundary, and BrowserRouter
// Note: ClerkProvider needs to be inside BrowserRouter for proper integration
createRoot(document.getElementById("root")!).render(
  <ClerkErrorBoundary>
    <BrowserRouter>
      <ClerkProvider 
        publishableKey={clerkPubKey || "missing_key"}
        {...clerkConfig}
      >
        <App />
      </ClerkProvider>
    </BrowserRouter>
  </ClerkErrorBoundary>
);
