import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubscriptionSchema, statsSchema, type Subscription, type Stats } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import { setupClerkAuth } from "./clerk-auth";
import Stripe from "stripe";
// Note: We're importing Stripe functions dynamically to handle missing API keys gracefully

// For development purposes - allow API access without authentication 
// Set to true during development to bypass auth checks
const BYPASS_AUTH = process.env.NODE_ENV === 'production' ? false : true;

// Simple middleware to handle both authenticated users and guest users
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  console.log('=== isAuthenticated Middleware ===');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  console.log('Request query params:', req.query);
  
  // Check if dev mode is enabled
  const devMode = req.query.devMode === 'true';
  console.log('Dev mode enabled:', devMode);
  
  // Guest mode - if there's a guestId, allow access
  if (req.query.guestId) {
    console.log("ALLOWING REQUEST: Guest mode with ID:", req.query.guestId);
    return next();
  }
  
  // User authenticated via Clerk middleware (which sets req.user automatically)
  if ((req as any).user) {
    console.log("ALLOWING REQUEST: User authenticated via middleware, ID:", (req as any).user.id);
    return next();
  }
  
  // Authenticated users via session (older auth method)
  const isNormalAuth = req.isAuthenticated && req.isAuthenticated();
  const hasClerkUser = !!req.clerkUser;
  
  console.log('Authentication status:', { 
    isNormalAuth, 
    hasClerkUser,
    clerkUserId: req.clerkUser?.id,
    sessionUserId: (req as any).user?.id
  });
  
  if (isNormalAuth || hasClerkUser) {
    console.log("ALLOWING REQUEST: User is authenticated via session or Clerk directly");
    return next();
  }
  
  // Dev mode bypass
  if (devMode) {
    console.log("ALLOWING REQUEST: Dev mode enabled - bypassing authentication");
    return next();
  }
  
  // Testing bypass - in development only
  if (BYPASS_AUTH && process.env.NODE_ENV !== 'production') {
    console.log("ALLOWING REQUEST: DEV BYPASS mode enabled");
    return next();
  }
  
  // Not authenticated
  console.log("AUTH FAILED: No valid authentication method found");
  res.status(401).json({ message: "Authentication required" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication - both traditional and Clerk
  setupAuth(app);
  setupClerkAuth(app);
  
  // Serve SEO files from the public directory
  app.get("/sitemap.xml", (req, res) => {
    res.sendFile("sitemap.xml", { root: './public' });
  });
  
  app.get("/robots.txt", (req, res) => {
    res.sendFile("robots.txt", { root: './public' });
  });
  
  // Endpoint to get Clerk publishable key
  app.get("/api/clerk-key", (req, res) => {
    // Use production key instead of development key
    res.json({ key: process.env.CLERK_PUBLISHABLE_KEY || "" });
  });
  
  // API routes - prefix all with /api
  
  // Get user stats for the authenticated user or guest
  app.get("/api/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log('=== GET /api/stats ===');
      
      const userId = req.user?.id;
      // Check if a guestId was provided in the query parameters
      const guestId = req.query.guestId as string | undefined;
      const clerkUser = req.clerkUser;
      
      console.log('Request user data:', {
        userId,
        guestId,
        hasClerkUser: !!clerkUser,
        clerkUserId: clerkUser?.id,
        clerkUserEmail: clerkUser?.emailAddresses?.[0]?.emailAddress
      });
      
      let stats: Stats;
      
      if (userId) {
        console.log('Using userId for stats lookup:', userId);
        // Get stats for authenticated user
        stats = await storage.getSubscriptionStats(userId);
      } else if (guestId) {
        console.log('Using guestId for stats lookup:', guestId);
        // Get stats for guest user
        stats = await storage.getSubscriptionStatsForGuest(guestId);
      } else if (BYPASS_AUTH) {
        console.log('Using BYPASS_AUTH - returning default stats');
        // In bypass mode, return default stats
        stats = {
          monthlySpending: 0,
          yearlySpending: 0,
          activeSubscriptions: 0,
          subscriptionLimit: 10,
          isPremium: false
        };
      } else {
        console.log('ERROR: No valid authentication method found');
        return res.status(400).json({ message: "Either user authentication or guestId is required" });
      }
      
      console.log('Stats retrieved successfully:', stats);
      return res.status(200).json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      return res.status(500).json({ message: "Failed to fetch stats", error: String(error) });
    }
  });
  
  // Get all subscriptions for the authenticated user or guest
  app.get("/api/subscriptions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log('=== GET /api/subscriptions ===');
      
      const userId = req.user?.id;
      // Check if a guestId was provided in the query parameters
      const guestId = req.query.guestId as string | undefined;
      const clerkUser = req.clerkUser;
      
      console.log('Request auth data:', {
        sessionUserId: userId,
        guestId,
        hasClerkUser: !!clerkUser,
        clerkUserId: clerkUser?.id,
        clerkUserEmail: clerkUser?.emailAddresses?.[0]?.emailAddress
      });
      
      let subscriptions: Subscription[] = [];
      
      if (userId) {
        console.log('Fetching subscriptions for userId:', userId);
        // Fetch subscriptions for authenticated user
        subscriptions = await storage.getSubscriptionsByUserId(userId);
        console.log(`Found ${subscriptions.length} subscriptions for user ID ${userId}`);
      } else if (guestId) {
        console.log('Fetching subscriptions for guestId:', guestId);
        // Fetch subscriptions for guest user
        subscriptions = await storage.getSubscriptionsByGuestId(guestId);
        console.log(`Found ${subscriptions.length} subscriptions for guest ID ${guestId}`);
      } else if (BYPASS_AUTH) {
        console.log('Using BYPASS_AUTH - returning empty subscriptions array');
        // In bypass mode, return empty subscriptions
        subscriptions = [];
        console.log(`Found ${subscriptions.length} subscriptions for test user ID 1`);
      } else {
        console.log('ERROR: No valid authentication method found');
        return res.status(400).json({ message: "Either user authentication or guestId is required" });
      }
      
      console.log(`Successfully returning ${subscriptions.length} subscriptions`);
      return res.status(200).json(subscriptions);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return res.status(500).json({ message: "Failed to fetch subscriptions", error: String(error) });
    }
  });
  
  // Create a new subscription
  app.post("/api/subscriptions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get Clerk user or regular user from the request
      const clerkUser = req.clerkUser;
      const regularUser = req.user;
      
      // Debug log
      console.log("POST /api/subscriptions - Request body:", req.body);
      console.log("Clerk user:", clerkUser ? clerkUser.id : null);
      console.log("Regular user:", regularUser ? regularUser.id : null);
      
      let userId = null;
      
      // Get user ID based on authentication method
      if (clerkUser) {
        // If authenticated with Clerk, try to get the user from our database
        try {
          const dbUser = await storage.getUserByClerkId(clerkUser.id);
          if (dbUser) {
            userId = dbUser.id;
            console.log("Found user ID from Clerk user:", userId);
          } else {
            // If user doesn't exist yet, create one
            console.log("User doesn't exist in our database yet. Creating...");
            const username = clerkUser.username || clerkUser.emailAddresses?.[0]?.emailAddress || `user_${clerkUser.id}`;
            const createdUser = await storage.createUser({
              username,
              password: 'clerk-managed', // Password is managed by Clerk
              clerkId: clerkUser.id
            });
            userId = createdUser.id;
            console.log("Created new user with ID:", userId);
          }
        } catch (err) {
          console.error("Error getting/creating user from Clerk:", err);
          // If we can't get or create a user, we'll proceed with a null userId and use guest mode
        }
      } else if (regularUser) {
        // Regular session user
        userId = regularUser.id;
        console.log("Using regular session user ID:", userId);
      }
      
      // Generate a guest ID if needed - either use from request or create a new one
      const guestId = !userId ? (req.query.guestId as string || req.body.guestId || `guest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`) : null;
      console.log("Guest ID:", guestId);
      
      // For guest users, check the subscription limit (5)
      if (!userId && guestId) {
        // Get existing subscriptions for this guest user
        const existingSubscriptions = await storage.getSubscriptionsByGuestId(guestId);
        console.log("Existing subscriptions count:", existingSubscriptions.length);
        
        // If they already have 5 or more, don't allow more
        if (existingSubscriptions.length >= 5) {
          return res.status(403).json({ 
            message: "Guest users are limited to 5 subscriptions. Please sign up for a free account to add more." 
          });
        }
      }
      
      console.log("Preparing subscription data with:", { userId, guestId, body: req.body });
      
      // Create a data object with the correct types
      const subscriptionToCreate = {
        ...req.body,
        userId: userId, // User ID from either Clerk or session
        guestId: guestId, // Guest ID for unauthenticated users
        amount: typeof req.body.amount === 'string' ? req.body.amount : String(req.body.amount), // Ensure amount is a string
        nextBillingDate: new Date(req.body.nextBillingDate) // Convert string date to Date
      };
      
      console.log("Subscription data to parse:", subscriptionToCreate);
      
      const subscriptionData = insertSubscriptionSchema.parse(subscriptionToCreate);
      
      console.log("Parsed subscription data:", subscriptionData);
      
      const subscription = await storage.createSubscription(subscriptionData);
      return res.status(201).json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        console.error("Validation error:", validationError.message);
        return res.status(400).json({ message: validationError.message });
      }
      
      return res.status(500).json({ message: "Failed to create subscription", error: String(error) });
    }
  });
  
  // Update a subscription
  app.patch("/api/subscriptions/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.id;
      // Check if a guestId was provided in the query parameters
      const guestId = req.query.guestId as string | undefined;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid subscription ID" });
      }
      
      const existingSubscription = await storage.getSubscriptionById(id);
      
      if (!existingSubscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Check authorization: user can update their own subscriptions or guest can update their own
      let authorized = false;
      
      if (userId && existingSubscription.userId === userId) {
        authorized = true;
      } else if (guestId && existingSubscription.guestId === guestId) {
        authorized = true;
      } else if (BYPASS_AUTH) {
        authorized = true;
      }
      
      if (!authorized) {
        return res.status(403).json({ message: "Not authorized to update this subscription" });
      }
      
      // Allow partial schema validation
      const subscriptionUpdate = req.body;
      const updatedSubscription = await storage.updateSubscription(id, subscriptionUpdate);
      
      return res.status(200).json(updatedSubscription);
    } catch (error) {
      return res.status(500).json({ message: "Failed to update subscription" });
    }
  });
  
  // Delete a subscription
  app.delete("/api/subscriptions/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.id;
      // Check if a guestId was provided in the query parameters
      const guestId = req.query.guestId as string | undefined;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid subscription ID" });
      }
      
      const existingSubscription = await storage.getSubscriptionById(id);
      
      if (!existingSubscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Check authorization: user can delete their own subscriptions or guest can delete their own
      let authorized = false;
      
      if (userId && existingSubscription.userId === userId) {
        authorized = true;
      } else if (guestId && existingSubscription.guestId === guestId) {
        authorized = true;
      } else if (BYPASS_AUTH) {
        authorized = true;
      }
      
      if (!authorized) {
        return res.status(403).json({ message: "Not authorized to delete this subscription" });
      }
      
      const success = await storage.deleteSubscription(id);
      
      if (!success) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      return res.status(200).json({ message: "Subscription deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete subscription" });
    }
  });

  // Payment-related routes
  
  // Get subscription limit and premium status
  app.get("/api/subscription-status", isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log("Subscription status request:", {
        userId: req.user?.id,
        clerkUserId: req.clerkUser?.id,
        guestId: req.query.guestId,
        devMode: req.query.devMode === 'true'
      });
      
      const userId = req.user?.id;
      const clerkUserId = req.clerkUser?.id;
      const guestId = req.query.guestId as string | undefined;
      const devMode = req.query.devMode === 'true';
      
      // Check for guestId first - this is our simplest path
      if (guestId) {
        console.log("Processing request as guest user with ID:", guestId);
        // Get guest subscriptions
        const subscriptions = await storage.getSubscriptionsByGuestId(guestId);
        
        return res.status(200).json({
          subscriptionCount: subscriptions.length,
          subscriptionLimit: 5,
          isPremium: false,
          remainingSubscriptions: Math.max(0, 5 - subscriptions.length)
        });
      }
      
      // Check for authenticated user
      let dbUserId: number | undefined;
      
      // Get database user ID if we have a clerk user
      if (clerkUserId) {
        console.log("Looking up user by Clerk ID:", clerkUserId);
        const dbUser = await storage.getUserByClerkId(clerkUserId);
        if (dbUser) {
          dbUserId = dbUser.id;
          console.log("Found DB user:", dbUser.id);
        } else {
          console.log("No DB user found for Clerk ID:", clerkUserId);
        }
      } else if (userId) {
        dbUserId = userId;
        console.log("Using session user ID:", userId);
      }
      
      // If we have a database user ID, use it
      if (dbUserId) {
        const user = await storage.getUser(dbUserId);
        const subscriptionCount = await storage.getUserSubscriptionCount(dbUserId);
        
        if (!user) {
          console.log("User not found with ID:", dbUserId);
          return res.status(404).json({ message: "User not found" });
        }
        
        const maxSubscriptions = user.maxSubscriptions || 10;
        
        return res.status(200).json({
          subscriptionCount,
          subscriptionLimit: maxSubscriptions,
          isPremium: user.hasPaidPlan || false,
          remainingSubscriptions: Math.max(0, maxSubscriptions - subscriptionCount)
        });
      }
      
      // If we're in development mode, return a default response for testing
      if (devMode) {
        console.log("Dev mode enabled - returning default subscription status");
        return res.status(200).json({
          subscriptionCount: 3,
          subscriptionLimit: 10,
          isPremium: false,
          remainingSubscriptions: 7
        });
      }
      
      // As a last resort, return a generic guest response
      console.log("No auth method detected, returning generic guest response");
      return res.status(200).json({
        subscriptionCount: 0,
        subscriptionLimit: 5,
        isPremium: false,
        remainingSubscriptions: 5
      });
    } catch (error) {
      console.error("Error getting subscription status:", error);
      return res.status(500).json({ message: "Failed to get subscription status", error: String(error) });
    }
  });
  
  // Create checkout session for premium plan
  app.post("/api/create-checkout-session", isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log("Creating checkout session - request received");
      
      // Import and check if Stripe is available
      const { isStripeEnabled } = await import('./stripe');
      console.log("Stripe available:", isStripeEnabled());
      
      if (!isStripeEnabled()) {
        console.log("Stripe is disabled, returning error response");
        return res.status(503).json({ 
          message: "Payment services are temporarily unavailable", 
          stripeDisabled: true,
          redirectTo: '/dashboard?payment=unavailable'
        });
      }
      
      const userId = req.user?.id;
      const clerkUser = req.clerkUser;
      const guestId = req.query.guestId as string | undefined;
      
      // Log authentication context
      console.log("Checkout authentication context:", {
        hasUserId: !!userId,
        hasClerkUser: !!clerkUser,
        hasGuestId: !!guestId
      });
      
      if (!userId && !clerkUser && !guestId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      let dbUserId: number | undefined;
      let userEmail: string;
      let userName: string | undefined;
      
      // Get user details based on authentication method
      if (clerkUser) {
        // Get or create database user for Clerk user
        const dbUser = await storage.getUserByClerkId(clerkUser.id);
        
        if (dbUser) {
          dbUserId = dbUser.id;
        } else {
          // Create a new user if not exists
          const email = clerkUser.emailAddresses?.[0]?.emailAddress || 'user@example.com';
          const username = clerkUser.username || email || `user_${clerkUser.id}`;
          
          const newUser = await storage.createUser({
            username,
            password: 'clerk-managed',
            clerkId: clerkUser.id
          });
          
          dbUserId = newUser.id;
        }
        
        userEmail = clerkUser.emailAddresses?.[0]?.emailAddress || 'user@example.com';
        userName = clerkUser.firstName 
          ? clerkUser.lastName 
            ? `${clerkUser.firstName} ${clerkUser.lastName}`
            : clerkUser.firstName
          : undefined;
      } else if (userId) {
        // Regular session user
        dbUserId = userId;
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        userEmail = user.username; // Use username as email for regular users
      } else if (guestId) {
        // Guest user - create temporary user and convert to permanent on payment success
        console.log("Processing checkout for guest user:", guestId);
        
        // Generate dynamic email/username for this guest
        const timestamp = new Date().getTime();
        userEmail = `guest_${guestId.substring(0, 8)}@example.com`;
        userName = `Guest User ${timestamp.toString().substring(8)}`;
        
        // Create a new user
        const guestUser = await storage.createUser({
          username: userEmail,
          password: `guest_${Math.random().toString(36).substring(2)}`, // Random password
          guestId: guestId // Store the guest ID for reference
        });
        
        dbUserId = guestUser.id;
        console.log("Created temporary user for guest checkout:", dbUserId);
      } else {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Create checkout session with Stripe
      const { createCheckoutSession } = await import('./stripe');
      const session = await createCheckoutSession(
        dbUserId!,
        userEmail,
        userName
      );
      
      return res.status(200).json({ 
        sessionId: session.id,
        url: session.url
      });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      return res.status(500).json({ 
        message: "Failed to create checkout session",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Stripe webhook endpoint
  app.post("/api/webhook", async (req: Request, res: Response) => {
    try {
      // Import and check if Stripe is available
      const { isStripeEnabled } = await import('./stripe');
      
      if (!isStripeEnabled()) {
        return res.status(503).json({ 
          message: "Payment services are temporarily unavailable"
        });
      }
      
      const signature = req.headers['stripe-signature'] as string;
      
      if (!signature) {
        return res.status(400).json({ message: "No Stripe signature found" });
      }
      
      // Create a Stripe webhook event
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
      let event;
      
      try {
        // Verify the event with the Stripe-provided signing secret
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
        
        if (endpointSecret) {
          event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            endpointSecret
          );
        } else {
          // Without a webhook secret, just use the raw event
          event = JSON.parse(req.body);
        }
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).send(`Webhook Error: ${err.message || 'Unknown error'}`);
      }
      
      // Handle the event
      const { handleStripeWebhook } = await import('./stripe');
      await handleStripeWebhook(event);
      
      // Acknowledge receipt of the event
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error handling webhook:', error);
      return res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
