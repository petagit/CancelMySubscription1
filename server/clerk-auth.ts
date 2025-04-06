import { clerkClient } from '@clerk/clerk-sdk-node';
import type { Express, Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { User } from '@shared/schema';

// Extension for Express Request to include Clerk user
declare global {
  namespace Express {
    interface Request {
      clerkUser?: any;
    }
  }
}

// Middleware to verify Clerk session
export async function requireClerkAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Get the session token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing authentication token' });
    }
    
    const sessionToken = authHeader.split(' ')[1];
    
    try {
      // Verify the session with Clerk
      const sessionClaims = await clerkClient.verifyToken(sessionToken);
      
      if (!sessionClaims) {
        return res.status(401).json({ message: 'Invalid session' });
      }
      
      // Add Clerk user to request
      const userId = sessionClaims.sub;
      const user = await clerkClient.users.getUser(userId);
      req.clerkUser = user;
      
      // Continue with the request
      next();
    } catch (error) {
      console.error('Clerk auth error:', error);
      return res.status(401).json({ message: 'Authentication failed' });
    }
  } catch (error) {
    console.error('Clerk auth error:', error);
    return res.status(500).json({ message: 'Server error during authentication' });
  }
}

// Setup Clerk auth routes
export function setupClerkAuth(app: Express) {
  // Endpoint to register/link a Clerk user with our database
  app.post('/api/clerk/register', async (req: Request, res: Response) => {
    try {
      const { username, id: clerkId } = req.body;
      
      if (!username || !clerkId) {
        return res.status(400).json({ message: 'Username and ID are required' });
      }
      
      // Check if user already exists by username
      let existingUser = await storage.getUserByUsername(username);
      
      // Also check by Clerk ID
      if (!existingUser) {
        existingUser = await storage.getUserByClerkId(clerkId);
      }
      
      if (existingUser) {
        // User exists, return the user
        const { password, ...userWithoutPassword } = existingUser;
        return res.status(200).json(userWithoutPassword);
      }
      
      // Create a new user with a random password (not used since Clerk handles auth)
      const randomPassword = Math.random().toString(36).substring(2);
      const newUser = {
        username,
        password: randomPassword,
        clerkId: clerkId.toString() // Store the Clerk ID for future reference
      };
      
      const user = await storage.createUser(newUser);
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Error during Clerk user registration:', error);
      return res.status(500).json({ message: 'Failed to register user' });
    }
  });
  
  // Endpoint to get the current user
  app.get('/api/clerk/user', requireClerkAuth, async (req: Request, res: Response) => {
    try {
      const clerkId = req.clerkUser.id;
      
      // Find user by Clerk ID
      const user = await storage.getUserByClerkId(clerkId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error('Error getting user:', error);
      return res.status(500).json({ message: 'Failed to get user' });
    }
  });
}