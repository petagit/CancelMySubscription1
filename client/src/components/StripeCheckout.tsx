import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Initialize Stripe with publishable key
const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Log the status of the Stripe key for debugging
console.log('Stripe key status:', {
  hasKey: !!STRIPE_KEY,
  keyPrefix: STRIPE_KEY ? STRIPE_KEY.substring(0, 5) + '...' : 'none'
});

// Load Stripe outside of component render to avoid recreating Stripe object on each render
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

interface StripeCheckoutProps {
  onSuccess: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

export default function StripeCheckout({ onSuccess, onCancel, isOpen }: StripeCheckoutProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Function to handle checkout
  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Creating checkout session...");
      
      // Create a checkout session via the server
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: 'premium',
        }),
      });
      
      const data = await response.json();
      console.log("Checkout session response:", data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create checkout session');
      }
      
      // If we get a Stripe checkout URL, redirect to it
      if (data.url) {
        console.log("Redirecting to Stripe checkout:", data.url);
        window.location.href = data.url;
        return;
      } else {
        throw new Error('No checkout URL returned from server');
      }
      
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred during payment');
      toast({
        title: 'Payment process failed',
        description: err.message || 'An error occurred during payment setup',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Payment unavailable message
  if (!stripePromise) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upgrade to Premium</DialogTitle>
            <DialogDescription>
              We're currently experiencing issues with our payment processor. Please try again later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-red-500 my-4 text-center">
            <p className="font-medium">Payment processing unavailable</p>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={onCancel}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade to Premium</DialogTitle>
          <DialogDescription>
            Get unlimited subscription tracking and more premium features
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-md">
          <div className="flex items-center mb-2">
            <Check className="h-5 w-5 text-green-500 mr-2" />
            <span className="font-medium">Premium Plan - $10/month</span>
          </div>
          <ul className="text-sm text-gray-600 space-y-2 mt-2">
            <li className="flex items-start">
              <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              <span>Unlimited subscriptions</span>
            </li>
            <li className="flex items-start">
              <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              <span>Priority support</span>
            </li>
            <li className="flex items-start">
              <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              <span>Advanced analytics</span>
            </li>
            <li className="flex items-start">
              <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              <span>Cancel assistance</span>
            </li>
          </ul>
        </div>
        
        {error && (
          <div className="text-red-500 text-sm my-2 p-2 bg-red-50 rounded-md">
            {error}
          </div>
        )}
        
        <div className="flex justify-between mt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleCheckout}
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Continue to Payment
              </>
            )}
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 mt-4 text-center">
          <p>Your card will be charged $10 immediately and then monthly.</p>
          <p>You can cancel your subscription at any time.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}