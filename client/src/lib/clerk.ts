import { useAuth as useClerkAuth, useUser, useSession } from '@clerk/clerk-react';
import type { UserResource } from '@clerk/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './queryClient';

// Interface for the user data we get from our API
export interface ApiUser {
  id: number;
  username: string;
  // No password as it should never be returned from the API
}

// Function to convert a Clerk user to our API user format
function convertClerkUserToApiUser(user: UserResource): ApiUser {
  return {
    id: parseInt(user.id), // Clerk IDs are strings, convert to number
    username: user.username || user.emailAddresses[0]?.emailAddress || 'unknown',
  };
}

// Custom hook that combines Clerk auth with our server auth
export function useAuth() {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { session } = useSession();
  const queryClient = useQueryClient();

  // Check if user is authenticated with our server
  const { data: apiUser, isLoading, error } = useQuery({
    queryKey: ['/api/clerk/user'],
    queryFn: async () => {
      if (!isSignedIn || !clerkUser || !session) return null;
      
      try {
        // Get the session token for authentication
        const token = await session.getToken();
        
        // First try to get existing user via Clerk auth
        const res = await fetch('/api/clerk/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          return await res.json();
        }
        
        // If not found (404), register the user with our backend
        if (res.status === 404) {
          // Register with clerk user data
          const registerData = {
            username: clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress || `user_${clerkUser.id}`,
            id: clerkUser.id
          };
          
          const registerRes = await fetch('/api/clerk/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(registerData)
          });
          
          if (registerRes.ok) {
            return await registerRes.json();
          }
        }
        
        throw new Error('Failed to authenticate user with API');
      } catch (error) {
        console.error('Auth error:', error);
        return null;
      }
    },
    enabled: isLoaded && isSignedIn && !!clerkUser && !!session,
  });
  
  // We don't need login/register mutations since Clerk handles those,
  // but we do need a logout mutation for our API
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // No need to call /api/logout since Clerk handles sessions
      // Just clear the local user data in the query client
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/clerk/user'], null);
    },
  });

  return {
    user: apiUser,
    isLoading: !isLoaded || isLoading,
    isSignedIn, // Add isSignedIn to the return value
    error,
    logoutMutation,
    // We don't need these but include them to maintain compatibility
    loginMutation: { mutate: () => {} } as any,
    registerMutation: { mutate: () => {} } as any,
  };
}