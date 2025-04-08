import { useNavigate } from "react-router-dom";
import { LogOut, RefreshCw, Home, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthError() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Create or reset guest ID
  const createGuestId = () => {
    // First, ensure we clear any existing guest data
    clearGuestData();
    
    // Then create a new guest ID
    const guestId = `guest_${Date.now()}`;
    localStorage.setItem("guestId", guestId);
    console.log("Created new guest ID for recovery:", guestId);
    
    toast({
      title: "Guest Mode Activated",
      description: "You're now using the app as a guest. Your data will be stored locally.",
    });
    
    navigate('/dashboard');
  };
  
  // Clear all guest data
  const clearGuestData = () => {
    try {
      // Clear any existing guest ID
      localStorage.removeItem("guestId");
      
      // Clear any subscription data stored in localStorage
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys.forEach(key => {
        if (key.startsWith('guest_') || key.includes('subscription')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log("Guest data cleared from local storage");
      
      toast({
        title: "Guest Data Cleared",
        description: "All guest data has been removed from your browser.",
      });
    } catch (error) {
      console.error("Error clearing guest data:", error);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Authentication Error</h2>
          <p className="mt-2 text-sm text-gray-600">
            We encountered an issue with the authentication service. You have a few options to continue:
          </p>
        </div>
        
        <div className="space-y-4 mt-6">
          <button
            onClick={() => navigate('/')}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <Home size={18} />
            <span>Return to Home Page</span>
          </button>
          
          <button
            onClick={() => window.location.href = '/auth'}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-white shadow-sm hover:bg-indigo-700"
          >
            <RefreshCw size={18} />
            <span>Try Authentication Again</span>
          </button>
          
          <button
            onClick={createGuestId}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-transparent bg-gray-800 px-4 py-3 text-white shadow-sm hover:bg-gray-900"
          >
            <LogOut size={18} />
            <span>Continue as Guest</span>
          </button>
          
          <button
            onClick={() => {
              clearGuestData();
              navigate('/');
            }}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-red-300 bg-white px-4 py-3 text-red-600 shadow-sm hover:bg-red-50"
          >
            <UserX size={18} />
            <span>Clear Guest Data & Log Out</span>
          </button>
        </div>
        
        <div className="mt-6 border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500">
            If you continue to experience issues, try clearing your browser cookies and cache, 
            or contact support for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}