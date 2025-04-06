import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { useState, useEffect } from "react";
import App from "./App";
import "./index.css";

// Component to handle loading Clerk key and initializing the app
function ClerkRoot() {
  const [clerkKey, setClerkKey] = useState("");
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Try to get the key from environment first
    const envKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
    
    // If environment variable is available, use it
    if (envKey) {
      console.log("Using Clerk key from environment");
      setClerkKey(envKey);
      setLoading(false);
      return;
    }
    
    // Otherwise fallback to hardcoded key
    const hardcodedKey = "pk_test_Z2xvcmlvdXMtc3R1ZC00MS5jbGVyay5hY2NvdW50cy5kZXYk";
    console.log("Using hardcoded Clerk key");
    setClerkKey(hardcodedKey);
    setLoading(false);
  }, []);
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading authentication...</div>;
  }
  
  return (
    <ClerkProvider 
      publishableKey={clerkKey}
      appearance={{
        baseTheme: dark,
        elements: {
          card: "bg-white text-black",
          navbar: "bg-black text-white",
          footer: "bg-black text-white"
        }
      }}
    >
      <App />
    </ClerkProvider>
  );
}

createRoot(document.getElementById("root")!).render(<ClerkRoot />);
