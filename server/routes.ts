import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubscriptionSchema, statsSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";

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
  // Set up authentication
  setupAuth(app);
  
  // API routes - prefix all with /api
  
  // Get user stats for the authenticated user
  app.get("/api/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      const stats = await storage.getSubscriptionStats(userId);
      return res.status(200).json(stats);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch stats" });
    }
  });
  
  // Get all subscriptions for the authenticated user
  app.get("/api/subscriptions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      const subscriptions = await storage.getSubscriptionsByUserId(userId);
      return res.status(200).json(subscriptions);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });
  
  // Create a new subscription
  app.post("/api/subscriptions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      const subscriptionData = insertSubscriptionSchema.parse({
        ...req.body,
        userId // Ensure the subscription is associated with the authenticated user
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
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid subscription ID" });
      }
      
      const existingSubscription = await storage.getSubscriptionById(id);
      
      if (!existingSubscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Make sure the user can only update their own subscriptions
      if (existingSubscription.userId !== userId) {
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
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid subscription ID" });
      }
      
      const existingSubscription = await storage.getSubscriptionById(id);
      
      if (!existingSubscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Make sure the user can only delete their own subscriptions
      if (existingSubscription.userId !== userId) {
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
