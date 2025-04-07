import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { ClerkErrorBoundary } from "./components/ClerkErrorBoundary";
import App from "./App";
import "./index.css";

// Get the publishable key (using production key)
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!clerkPubKey) {
  console.error("Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables");
  // Continue anyway - our error handling will catch this and use guest mode
}

// Render the app with Clerk provider and error boundary
createRoot(document.getElementById("root")!).render(
  <ClerkErrorBoundary>
    <ClerkProvider publishableKey={clerkPubKey || "missing_key"}>
      <App />
    </ClerkProvider>
  </ClerkErrorBoundary>
);
