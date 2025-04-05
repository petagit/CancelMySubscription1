import { useState } from "react";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/StatsCard";
import SubscriptionsList from "@/components/SubscriptionsList";
import AddSubscriptionDialog from "@/components/AddSubscriptionDialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Subscription } from "@shared/schema";

export default function Dashboard() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  
  // Get stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<{
    monthlySpending: number;
    yearlySpending: number;
    activeSubscriptions: number;
  }>({
    queryKey: ["/api/stats"],
    enabled: !!user,
  });
  
  // Get subscriptions
  const { 
    data: subscriptions, 
    isLoading: isLoadingSubscriptions, 
    isError: isErrorSubscriptions
  } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
    enabled: !!user,
  });
  
  // Add subscription
  const addSubscriptionMutation = useMutation({
    mutationFn: async (newSubscription: Omit<Subscription, "id" | "isActive" | "userId">) => {
      const res = await apiRequest("POST", "/api/subscriptions", newSubscription);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
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
      await apiRequest("DELETE", `/api/subscriptions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
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
        <h2 className="text-xl font-bold text-white mb-4">Your Subscriptions</h2>
        
        <SubscriptionsList 
          subscriptions={subscriptionsList} 
          isLoading={isLoadingSubscriptions}
          isError={isErrorSubscriptions}
          onDelete={handleDeleteSubscription}
        />
        
        <div className="flex justify-center mt-8">
          <Button 
            onClick={() => setOpen(true)}
            className="bg-black border-2 border-white text-white font-bold py-3 px-8 rounded-md hover:bg-gray-800 transition duration-300"
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
