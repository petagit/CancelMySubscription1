import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CreditCard, AlertCircle, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        let url = "/api/subscription-status";
        if (guestId) url += `?guestId=${guestId}`;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (error) {
        console.error("Error fetching subscription status:", error);
      }
    };

    fetchSubscriptionStatus();
  }, [isSignedIn, userId, guestId]);

  const handleUpgrade = async () => {
    if (!isSignedIn) {
      toast({
        title: "Login Required",
        description: "You need to create an account to upgrade to premium.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        toast({
          title: "Error",
          description: "Failed to create checkout session",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Error",
        description: "Failed to create checkout session",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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
      <div className="bg-gray-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <Check className="h-5 w-5 text-green-500 mr-2" />
          <h3 className="text-lg font-medium text-green-700">Premium Plan</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          You have unlimited subscription tracking access.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Subscription Limit</h3>
        {isSignedIn && (
          <Button 
            size="sm" 
            onClick={handleUpgrade} 
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <CreditCard className="mr-2 h-4 w-4" /> 
            {isLoading ? "Loading..." : "Upgrade to Premium"}
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
          <p>Free accounts can track up to 10 subscriptions.</p>
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
            to upgrade to premium.
          </p>
        </div>
      )}
    </div>
  );
}