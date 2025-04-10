import Stripe from "stripe";
import { storage } from "./storage";

// Initialize Stripe with the secret key
let isStripeAvailable = true;
let stripeInstance: Stripe | null = null;

try {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY not found. Payment features will be disabled.');
    isStripeAvailable = false;
  } else {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log('Stripe initialized successfully.');
  }
} catch (error) {
  console.error('Failed to initialize Stripe:', error);
  isStripeAvailable = false;
}

// Create a dummy Stripe instance if needed
const stripe = stripeInstance || {
  customers: {
    create: async () => {
      console.warn('Stripe payments disabled: Missing API key');
      return { id: 'dummy_customer_id' };
    }
  },
  checkout: {
    sessions: {
      create: async () => {
        console.warn('Stripe payments disabled: Missing API key');
        return { 
          id: 'dummy_session_id',
          url: '/dashboard?stripe=disabled'
        };
      }
    }
  }
} as unknown as Stripe;

// Helper to check if Stripe is available
export const isStripeEnabled = () => isStripeAvailable;

// Available subscription plans
export const SUBSCRIPTION_PLANS = {
  PREMIUM: {
    name: "Premium Plan",
    price: 10, // $10/month
    maxSubscriptions: 999, // Unlimited for practical purposes
    features: [
      "Unlimited subscription tracking",
      "Priority support",
      "Advanced analytics",
      "CSV export & import"
    ]
  }
};

// Create a new customer in Stripe
export async function createStripeCustomer(userId: number, email: string, name?: string) {
  try {
    const customer = await stripe.customers.create({
      email,
      name: name || email,
      metadata: {
        userId: userId.toString()
      }
    });
    
    // Update user with Stripe customer ID
    await storage.updateUser(userId, {
      stripeCustomerId: customer.id
    });
    
    return customer;
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    throw error;
  }
}

// Create a checkout session for subscription
export async function createCheckoutSession(
  userId: number, 
  email: string,
  customerName?: string,
  successUrl = `${process.env.APP_URL || ""}/dashboard?payment=success`,
  cancelUrl = `${process.env.APP_URL || ""}/dashboard?payment=canceled`
) {
  try {
    // Get or create customer
    let stripeCustomerId: string;
    const user = await storage.getUser(userId);
    
    if (user?.stripeCustomerId) {
      stripeCustomerId = user.stripeCustomerId;
    } else {
      const customer = await createStripeCustomer(userId, email, customerName);
      stripeCustomerId = customer.id;
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: SUBSCRIPTION_PLANS.PREMIUM.name,
              description: "Unlimited subscription tracking",
            },
            unit_amount: SUBSCRIPTION_PLANS.PREMIUM.price * 100, // In cents
            recurring: {
              interval: "month"
            }
          },
          quantity: 1
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId.toString()
      }
    });
    
    // Create payment record
    await storage.createPayment({
      userId,
      stripeCustomerId,
      stripeSessionId: session.id,
      amount: SUBSCRIPTION_PLANS.PREMIUM.price,
      status: "pending",
      planType: "premium"
    });
    
    return session;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}

// Handle webhook events from Stripe
export async function handleStripeWebhook(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSuccessfulPayment(session);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleCanceledSubscription(subscription);
        break;
      }
      // More event types can be handled here
    }
  } catch (error) {
    console.error("Error handling webhook event:", error);
    throw error;
  }
}

// Handle successful payment
async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const userId = Number(session.metadata?.userId);
  
  if (!userId) {
    console.error("No user ID in session metadata");
    return;
  }
  
  // Update user to premium
  await storage.updateUser(userId, {
    hasPaidPlan: true,
    maxSubscriptions: SUBSCRIPTION_PLANS.PREMIUM.maxSubscriptions
  });
  
  // Update payment status if exists
  const payments = await storage.getPaymentsByUserId(userId);
  const pendingPayment = payments.find(p => p.stripeSessionId === session.id);
  
  if (pendingPayment) {
    await storage.updatePaymentStatus(pendingPayment.id, "succeeded");
  }
  
  console.log(`User ${userId} upgraded to premium plan`);
}

// Handle canceled subscription
async function handleCanceledSubscription(subscription: Stripe.Subscription) {
  const stripeCustomerId = subscription.customer as string;
  
  // Find user by Stripe customer ID
  const user = await storage.getUserByStripeCustomerId(stripeCustomerId);
  
  if (!user) {
    console.error("No user found for Stripe customer:", stripeCustomerId);
    return;
  }
  
  // Downgrade user to free plan but keep existing subscriptions
  await storage.updateUser(user.id, {
    hasPaidPlan: false,
    maxSubscriptions: 10 // Back to free tier
  });
  
  console.log(`User ${user.id} downgraded to free plan`);
}