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
      console.log('Received clerk registration request:', req.body);
      
      const { username, id: clerkId, email } = req.body;
      const effectiveUsername = username || email || `user_${clerkId}`;
      
      if (!clerkId) {
        return res.status(400).json({ message: 'Clerk ID is required' });
      }
      
      console.log(`Processing registration for Clerk user: ${clerkId}, username: ${effectiveUsername}`);
      
      // First check by Clerk ID as it's most reliable
      let existingUser = await storage.getUserByClerkId(clerkId);
      
      // Then check by username if not found by Clerk ID
      if (!existingUser && effectiveUsername) {
        existingUser = await storage.getUserByUsername(effectiveUsername);
      }
      
      if (existingUser) {
        console.log(`User already exists with id ${existingUser.id}, returning existing user`);
        
        // Update the clerkId if it wasn't set before but username matches
        if (!existingUser.clerkId) {
          console.log(`Updating existing user ${existingUser.id} with Clerk ID ${clerkId}`);
          existingUser = await storage.updateUser(existingUser.id, { clerkId: clerkId.toString() });
        }
        
        // User exists, return the user without password
        const { password, ...userWithoutPassword } = existingUser;
        return res.status(200).json(userWithoutPassword);
      }
      
      // Create a new user with a random password (not used since Clerk handles auth)
      console.log(`Creating new user with username: ${effectiveUsername}, clerkId: ${clerkId}`);
      const randomPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const newUser = {
        username: effectiveUsername,
        password: randomPassword,
        clerkId: clerkId.toString() // Store the Clerk ID for future reference
      };
      
      const user = await storage.createUser(newUser);
      console.log(`Created new user with id ${user.id}`);
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Error during Clerk user registration:', error);
      return res.status(500).json({ message: 'Failed to register user', error: String(error) });
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