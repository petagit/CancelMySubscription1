import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * This component handles redirects from Clerk authentication
 * It automatically redirects the user to the dashboard
 */
export default function ClerkCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Log current location for debugging
  console.log('ClerkCallback component mounted at path:', location.pathname);
  
  // Effect to redirect user to dashboard
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Redirecting to dashboard from clerk callback');
      navigate('/dashboard', { replace: true });
    }, 500); // short delay to ensure Clerk state is fully processed
    
    return () => clearTimeout(timer);
  }, [navigate]);
  
  // Show loading indicator while redirecting
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-black mb-4" />
      <h2 className="text-xl font-semibold">Authentication complete</h2>
      <p className="text-gray-600">Redirecting to your dashboard...</p>
    </div>
  );
}