import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Subscription } from "@shared/schema";
import { formatDate } from "@/lib/utils";

interface SubscriptionItemProps {
  subscription: Subscription;
  onDelete: (id: number) => void;
}

export default function SubscriptionItem({ subscription, onDelete }: SubscriptionItemProps) {
  const { id, name, amount, billingCycle, nextBillingDate, category, cancelUrl } = subscription;
  
  const formatAmount = () => {
    return `$${Number(amount).toFixed(2)}/${billingCycle.slice(0, 2)}`;
  };
  
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this subscription?")) {
      onDelete(id);
    }
  };
  
  return (
    <div className="bg-white p-4 rounded-lg flex justify-between items-center">
      <div>
        <h3 className="font-medium">{name}</h3>
        <p className="text-sm text-gray-500">{formatAmount()} - Next billing: {formatDate(new Date(nextBillingDate))}</p>
        <p className="text-xs text-gray-400">Category: {category}</p>
      </div>
      <div className="flex items-center space-x-2">
        {cancelUrl && (
          <a 
            href={cancelUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Cancel Link
          </a>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-red-600 hover:text-red-800 hover:bg-red-50"
          onClick={handleDelete}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
