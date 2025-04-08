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

// Simple Clerk configuration matching the example
const clerkConfig = {
  // Basic routing configuration
  signInUrl: "/sign-in",
  signUpUrl: "/sign-up",
  // This is the correct prop to use based on Clerk warnings
  fallbackRedirectUrl: "/dashboard"
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
