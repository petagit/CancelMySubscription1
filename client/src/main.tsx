import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { ClerkErrorBoundary } from "./components/ClerkErrorBoundary";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// Get the publishable key (using dev key)
const clerkPubKey = import.meta.env.VITE_CLERK_DEV_PUBLISHABLE_KEY;
if (!clerkPubKey) {
  console.error("Missing VITE_CLERK_DEV_PUBLISHABLE_KEY in environment variables");
  // Continue anyway - our error handling will catch this and use guest mode
}

// Render the app with Clerk provider, error boundary, and BrowserRouter
createRoot(document.getElementById("root")!).render(
  <ClerkErrorBoundary>
    <BrowserRouter>
      <ClerkProvider publishableKey={clerkPubKey || "missing_key"}>
        <App />
      </ClerkProvider>
    </BrowserRouter>
  </ClerkErrorBoundary>
);
