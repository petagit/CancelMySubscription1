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
  
  // Use persistent guest ID for unauthenticated users
  const [guestId, setGuestId] = useState<string>(() => {
    // Try to get from localStorage first
    const storedGuestId = localStorage.getItem("guestId");
    if (storedGuestId) return storedGuestId;
    
    // Create a new guestId if none exists
    const newGuestId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("guestId", newGuestId);
    return newGuestId;
  });
  
  // Build API query parameters
  const getQueryParams = () => {
    if (isAuthenticated) return ""; // Authenticated user doesn't need guestId
    return `?guestId=${guestId}`; // Guest user needs guestId
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
      // Add guestId for unauthenticated users
      const subscriptionData = {
        ...newSubscription,
        guestId: isAuthenticated ? null : guestId // Only use guestId for unauthenticated users
      };
      
      const res = await apiRequest("POST", "/api/subscriptions", subscriptionData);
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
      toast({
        title: "Error",
        description: error.message || "Failed to add subscription",
        variant: "destructive",
      });
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
          // For authenticated users, add userId
          return {
            ...sub,
            userId: clerkUser.id,
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
          >
            ADD NEW SUBSCRIPTION
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
