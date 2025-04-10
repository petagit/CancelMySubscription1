import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CreditCard, AlertCircle, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StripeCheckout from "./StripeCheckout";

interface SubscriptionLimitProps {
  guestId?: string;
}

interface SubscriptionStatus {
  subscriptionCount: number;
  subscriptionLimit: number;
  isPremium: boolean;
  remainingSubscriptions: number;
}

export default function SubscriptionLimit({ guestId }: SubscriptionLimitProps) {
  const { isSignedIn, userId } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        // Always ensure we have a URL parameter, either from auth or guestId
        let url = "/api/subscription-status";
        
        // Check for dev mode
        const isDevMode = localStorage.getItem("devMode") === "true";
        
        if (guestId) {
          url += `?guestId=${guestId}`;
          // Add dev mode param if needed
          if (isDevMode) {
            url += `&devMode=true`;
          }
        } else if (!isSignedIn) {
          // For users who aren't signed in and don't have a guestId, create one
          const newGuestId = `guest_${Date.now()}`;
          localStorage.setItem("guestId", newGuestId);
          url += `?guestId=${newGuestId}`;
          // Add dev mode param if needed
          if (isDevMode) {
            url += `&devMode=true`;
          }
        } else {
          // For signed in users, just add dev mode if needed
          if (isDevMode) {
            url += `?devMode=true`;
          }
        }
        
        console.log('Fetching subscription status from:', url);
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Subscription status data:', data);
          setStatus(data);
        } else {
          const errorText = await response.text();
          console.error('Subscription status error:', response.status, errorText);
        }
      } catch (error) {
        console.error("Error fetching subscription status:", error);
      }
    };

    fetchSubscriptionStatus();
  }, [isSignedIn, userId, guestId]);

  const handleUpgrade = () => {
    if (!isSignedIn) {
      toast({
        title: "Login Required",
        description: "You need to create an account to upgrade to premium.",
        variant: "destructive"
      });
      return;
    }
    
    // Show the Stripe checkout component
    setShowStripeCheckout(true);
  };
  
  const handleCheckoutSuccess = () => {
    setShowStripeCheckout(false);
    // Refresh subscription status
    window.location.reload();
  };
  
  const handleCheckoutCancel = () => {
    setShowStripeCheckout(false);
  };

  if (!status) return null;

  // Calculate progress
  const progressPercentage = Math.min(
    Math.round((status.subscriptionCount / status.subscriptionLimit) * 100),
    100
  );

  // Show different content based on whether user is premium or not
  if (status.isPremium) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex items-center">
          <Check className="h-5 w-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-medium text-indigo-700">Premium Plan Active</h3>
        </div>
        <div className="mt-2 flex items-center">
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              You have unlimited subscription tracking access. Thank you for being a premium member!
            </p>
            <ul className="mt-2 text-sm text-gray-600 space-y-1">
              <li className="flex items-center">
                <Check className="h-3 w-3 text-green-500 mr-1" /> Unlimited subscriptions
              </li>
              <li className="flex items-center">
                <Check className="h-3 w-3 text-green-500 mr-1" /> Priority support
              </li>
              <li className="flex items-center">
                <Check className="h-3 w-3 text-green-500 mr-1" /> Advanced analytics
              </li>
            </ul>
          </div>
          <div className="ml-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
            $10/month
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border rounded-lg p-4 mb-4">
      <div className="flex flex-wrap justify-between items-start">
        <div>
          <h3 className="text-lg font-medium">Free Plan</h3>
          <p className="text-sm text-gray-600">Limited to {status.subscriptionLimit} subscriptions</p>
          <ul className="mt-2 text-sm text-gray-600 space-y-1">
            <li className="flex items-center">
              <Check className="h-3 w-3 text-green-500 mr-1" /> Track up to {status.subscriptionLimit} subscriptions
            </li>
            <li className="flex items-center">
              <Check className="h-3 w-3 text-green-500 mr-1" /> Basic analytics
            </li>
            <li className="flex items-center">
              <Check className="h-3 w-3 text-green-500 mr-1" /> CSV import/export
            </li>
          </ul>
        </div>
        {isSignedIn && (
          <Button 
            size="sm" 
            onClick={handleUpgrade} 
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 whitespace-nowrap mt-2 md:mt-0"
          >
            <CreditCard className="mr-2 h-4 w-4" /> 
            {isLoading ? "Loading..." : "Upgrade to Premium ($10/month)"}
          </Button>
        )}
      </div>
      
      <div className="mt-2">
        <div className="flex justify-between text-sm mb-1">
          <span>{status.subscriptionCount} of {status.subscriptionLimit} subscriptions</span>
          <span>{status.remainingSubscriptions} remaining</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>
      
      {status.remainingSubscriptions <= 2 && (
        <div className="flex items-center mt-3 text-amber-700 text-sm">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>
            {status.remainingSubscriptions === 0 
              ? "You've reached your subscription limit. Upgrade for unlimited tracking."
              : `You're almost at your limit. Consider upgrading to premium.`
            }
          </span>
        </div>
      )}
      
      {!isSignedIn && (
        <div className="mt-2 text-sm text-gray-600">
          <p>Guest accounts are limited to 5 subscriptions. Sign up for a free account to get 10 subscriptions.</p>
          <p>
            <Button 
              variant="link" 
              className="h-auto p-0 text-indigo-600"
              onClick={() => window.location.href = "/sign-in"}
            >
              Sign in
            </Button>{" "}
            or{" "}
            <Button 
              variant="link" 
              className="h-auto p-0 text-indigo-600"
              onClick={() => window.location.href = "/sign-up"}
            >
              create an account
            </Button>{" "}
            to access more features. Upgrade to premium ($10/month) for unlimited subscriptions.
          </p>
        </div>
      )}
      
      {/* Stripe Checkout Modal */}
      <StripeCheckout 
        isOpen={showStripeCheckout}
        onSuccess={handleCheckoutSuccess}
        onCancel={handleCheckoutCancel}
      />
    </div>
  );
}