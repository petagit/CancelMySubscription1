import { useEffect } from "react";

export default function DebugEnvironment() {
  useEffect(() => {
    console.log("VITE_CLERK_DEV_PUBLISHABLE_KEY:", import.meta.env.VITE_CLERK_DEV_PUBLISHABLE_KEY || "not set");
    console.log("Current environment keys loaded:", {
      dev: import.meta.env.VITE_CLERK_DEV_PUBLISHABLE_KEY || "not set",
      prod: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "not set"
    });
  }, []);
  
  return null;
}
