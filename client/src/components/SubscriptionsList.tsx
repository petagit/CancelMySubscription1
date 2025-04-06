import { Button } from "@/components/ui/button";
import SubscriptionItem from "./SubscriptionItem";
import { exportToCSV } from "@/lib/excel";
import { Subscription } from "@shared/schema";
import { useState } from "react";

interface SubscriptionsListProps {
  subscriptions: Subscription[];
  isLoading: boolean;
  isError: boolean;
  onDelete: (id: number) => void;
}

export default function SubscriptionsList({ 
  subscriptions, 
  isLoading, 
  isError,
  onDelete
}: SubscriptionsListProps) {
  const handleExportToExcel = () => {
    exportToCSV(subscriptions, "subscriptions");
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg text-center">
        <p className="text-lg mb-4">Loading your subscriptions...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-error text-errorText p-4 rounded-lg mb-6">
        Error: Failed to fetch subscriptions (500)
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg text-center">
        <p className="text-lg mb-4">You haven't added any subscriptions yet.</p>
        <p className="text-sm text-gray-500">Add your first subscription to start tracking your spending.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4 mb-4">
        {subscriptions.map((subscription) => (
          <SubscriptionItem 
            key={subscription.id} 
            subscription={subscription}
            onDelete={onDelete} 
          />
        ))}
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={handleExportToExcel}
          variant="outline"
          className="border-white text-white hover:bg-gray-800 bg-black"
        >
          EXPORT TO EXCEL
        </Button>
      </div>
    </div>
  );
}
