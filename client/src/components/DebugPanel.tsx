import { useState, useEffect } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { queryClient } from "@/lib/queryClient";
import { X } from "lucide-react";

/**
 * Debug panel that shows authentication and data loading states
 * This is a developer tool to help debug issues with authentication and data loading
 */
export default function DebugPanel() {
  const [isVisible, setIsVisible] = useState(true);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<{
    stats: "loading" | "success" | "error" | "idle";
    subscriptions: "loading" | "success" | "error" | "idle";
  }>({
    stats: "idle",
    subscriptions: "idle"
  });
  const [lastApiError, setLastApiError] = useState<string | null>(null);
  
  // Get Clerk auth state
  const { isLoaded: clerkLoaded, isSignedIn, userId } = useClerkAuth();
  
  // Get query states
  useEffect(() => {
    // Check if we have a guest ID
    setGuestId(localStorage.getItem("guestId"));
    
    // Watch for query status changes
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      const queryKey = event.query.queryKey[0] as string;
      
      if (queryKey === "/api/stats") {
        if (event.type === "observerResultsUpdated") {
          setApiStatus(prev => ({
            ...prev,
            stats: event.query.getObserversCount() > 0 
              ? event.query.getState().status 
              : "idle"
          }));
          
          if (event.query.getState().error) {
            setLastApiError(event.query.getState().error as any);
          }
        }
      }
      
      if (queryKey === "/api/subscriptions") {
        if (event.type === "observerResultsUpdated") {
          setApiStatus(prev => ({
            ...prev,
            subscriptions: event.query.getObserversCount() > 0 
              ? event.query.getState().status 
              : "idle"
          }));
          
          if (event.query.getState().error) {
            setLastApiError(event.query.getState().error as any);
          }
        }
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Check for errors in active queries
  useEffect(() => {
    const queries = queryClient.getQueryCache().getAll();
    
    for (const query of queries) {
      if (query.state.error) {
        setLastApiError(query.state.error as any);
        break;
      }
    }
  }, [apiStatus]);
  
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
  
  // Manually run queries
  const runQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
  };
  
  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-2 left-2 bg-purple-600 text-white px-3 py-1 text-xs rounded shadow-md z-50"
      >
        Show Debug
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-2 left-2 right-2 md:right-auto md:w-96 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50 text-sm font-mono max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Debug Panel</h3>
        <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-white">
          <X size={18} />
        </button>
      </div>
      
      <div className="space-y-3">
        {/* Authentication Status */}
        <section>
          <h4 className="font-semibold text-purple-300 border-b border-gray-600 pb-1 mb-1">Authentication Status</h4>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <div className="text-gray-400">Clerk Loaded:</div>
            <div className={clerkLoaded ? "text-green-400" : "text-red-400"}>
              {clerkLoaded ? "✓" : "✗"}
            </div>
            
            <div className="text-gray-400">Signed In:</div>
            <div className={isSignedIn ? "text-green-400" : "text-yellow-400"}>
              {isSignedIn ? "✓" : "✗"}
            </div>
            
            <div className="text-gray-400">User ID:</div>
            <div className="text-white break-all">
              {isSignedIn ? userId || "Signed in" : "Not signed in"}
            </div>
            
            <div className="text-gray-400">Guest ID:</div>
            <div className="text-white break-all">
              {guestId || "No guest ID"}
            </div>
            
            <div className="text-gray-400">Auth Mode:</div>
            <div className="text-white">
              {isSignedIn ? "Clerk" : guestId ? "Guest" : "None"}
            </div>
          </div>
        </section>
        
        {/* API Status */}
        <section>
          <h4 className="font-semibold text-purple-300 border-b border-gray-600 pb-1 mb-1">API Status</h4>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <div className="text-gray-400">Stats API:</div>
            <div className={
              apiStatus.stats === "success" ? "text-green-400" : 
              apiStatus.stats === "loading" ? "text-yellow-400" : 
              apiStatus.stats === "error" ? "text-red-400" : 
              "text-gray-400"
            }>
              {apiStatus.stats}
            </div>
            
            <div className="text-gray-400">Subscriptions API:</div>
            <div className={
              apiStatus.subscriptions === "success" ? "text-green-400" : 
              apiStatus.subscriptions === "loading" ? "text-yellow-400" : 
              apiStatus.subscriptions === "error" ? "text-red-400" : 
              "text-gray-400"
            }>
              {apiStatus.subscriptions}
            </div>
          </div>
        </section>
        
        {/* Last Error */}
        {lastApiError && (
          <section>
            <h4 className="font-semibold text-red-300 border-b border-gray-600 pb-1 mb-1">Last Error</h4>
            <div className="text-red-400 text-xs overflow-auto max-h-20">
              {lastApiError.toString()}
            </div>
          </section>
        )}
        
        {/* Actions */}
        <section className="border-t border-gray-600 pt-2 mt-2">
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
              onClick={runQueries}
              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
            >
              Refresh Data
            </button>
            
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs"
            >
              Clear All & Reload
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}