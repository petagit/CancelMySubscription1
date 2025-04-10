import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Check, Loader2 } from 'lucide-react';

// Initialize Stripe with publishable key
const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Log the status of the Stripe key for debugging
console.log('Stripe key status:', {
  hasKey: !!STRIPE_KEY,
  keyPrefix: STRIPE_KEY ? STRIPE_KEY.substring(0, 5) + '...' : 'none'
});

const stripePromise = STRIPE_KEY 
  ? loadStripe(STRIPE_KEY)
  : null;

// Ensure Stripe is available or show error message
if (!STRIPE_KEY) {
  console.warn('Stripe publishable key not found. Payment features will be disabled.');
}

interface CheckoutFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

// Inner form component with Stripe hooks
function CheckoutForm({ onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useUser();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create checkout session on the server
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
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create checkout session');
      }
      
      // If we get a Stripe checkout URL, redirect to it
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      
      // If we get a session ID, confirm the payment
      if (data.sessionId) {
        const cardElement = elements.getElement(CardElement);
        
        if (!cardElement) {
          throw new Error('Card element not found');
        }
        
        // Confirm card payment
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
          data.clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: user?.fullName || user?.username || 'Customer',
                email: user?.primaryEmailAddress?.emailAddress,
              },
            },
          }
        );
        
        if (stripeError) {
          throw new Error(stripeError.message || 'Payment failed');
        }
        
        // Payment successful
        if (paymentIntent?.status === 'succeeded') {
          toast({
            title: 'Payment successful',
            description: 'You have successfully upgraded to Premium!',
          });
          onSuccess();
        } else {
          throw new Error('Payment status unknown');
        }
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred during payment');
      toast({
        title: 'Payment failed',
        description: err.message || 'An error occurred during payment',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-md bg-white">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
            hidePostalCode: true,
          }}
        />
      </div>
      
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
      
      <div className="flex space-x-2">
        <Button
          type="submit"
          disabled={!stripe || isLoading}
          className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay $10/month
            </>
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
      
      <div className="text-sm text-gray-500 mt-2">
        <p>Your card will be charged $10 immediately and then monthly.</p>
        <p>You can cancel your subscription at any time.</p>
      </div>
    </form>
  );
}

interface StripeCheckoutProps {
  onSuccess: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

export default function StripeCheckout({ onSuccess, onCancel, isOpen }: StripeCheckoutProps) {
  const { toast } = useToast();
  
  if (!isOpen) return null;
  
  // Show error message if Stripe is not available
  if (!stripePromise) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Upgrade to Premium</h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>
          
          <div className="text-red-500 mb-4">
            <p className="font-medium mb-2">Payment processing unavailable</p>
            <p className="text-sm">We're currently experiencing issues with our payment processor. Please try again later.</p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={onCancel} 
            className="w-full"
          >
            Close
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Upgrade to Premium</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
        
        <div className="mb-4 bg-gradient-to-r from-purple-50 to-indigo-50 p-3 rounded-md">
          <div className="flex items-center mb-2">
            <Check className="h-5 w-5 text-green-500 mr-2" />
            <span className="font-medium">Premium Plan - $10/month</span>
          </div>
          <ul className="text-sm text-gray-600 space-y-1 ml-7">
            <li className="flex items-start">
              <Check className="h-3 w-3 text-green-500 mr-1 mt-1" />
              <span>Unlimited subscriptions</span>
            </li>
            <li className="flex items-start">
              <Check className="h-3 w-3 text-green-500 mr-1 mt-1" />
              <span>Priority support</span>
            </li>
            <li className="flex items-start">
              <Check className="h-3 w-3 text-green-500 mr-1 mt-1" />
              <span>Advanced analytics</span>
            </li>
            <li className="flex items-start">
              <Check className="h-3 w-3 text-green-500 mr-1 mt-1" />
              <span>Cancel assistance</span>
            </li>
          </ul>
        </div>
        
        <Elements stripe={stripePromise}>
          <CheckoutForm onSuccess={onSuccess} onCancel={onCancel} />
        </Elements>
      </div>
    </div>
  );
}