import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth as useClerkAuth, useUser, useSignIn } from '@clerk/clerk-react';

/**
 * This component handles redirects from Clerk authentication
 * It automatically redirects the user to the dashboard
 */
export default function ClerkCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded: authLoaded, isSignedIn } = useClerkAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const { isLoaded: signInLoaded, signIn } = useSignIn();
  const [debug, setDebug] = useState<string[]>([]);
  const [handlingRedirect, setHandlingRedirect] = useState(false);
  
  // Add detailed logging to help debug
  useEffect(() => {
    // Only run this once
    if (handlingRedirect) return;
    setHandlingRedirect(true);
    
    // Create logs array to track what's happening
    const logs = [];
    logs.push(`CLERK CALLBACK DEBUGGING`);
    logs.push(`Timestamp: ${new Date().toISOString()}`);
    logs.push(`Current path: ${location.pathname}`);
    logs.push(`Full URL: ${window.location.href}`);
    logs.push(`Search params: ${location.search}`);
    logs.push(`Auth states - authLoaded: ${authLoaded}, userLoaded: ${userLoaded}, signInLoaded: ${signInLoaded}`);
    logs.push(`Is signed in: ${isSignedIn}`);
    logs.push(`User object exists: ${!!user}`);
    
    // Log URL search parameters
    const searchParams = new URLSearchParams(location.search);
    logs.push(`Search params:`);
    // Use forEach instead of for...of to avoid TypeScript issues
    searchParams.forEach((value, key) => {
      logs.push(`  ${key}: ${value}`);
    });
    
    // Check if this is actually a Clerk callback route based on URL structure
    const isClerkCallbackRoute = 
      location.pathname.includes('callback') || 
      location.search.includes('__clerk_status') ||
      location.pathname.match(/^\/(sso-callback|oauth)/) ||
      (searchParams.has('__clerk_status') && searchParams.get('__clerk_status') === 'complete');
    
    logs.push(`Is Clerk callback route: ${isClerkCallbackRoute}`);
    
    // Log the current sign in attempt if available
    if (signInLoaded && signIn) {
      const status = signIn.status;
      logs.push(`Sign in status: ${status}`);
      if (status === 'complete') {
        logs.push(`Sign in complete, should redirect to dashboard`);
      }
    }
    
    console.log('CLERK CALLBACK DEBUG:', logs.join('\n'));
    setDebug(logs);
    
    // Force a redirect to dashboard with window.location for maximum compatibility
    const redirectTimer = setTimeout(() => {
      logs.push(`Forcing redirect to dashboard after timeout`);
      console.log(`Forcing redirect to dashboard from callback handler`);
      
      if (isSignedIn) {
        logs.push(`User is signed in, redirecting to dashboard`);
      } else {
        logs.push(`User is NOT signed in, but redirecting to dashboard anyway (guest mode)`);
      }
      
      // Use window.location for a full page navigation, avoiding any routing issues
      window.location.href = '/dashboard';
    }, 2000); // longer delay to ensure Clerk state is fully processed
    
    return () => clearTimeout(redirectTimer);
  }, [
    navigate, 
    location, 
    authLoaded, 
    userLoaded, 
    signInLoaded, 
    isSignedIn, 
    user, 
    signIn, 
    handlingRedirect
  ]);
  
  // Show loading indicator while redirecting
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-black mb-4" />
      <h2 className="text-xl font-semibold">Authentication complete</h2>
      <p className="text-gray-600">Redirecting to your dashboard...</p>
      
      {/* Debug info */}
      <div className="mt-8 p-4 bg-gray-100 rounded max-w-xl text-xs text-gray-600 overflow-x-auto w-full max-w-2xl">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        {debug.map((line, i) => (
          <div key={i} className="mb-1">{line}</div>
        ))}
      </div>
    </div>
  );
}