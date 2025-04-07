import { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LogoIcon from "@/components/LogoIcon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { SignIn, useUser } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoaded, isSignedIn } = useUser();

  // Redirect to dashboard if user is already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/dashboard");
    }
  }, [isLoaded, isSignedIn, navigate]);

  // Continue as guest handler
  const handleContinueAsGuest = () => {
    // Generate a random guest ID if one doesn't already exist
    if (!localStorage.getItem("guestId")) {
      const guestId = `guest_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem("guestId", guestId);
      
      toast({
        title: "Guest Mode Activated",
        description: "You're now using the app as a guest. Your data will be stored locally.",
      });
    }
    navigate("/dashboard");
  };

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-black" />
        <span className="ml-3 text-lg font-medium">Loading authentication...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Form column */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <LogoIcon className="h-12 w-12" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome to CancelMySub</CardTitle>
            <CardDescription>
              Sign in to manage your subscriptions or continue as a guest
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Clerk Sign In UI */}
              <div className="mb-6">
                <SignIn 
                  routing="path" 
                  path="/auth" 
                  redirectUrl="/dashboard" 
                  appearance={{
                    elements: {
                      formButtonPrimary: "bg-black hover:bg-gray-800 text-white",
                      card: "shadow-none"
                    }
                  }}
                />
              </div>
              
              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              
              {/* Guest mode option */}
              <div className="pt-4">
                <Button 
                  onClick={handleContinueAsGuest} 
                  variant="outline"
                  className="w-full"
                >
                  Continue as Guest
                </Button>
                <p className="mt-2 text-xs text-center text-muted-foreground">
                  No account needed. Your data will be stored locally.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Hero column */}
      <div className="hidden md:flex flex-1 bg-black text-white items-center justify-center p-8">
        <div className="max-w-md space-y-6">
          <h1 className="text-4xl font-bold tracking-tight">Take control of your subscriptions</h1>
          <p className="text-xl">
            CancelMySub helps you track, manage, and cancel your unwanted subscriptions - all in one place.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-down"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
              </div>
              <div>
                <h3 className="font-medium">Reduce Monthly Expenses</h3>
                <p className="text-white/80">Identify and eliminate unused subscriptions to save money</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell-ring"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><path d="M4 2C2.8 3.7 2 5.7 2 8"/><path d="M22 8c0-2.3-.8-4.3-2-6"/></svg>
              </div>
              <div>
                <h3 className="font-medium">Never Miss a Payment</h3>
                <p className="text-white/80">Get reminders before you're charged for your subscriptions</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
              </div>
              <div>
                <h3 className="font-medium">Easy Cancellation</h3>
                <p className="text-white/80">Direct links to cancellation pages for quick unsubscribing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}