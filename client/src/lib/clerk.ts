import { useUser } from "@clerk/clerk-react";

// For development purposes, we'll use a mock user
const isDevelopment = true;
const mockUser = {
  id: "1",
  primaryEmailAddress: { emailAddress: "test@example.com" }
};

export function useAuth() {
  // In development mode, return mock auth data
  if (isDevelopment) {
    return {
      isLoaded: true,
      isSignedIn: true,
      user: mockUser,
      userId: mockUser.id,
      email: mockUser.primaryEmailAddress.emailAddress
    };
  }
  
  // In production, use actual Clerk authentication
  const { isLoaded, isSignedIn, user } = useUser();
  
  return {
    isLoaded,
    isSignedIn,
    user,
    userId: user?.id,
    email: user?.primaryEmailAddress?.emailAddress
  };
}
