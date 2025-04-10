import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
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

if (!clerkPubKey) {
  console.error("Missing Clerk publishable key in environment variables");
}

// Updated Clerk configuration using exactly the recommended props
const clerkConfig = {
  // Basic routing configuration
  signInUrl: "/sign-in",
  signUpUrl: "/sign-up",
  // Using the exact properties mentioned in the Clerk warning
  fallbackRedirectUrl: "/dashboard", 
  afterSignOutUrl: "/",
  // Fix for the "Invalid HTTP Origin header" error in development
  localization: {
    socialButtonsBlockButton: "Continue with {{provider}}"
  },
  // Allow Replit domains
  developerData: {
    allowedRedirectOrigins: [
      /^https:\/\/.*\.replit\.dev$/,
      /^https:\/\/.*\.repl\.co$/,
      window.location.origin
    ]
  }
};

// Render the app with Clerk provider and BrowserRouter 
// exactly matching the example
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ClerkProvider 
      publishableKey={clerkPubKey || ""}
      {...clerkConfig}
    >
      <App />
    </ClerkProvider>
  </BrowserRouter>
);
