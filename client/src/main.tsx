import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Temporarily disabled Clerk to fix authentication issues
console.log("Using standard authentication (Clerk temporarily disabled)");

createRoot(document.getElementById("root")!).render(<App />);
