import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Simple rendering without Clerk
console.log("Using guest mode only (Clerk dependency removed)");
createRoot(document.getElementById("root")!).render(<App />);
