import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { X } from "lucide-react";

/**
 * Simple debug panel that shows authentication states
 */
export default function SimpleDebugPanel() {
  const [isVisible, setIsVisible] = useState(true);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const [clerkErrors, setClerkErrors] = useState<string[]>([]);
  
  // Get auth state
  const { isLoaded, isSignedIn, userId } = useAuth();
  
  // Track guest ID and Clerk errors
  useEffect(() => {
    // Update guest ID from localStorage
    const updateGuestId = () => {
      setGuestId(localStorage.getItem("guestId"));
    };
    
    // Initial update
    updateGuestId();
    
    // Set up listener for localStorage changes
    window.addEventListener('storage', updateGuestId);
    
    // Track Clerk errors
    const handleError = (event: ErrorEvent) => {
      if (event.error && 
          (event.error.toString().includes('Clerk') || 
           event.message?.includes('Clerk'))) {
        setClerkErrors(prev => [...prev, event.error.toString()]);
      }
    };
    
    window.addEventListener('error', handleError);
    
    // Function to check for API errors
    const checkForErrors = () => {
      // Check recent fetch errors in the console
      const fetchErrors = (window as any).__DEBUG_FETCH_ERRORS || [];
      if (fetchErrors.length > 0) {
        setApiErrors(fetchErrors);
      }
    };
    
    // Check for errors periodically
    const intervalId = setInterval(checkForErrors, 2000);
    
    return () => {
      window.removeEventListener('storage', updateGuestId);
      window.removeEventListener('error', handleError);
      clearInterval(intervalId);
    };
  }, []);
  
  // Reset guest ID
  const resetGuestId = () => {
    localStorage.removeItem("guestId");
    const newGuestId = `guest_${Date.now()}`;
    localStorage.setItem("guestId", newGuestId);
    setGuestId(newGuestId);
    window.location.reload();
  };
  
  // Clear guest ID
  const clearGuestId = () => {
    localStorage.removeItem("guestId");
    setGuestId(null);
    window.location.reload();
  };
  
  // Toggle panel
  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-2 left-2 bg-purple-600 text-white px-3 py-1 text-xs rounded shadow-md z-50"
      >
        Debug
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-2 left-2 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50 text-sm font-mono w-80">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Debug Panel</h3>
        <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-white">
          <X size={18} />
        </button>
      </div>
      
      <div className="space-y-3">
        {/* Auth Status */}
        <section>
          <h4 className="font-semibold text-purple-300 border-b border-gray-600 pb-1 mb-1">Auth Status</h4>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <div className="text-gray-400">Clerk Loaded:</div>
            <div className={isLoaded ? "text-green-400" : "text-red-400"}>
              {isLoaded ? "Yes" : "No"}
            </div>
            
            <div className="text-gray-400">Signed In:</div>
            <div className={isSignedIn ? "text-green-400" : "text-yellow-400"}>
              {isSignedIn ? "Yes" : "No"}
            </div>
            
            <div className="text-gray-400">User ID:</div>
            <div className="text-white break-all text-xs">
              {isSignedIn ? userId || "Unknown" : "Not signed in"}
            </div>
            
            <div className="text-gray-400">Guest ID:</div>
            <div className="text-white break-all text-xs">
              {guestId || "Not using guest mode"}
            </div>
            
            <div className="text-gray-400">Mode:</div>
            <div className="text-white">
              {isSignedIn ? "Authenticated" : guestId ? "Guest" : "Not authenticated"}
            </div>
          </div>
        </section>
        
        {/* Actions */}
        <section>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={resetGuestId}
              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
            >
              Reset Guest ID
            </button>
            
            <button 
              onClick={clearGuestId}
              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
            >
              Clear Guest ID
            </button>
            
            <button 
              onClick={() => window.location.reload()}
              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
            >
              Reload Page
            </button>
          </div>
        </section>
        
        {/* API Errors */}
        {apiErrors.length > 0 && (
          <section>
            <h4 className="font-semibold text-red-300 border-b border-gray-600 pb-1 mb-1">API Errors</h4>
            <div className="text-red-400 text-xs overflow-auto max-h-20">
              {apiErrors.map((error, index) => (
                <div key={index} className="mb-1">
                  {error}
                </div>
              ))}
            </div>
            <button 
              onClick={() => setApiErrors([])}
              className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs mt-1"
            >
              Clear Errors
            </button>
          </section>
        )}
        
        {/* Clerk Errors */}
        {clerkErrors.length > 0 && (
          <section>
            <h4 className="font-semibold text-orange-300 border-b border-gray-600 pb-1 mb-1">Clerk Errors</h4>
            <div className="text-orange-400 text-xs overflow-auto max-h-20">
              {clerkErrors.map((error, index) => (
                <div key={index} className="mb-1">
                  {error}
                </div>
              ))}
            </div>
            <button 
              onClick={() => setClerkErrors([])}
              className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs mt-1"
            >
              Clear Errors
            </button>
          </section>
        )}
      </div>
    </div>
  );
}