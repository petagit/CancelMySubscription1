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

// Define Clerk routing configuration using Clerk's best practices
const clerkConfig = {
  // Use hash-based routing (based on the working implementation)
  routerType: "hash",
  
  // Define redirect routes
  signInUrl: "#/auth",
  signUpUrl: "#/auth",
  
  // According to latest Clerk docs
  // This URL takes precedence over all other redirect URLs
  forceRedirectUrl: "#/dashboard", 
  
  // Fallback redirect as a safety net
  fallbackRedirectUrl: "#/dashboard",
  
  // Add allowed domains to prevent authorization_invalid errors
  allowedRedirectOrigins: [
    window.location.origin,
    "https://clerk.cancelmysub.app",
    "http://localhost:5000"
  ],
  
  // Make sure we're not using any deprecated properties
  // redirectUrl is deprecated, we're using forceRedirectUrl and fallbackRedirectUrl instead
};

// Render the app with Clerk provider, error boundary, and BrowserRouter
// Note: ClerkProvider needs to be inside BrowserRouter for proper integration
// This pattern matches your working app's structure
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ClerkProvider 
      publishableKey={clerkPubKey || "missing_key"}
      {...clerkConfig}
    >
      <ClerkErrorBoundary>
        <App />
      </ClerkErrorBoundary>
    </ClerkProvider>
  </BrowserRouter>
);
