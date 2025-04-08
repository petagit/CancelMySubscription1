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
    console.log('=== Clerk Auth Middleware Start ===');
    console.log('Request URL:', req.url);
    console.log('Request query params:', req.query);
    console.log('Auth header present:', !!req.headers.authorization);
    
    // Check for dev mode
    const devMode = req.query.devMode === 'true';
    
    // Check for guest ID in query parameters
    const guestId = req.query.guestId as string | undefined;
    
    console.log('Dev mode:', devMode);
    console.log('Guest ID:', guestId);
    
    // If in dev mode or guest ID is present, allow the request to proceed
    if (devMode && guestId) {
      console.log('ALLOWING REQUEST: Development mode enabled with guest ID:', guestId);
      req.clerkUser = null; // No clerk user in dev/guest mode
      return next();
    }
    
    // Normal authentication flow
    // Get the session token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // If guest ID is present without dev mode, allow guest access
      if (guestId) {
        console.log('ALLOWING REQUEST: Guest access with ID:', guestId);
        req.clerkUser = null;
        return next();
      }
      
      console.log('AUTH FAILED: Missing authentication token');
      return res.status(401).json({ message: 'Missing authentication token' });
    }
    
    const sessionToken = authHeader.split(' ')[1];
    console.log('Session token present (first 10 chars):', sessionToken.substring(0, 10) + '...');
    
    // Special case for dev mode with token
    if (process.env.NODE_ENV === 'development' && sessionToken === 'dev_bypass_auth') {
      console.log('ALLOWING REQUEST: Bypassing authentication in development mode with token');
      req.clerkUser = { 
        id: 'dev_user_id', 
        username: 'dev_user',
        emailAddresses: [{ emailAddress: 'dev@example.com' }]
      };
      return next();
    }
    
    try {
      console.log('Attempting to verify token with Clerk...');
      // Verify the session with Clerk
      const sessionClaims = await clerkClient.verifyToken(sessionToken);
      
      if (!sessionClaims) {
        console.log('AUTH FAILED: Invalid session (null claims)');
        return res.status(401).json({ message: 'Invalid session' });
      }
      
      console.log('Session claims verified:', sessionClaims.sub);
      
      // Add Clerk user to request
      const userId = sessionClaims.sub;
      console.log('Fetching user details from Clerk for user ID:', userId);
      const user = await clerkClient.users.getUser(userId);
      console.log('Clerk user details retrieved:', { 
        id: user.id,
        username: user.username,
        email: user.emailAddresses[0]?.emailAddress
      });
      
      req.clerkUser = user;
      console.log('ALLOWING REQUEST: Valid Clerk authentication');
      
      // Continue with the request
      next();
    } catch (error) {
      console.error('Clerk auth error:', error);
      console.log('AUTH FAILED: Error during Clerk authentication');
      return res.status(401).json({ message: 'Authentication failed', error: String(error) });
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
      console.log('=== Clerk User Registration ===');
      console.log('Request headers:', req.headers);
      console.log('Request body:', req.body);
      
      const { username, id: clerkId, email } = req.body;
      const effectiveUsername = username || email || `user_${clerkId}`;
      
      if (!clerkId) {
        console.log('ERROR: Missing Clerk ID in request body');
        return res.status(400).json({ message: 'Clerk ID is required' });
      }
      
      console.log(`Processing registration for Clerk user: ${clerkId}, username: ${effectiveUsername}`);
      
      // First check by Clerk ID as it's most reliable
      console.log(`Checking if user exists with Clerk ID: ${clerkId}`);
      let existingUser = await storage.getUserByClerkId(clerkId);
      
      // Then check by username if not found by Clerk ID
      if (!existingUser && effectiveUsername) {
        console.log(`No user found with Clerk ID, checking by username: ${effectiveUsername}`);
        existingUser = await storage.getUserByUsername(effectiveUsername);
        console.log(existingUser ? `Found user by username with ID: ${existingUser.id}` : 'No user found by username');
      }
      
      if (existingUser) {
        console.log(`User already exists with id ${existingUser.id}, returning existing user`);
        
        // Update the clerkId if it wasn't set before but username matches
        if (!existingUser.clerkId) {
          console.log(`Updating existing user ${existingUser.id} with Clerk ID ${clerkId}`);
          try {
            existingUser = await storage.updateUser(existingUser.id, { clerkId: clerkId.toString() });
            console.log('Successfully updated existing user with Clerk ID');
          } catch (updateError) {
            console.error('Failed to update existing user with Clerk ID:', updateError);
            // Continue with the existing user even if the update failed
          }
        }
        
        // User exists, return the user without password
        const { password, ...userWithoutPassword } = existingUser;
        console.log('Returning existing user object:', userWithoutPassword);
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
      
      console.log('Attempting to create user with data:', { ...newUser, password: '[REDACTED]' });
      
      try {
        const user = await storage.createUser(newUser);
        console.log(`Successfully created new user with id ${user.id}`);
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        console.log('Returning new user object:', userWithoutPassword);
        return res.status(201).json(userWithoutPassword);
      } catch (createError) {
        console.error('Failed to create new user in database:', createError);
        return res.status(500).json({ 
          message: 'Failed to create user in database', 
          error: String(createError),
          details: 'Error occurred during user creation in the database'
        });
      }
    } catch (error) {
      console.error('Error during Clerk user registration:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
      return res.status(500).json({ 
        message: 'Failed to register user', 
        error: String(error),
        details: 'Unexpected error occurred in the registration process'
      });
    }
  });
  
  // Endpoint to get the current user
  app.get('/api/clerk/user', requireClerkAuth, async (req: Request, res: Response) => {
    try {
      console.log('=== GET Current Clerk User ===');
      
      // Check if clerk user exists in the request
      if (!req.clerkUser) {
        console.log('No Clerk user found in request - this is unusual after passing requireClerkAuth middleware');
        return res.status(404).json({ message: 'Clerk user not found in request' });
      }
      
      const clerkId = req.clerkUser.id;
      console.log(`Looking up user with Clerk ID: ${clerkId}`);
      
      // Find user by Clerk ID
      const user = await storage.getUserByClerkId(clerkId);
      
      if (!user) {
        console.log(`No user found in database with Clerk ID: ${clerkId}`);
        return res.status(404).json({ 
          message: 'User not found in database', 
          clerkId,
          suggestion: 'User may need to register first' 
        });
      }
      
      console.log(`Found user in database: ID=${user.id}, username=${user.username}`);
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      console.log('Returning user data:', userWithoutPassword);
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error('Error getting user:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
      return res.status(500).json({ 
        message: 'Failed to get user', 
        error: String(error),
        details: 'Error occurred while retrieving user data'
      });
    }
  });
}