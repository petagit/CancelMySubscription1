import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/StatsCard";
import SubscriptionsList from "@/components/SubscriptionsList";
import AddSubscriptionDialog from "@/components/AddSubscriptionDialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import type { Subscription, InsertSubscription } from "@shared/schema";
import { exportToCSV, importFromCSV } from "@/lib/excel";
import { Download, Upload, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const [open, setOpen] = useState(false);
  const { isSignedIn } = useClerkAuth();
  const { user: clerkUser } = useUser();
  
  // Determine if we're using a guest ID or clerk authentication
  const isAuthenticated = isSignedIn && clerkUser;
  
  // Simple guest mode implementation
  const guestId = localStorage.getItem("guestId");
  
  // Build API query parameters
  const getQueryParams = () => {
    if (isAuthenticated) {
      return ""; // Authenticated user doesn't need guestId
    }
    
    // Guest user - if no guestId, create one now
    if (!guestId) {
      const newGuestId = `guest_${Date.now()}`;
      localStorage.setItem("guestId", newGuestId);
      return `?guestId=${encodeURIComponent(newGuestId)}`;
    }
    
    return `?guestId=${encodeURIComponent(guestId)}`;
  };
  
  // Get stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<{
    monthlySpending: number;
    yearlySpending: number;
    activeSubscriptions: number;
  }>({
    queryKey: ["/api/stats", isAuthenticated ? "authenticated" : guestId],
    queryFn: async () => {
      const response = await fetch(`/api/stats${getQueryParams()}`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    }
  });
  
  // Get subscriptions
  const { 
    data: subscriptions, 
    isLoading: isLoadingSubscriptions, 
    isError: isErrorSubscriptions
  } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions", isAuthenticated ? "authenticated" : guestId],
    queryFn: async () => {
      const response = await fetch(`/api/subscriptions${getQueryParams()}`);
      if (!response.ok) throw new Error("Failed to fetch subscriptions");
      return response.json();
    }
  });
  
  // Add subscription
  const addSubscriptionMutation = useMutation({
    mutationFn: async (newSubscription: Omit<InsertSubscription, "id" | "isActive">) => {
      console.log("Original new subscription data:", newSubscription);
      
      // Add guestId for unauthenticated users
      // Need to ensure proper types for database compatibility
      const subscriptionData = {
        ...newSubscription,
        // For authenticated users, we'll let the server determine userId from clerkUser
        // Don't try to convert clerkId to number as that causes issues
        userId: null, // Let the server handle this
        guestId: isAuthenticated ? null : guestId,
        // Ensure date is in correct format
        nextBillingDate: new Date(newSubscription.nextBillingDate || new Date())
      };
      
      console.log("Prepared subscription data:", subscriptionData);
      
      // For guest users, append the guestId as a query parameter
      const queryParams = isAuthenticated ? '' : getQueryParams();
      const url = `/api/subscriptions${queryParams}`;
      
      console.log("Request URL:", url);
      const res = await apiRequest("POST", url, subscriptionData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions", isAuthenticated ? "authenticated" : guestId] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats", isAuthenticated ? "authenticated" : guestId] });
      setOpen(false);
      toast({
        title: "Success",
        description: "Subscription added successfully",
      });
    },
    onError: (error: any) => {
      // Check if we received a proper error response from the server
      let errorMessage = "Failed to add subscription";
      
      try {
        // Try to parse the error response
        if (error.response) {
          const responseData = error.response.json();
          if (responseData && responseData.message) {
            errorMessage = responseData.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
      } catch (e) {
        console.error("Error parsing error response:", e);
      }
      
      // Show user-friendly message for guest limit
      if (errorMessage.toLowerCase().includes("guest users are limited")) {
        toast({
          title: "Guest Limit Reached",
          description: "You've reached the 5 subscription limit for guest users. Sign up for a free account to add more.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  });
  
  // Delete subscription
  const deleteSubscriptionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/subscriptions/${id}${getQueryParams()}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions", isAuthenticated ? "authenticated" : guestId] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats", isAuthenticated ? "authenticated" : guestId] });
      toast({
        title: "Success",
        description: "Subscription deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete subscription",
        variant: "destructive",
      });
    }
  });

  const handleAddSubscription = (data: any) => {
    addSubscriptionMutation.mutate(data);
  };

  const handleDeleteSubscription = (id: number) => {
    deleteSubscriptionMutation.mutate(id);
  };

  // Default values for stats
  const defaultStats = {
    monthlySpending: 0,
    yearlySpending: 0,
    activeSubscriptions: 0
  };

  // Use real data or defaults
  const statsData = stats || defaultStats;
  const subscriptionsList = subscriptions || [];
  
  // Check if guest user is approaching subscription limit
  const isGuestUser = !isAuthenticated;
  const isApproachingLimit = isGuestUser && subscriptionsList.length >= 3; // Show warning at 3+ subscriptions
  const hasReachedLimit = isGuestUser && subscriptionsList.length >= 5;

  // Import/Export functions
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportCSV = () => {
    if (subscriptionsList.length === 0) {
      toast({
        title: "No data to export",
        description: "Add some subscriptions first",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Exporting subscriptions:", subscriptionsList);
    const result = exportToCSV(subscriptionsList, "cancelmysubs-export");
    
    if (result) {
      toast({
        title: "Export successful",
        description: "Your subscriptions have been exported to CSV",
      });
    }
    // If export fails, the exportToCSV function will show an alert
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const importedSubscriptions = await importFromCSV(file);
      
      // Prepare subscriptions with the right identifiers
      const preparedSubscriptions = importedSubscriptions.map(sub => {
        if (isAuthenticated && clerkUser) {
          // For authenticated users, use numeric userId for database compatibility
          // Need to convert the string ID to a number, fallback to 0 if conversion fails
          const numericUserId = parseInt(clerkUser.id, 10) || 0;
          return {
            ...sub,
            userId: numericUserId,
            guestId: null
          };
        } else {
          // For guest users, add guestId
          return {
            ...sub,
            userId: null,
            guestId: guestId
          };
        }
      });
      
      // Confirm import
      if (preparedSubscriptions.length > 0) {
        const confirmImport = window.confirm(
          `Import ${preparedSubscriptions.length} subscriptions?`
        );
        
        if (confirmImport) {
          // Add each subscription
          let successCount = 0;
          
          for (const sub of preparedSubscriptions) {
            try {
              // Format the data for API call
              const subData = {
                name: sub.name || '',
                amount: sub.amount || '0',
                billingCycle: sub.billingCycle || 'monthly',
                nextBillingDate: sub.nextBillingDate || new Date(),
                category: sub.category || 'Other',
                userId: sub.userId,
                guestId: sub.guestId,
                cancelUrl: sub.cancelUrl || null
              };
              
              await addSubscriptionMutation.mutateAsync(subData);
              successCount++;
            } catch (error) {
              console.error("Failed to import subscription:", error);
            }
          }
          
          toast({
            title: "Import successful",
            description: `Imported ${successCount} out of ${preparedSubscriptions.length} subscriptions`,
          });
        }
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: error as string,
        variant: "destructive",
      });
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Guest user warning banner */}
      {isApproachingLimit && !hasReachedLimit && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded shadow">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>
              <span className="font-bold">Guest mode: </span>
              You're using {subscriptionsList.length} of 5 available subscriptions. 
              <a href="/auth" className="underline ml-1 font-medium">
                Sign up for free
              </a> to add unlimited subscriptions.
            </p>
          </div>
        </div>
      )}
      
      {/* When limit is reached */}
      {hasReachedLimit && (
        <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-6 rounded shadow">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>
              <span className="font-bold">Guest mode limit reached: </span>
              You've used all 5 available guest subscriptions. 
              <a href="/auth" className="underline ml-1 font-medium">
                Sign up for free
              </a> to add more.
            </p>
          </div>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard 
          title="Monthly Spending" 
          value={isLoadingStats ? "$0.00" : `$${statsData.monthlySpending.toFixed(2)}`} 
        />
        
        <StatsCard 
          title="Yearly Spending" 
          value={isLoadingStats ? "$0.00" : `$${statsData.yearlySpending.toFixed(2)}`} 
        />
        
        <StatsCard 
          title="Active Subscriptions" 
          value={isLoadingStats ? "0" : statsData.activeSubscriptions.toString()} 
        />
      </div>
      
      {/* Subscriptions */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-black">Your Subscriptions</h2>
          
          <div className="flex space-x-2">
            <Button 
              onClick={handleExportCSV}
              variant="outline" 
              className="border-white text-white hover:bg-gray-800 bg-black"
              title="Export to CSV"
            >
              <Download className="h-4 w-4 mr-2" />
              EXPORT CSV
            </Button>
            
            <Button 
              onClick={handleImportClick}
              variant="outline"
              className="border-white text-white hover:bg-gray-800 bg-black"
              title="Import from CSV"
            >
              <Upload className="h-4 w-4 mr-2" />
              IMPORT CSV
            </Button>
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportCSV}
              accept=".csv"
              className="hidden"
            />
          </div>
        </div>
        
        <SubscriptionsList 
          subscriptions={subscriptionsList} 
          isLoading={isLoadingSubscriptions}
          isError={isErrorSubscriptions}
          onDelete={handleDeleteSubscription}
        />
        
        <div className="flex justify-center mt-8">
          <Button 
            onClick={() => setOpen(true)}
            className="bg-black text-white font-bold py-3 px-8 rounded-md hover:bg-gray-800 transition duration-300"
            disabled={hasReachedLimit}
            title={hasReachedLimit ? "Guest users are limited to 5 subscriptions" : "Add a new subscription"}
          >
            {hasReachedLimit ? "LIMIT REACHED - SIGN UP FOR MORE" : "ADD NEW SUBSCRIPTION"}
          </Button>
        </div>
      </div>
      
      {/* Add Subscription Dialog */}
      <AddSubscriptionDialog 
        open={open} 
        onOpenChange={setOpen}
        onSubmit={handleAddSubscription}
      />
    </div>
  );
}
