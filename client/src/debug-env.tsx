import { useEffect } from "react";

export default function DebugEnvironment() {
  useEffect(() => {
    console.log("VITE_CLERK_PUBLISHABLE_KEY:", import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
  }, []);
  
  return null;
}
