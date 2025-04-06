import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubscriptionSchema, statsSchema, type Subscription, type Stats } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import { setupClerkAuth } from "./clerk-auth";

// TEMPORARY: For testing purposes - allow API access without authentication
const BYPASS_AUTH = true;

// Middleware to ensure a user is authenticated
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  // If BYPASS_AUTH is enabled, use user ID 1 as a test user
  if (BYPASS_AUTH) {
    if (!req.user) {
      // Add a mock user with ID 1 for testing purposes
      (req as any).user = { id: 1 };
    }
    return next();
  }
  
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ message: "Not authenticated" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication - both traditional and Clerk
  setupAuth(app);
  setupClerkAuth(app);
  
  // Endpoint to get Clerk publishable key
  app.get("/api/clerk-key", (req, res) => {
    res.json({ key: process.env.CLERK_DEV_PUBLISHABLE_KEY || "" });
  });
  
  // API routes - prefix all with /api
  
  // Get user stats for the authenticated user or guest
  app.get("/api/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      // Check if a guestId was provided in the query parameters
      const guestId = req.query.guestId as string | undefined;
      
      let stats: Stats;
      
      if (userId) {
        // Get stats for authenticated user
        stats = await storage.getSubscriptionStats(userId);
      } else if (guestId) {
        // Get stats for guest user
        stats = await storage.getSubscriptionStatsForGuest(guestId);
      } else if (BYPASS_AUTH) {
        // In bypass mode, get test user stats
        stats = await storage.getSubscriptionStats(1);
      } else {
        return res.status(400).json({ message: "Either user authentication or guestId is required" });
      }
      
      return res.status(200).json(stats);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  
  // Get all subscriptions for the authenticated user or guest
  app.get("/api/subscriptions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      // Check if a guestId was provided in the query parameters
      const guestId = req.query.guestId as string | undefined;
      
      let subscriptions: Subscription[] = [];
      
      if (userId) {
        // Fetch subscriptions for authenticated user
        subscriptions = await storage.getSubscriptionsByUserId(userId);
      } else if (guestId) {
        // Fetch subscriptions for guest user
        subscriptions = await storage.getSubscriptionsByGuestId(guestId);
      } else if (BYPASS_AUTH) {
        // In bypass mode, get test user subscriptions
        subscriptions = await storage.getSubscriptionsByUserId(1);
      } else {
        return res.status(400).json({ message: "Either user authentication or guestId is required" });
      }
      
      return res.status(200).json(subscriptions);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });
  
  // Create a new subscription
  app.post("/api/subscriptions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      // Generate a guest ID if needed - either use from request or create a new one
      const guestId = !userId ? (req.body.guestId || `guest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`) : null;
      
      const subscriptionData = insertSubscriptionSchema.parse({
        ...req.body,
        userId, // Will be null for guest users
        guestId // Will be set for guest users
      });
      
      const subscription = await storage.createSubscription(subscriptionData);
      return res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: "Failed to create subscription" });
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

  const httpServer = createServer(app);
  return httpServer;
}
