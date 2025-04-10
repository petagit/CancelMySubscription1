import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { storage } from './storage';
import { User } from '@shared/schema';

// Note: we're not extending any namespace here as it's already defined in clerk-auth.ts
// The user property will be set to a partial User object with at least the ID

// Interface to hold converted Clerk user data
interface ClerkUserData {
  id: string;
  username: string;
  email: string;
  profileImageUrl: string | null;
}

/**
 * Middleware to verify and process Clerk authentication
 */
export async function clerkMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    console.log('=== Clerk Middleware Start ===');
    console.log('Request URL:', req.url);
    console.log('Auth header present:', !!req.headers.authorization);
    
    // Skip if it's a guest request
    if (req.query.guestId) {
      console.log('ALLOWING REQUEST: Guest user with ID:', req.query.guestId);
      return next();
    }
    
    // Skip if it's dev mode
    if (req.query.devMode === 'true') {
      console.log('ALLOWING REQUEST: Dev mode enabled');
      return next();
    }
    
    // Get the session token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No auth header, but we'll allow the request to continue
      // The route handlers will decide if authentication is required
      console.log('No Auth header, continuing without auth');
      return next();
    }
    
    const sessionToken = authHeader.split(' ')[1];
    console.log('Session token present (first chars):', sessionToken.substring(0, 5) + '...');
    
    // Special case for development testing
    if (process.env.NODE_ENV === 'development' && sessionToken === 'dev_bypass_auth') {
      console.log('ALLOWING REQUEST: Bypassing authentication in development mode');
      req.clerkUser = { 
        id: 'dev_user_id', 
        username: 'dev_user',
        emailAddresses: [{ emailAddress: 'dev@example.com' }],
        profileImageUrl: null
      };
      return next();
    }
    
    try {
      console.log('HTTP Origin:', req.headers.origin);
      console.log('HTTP Referer:', req.headers.referer);
      console.log('Clerk verification attempt with URL:', req.url);
      
      // Verify the session with Clerk
      const sessionClaims = await clerkClient.verifyToken(sessionToken);
      
      if (!sessionClaims) {
        console.log('Invalid session claims');
        return next(); // Continue but without auth
      }
      
      // Get the user from Clerk
      const userId = sessionClaims.sub;
      console.log('Fetching user details from Clerk for ID:', userId);
      const clerkUser = await clerkClient.users.getUser(userId);
      
      // Get user information
      console.log('Converting Clerk data into app user format');
      const userData: ClerkUserData = {
        id: clerkUser.id,
        username: clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress || 'User',
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        profileImageUrl: clerkUser.profileImageUrl
      };
      
      // Check if this user already exists in our database
      console.log('Checking if user exists in database by Clerk ID:', userData.id);
      let dbUser = await storage.getUserByClerkId(userData.id);
      
      // If user doesn't exist by Clerk ID, try by email
      if (!dbUser && userData.email) {
        console.log('No user found by Clerk ID, checking by email:', userData.email);
        try {
          const userByEmail = await storage.getUserByUsername(userData.email);
          if (userByEmail) {
            dbUser = userByEmail;
            console.log('Found user by email, updating Clerk ID');
            // Update the user's Clerk ID
            dbUser = await storage.updateUser(userByEmail.id, { 
              clerkId: userData.id 
            });
          }
        } catch (error) {
          console.error('Error looking up user by email:', error);
        }
      }
      
      // If still no user found, create a new one
      if (!dbUser) {
        console.log('No user found, creating new user with Clerk data');
        try {
          dbUser = await storage.createUser({
            username: userData.email || `user_${userData.id.substring(0, 8)}`,
            password: 'clerk-managed', // Password is managed by Clerk
            clerkId: userData.id
          });
          console.log('Created new user with ID:', dbUser.id);
        } catch (error) {
          console.error('Error creating user from Clerk data:', error);
        }
      }
      
      // Attach the clerk user to the request
      req.clerkUser = clerkUser;
      
      // Also attach database user ID if we found/created one
      if (dbUser) {
        // Cast to any to avoid type conflicts with Express.Request.user
        (req as any).user = { id: dbUser.id };
        console.log('Attached database user ID to request:', dbUser.id);
      }
      
      console.log('Clerk middleware complete - continuing');
      next();
    } catch (error) {
      console.error('Error during Clerk token verification:', error);
      
      // Check if the error is related to the origin header
      const errorMessage = String(error);
      if (errorMessage.includes('origin_invalid') || errorMessage.includes('Origin header')) {
        console.error('CLERK ORIGIN ERROR DETAILS:');
        console.error('  Current origin:', req.headers.origin);
        console.error('  Host:', req.headers.host);
        console.error('  Referer:', req.headers.referer);
        console.error('  Protocol:', req.protocol);
        console.error('  URL:', req.url);
        console.error('  Full URL:', `${req.protocol}://${req.headers.host}${req.url}`);
        console.error('To fix this issue, add your domain to the allowlist in your Clerk dashboard');
      }
      
      // Continue without authenticated user
      next();
    }
  } catch (error) {
    console.error('Unexpected error in Clerk middleware:', error);
    next(); // Continue without auth
  }
}