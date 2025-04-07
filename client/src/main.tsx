import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./index.css";

// Get publishable key
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 
                       import.meta.env.VITE_CLERK_DEV_PUBLISHABLE_KEY;

console.log("VITE_CLERK_PUBLISHABLE_KEY:", import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
console.log("VITE_CLERK_DEV_PUBLISHABLE_KEY:", import.meta.env.VITE_CLERK_DEV_PUBLISHABLE_KEY);

if (!publishableKey) {
  console.log("No Clerk publishable key found in environment variables");
  // Fetch from API endpoint
  fetch('/api/clerk-key')
    .then(res => res.json())
    .then(data => {
      if (data.key) {
        console.log("Using Clerk key from server:", data.key);
        // Render with ClerkProvider once we have the key
        createRoot(document.getElementById("root")!).render(
          <ClerkProvider 
            publishableKey={data.key}
            appearance={{
              baseTheme: undefined, // Use "dark" or undefined for light
              elements: {
                formButtonPrimary: "bg-black hover:bg-gray-800 text-white",
                card: "shadow-none"
              }
            }}
          >
            <App />
          </ClerkProvider>
        );
      } else {
        console.log("No Clerk key found from server, rendering without Clerk");
        createRoot(document.getElementById("root")!).render(<App />);
      }
    })
    .catch(err => {
      console.error("Error fetching Clerk key:", err);
      createRoot(document.getElementById("root")!).render(<App />);
    });
} else {
  console.log("Using Clerk with publishable key:", publishableKey);
  createRoot(document.getElementById("root")!).render(
    <ClerkProvider 
      publishableKey={publishableKey}
      appearance={{
        baseTheme: undefined, // Use "dark" or undefined for light
        elements: {
          formButtonPrimary: "bg-black hover:bg-gray-800 text-white",
          card: "shadow-none"
        }
      }}
    >
      <App />
    </ClerkProvider>
  );
}
