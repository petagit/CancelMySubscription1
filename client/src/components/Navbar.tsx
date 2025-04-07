import { Link, useLocation } from "wouter";
import LogoIcon from "./LogoIcon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, User, LogOut, Info, TestTube } from "lucide-react";
import { useEffect, useState } from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";

export default function Navbar() {
  const [location] = useLocation();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isGuestUser, setIsGuestUser] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Use Clerk to manage authentication
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  
  // Handle test button click - create guest session and go to dashboard
  const handleTestClick = () => {
    try {
      // Generate a random guest ID
      const guestId = `guest_${Math.random().toString(36).substring(2, 15)}`;
      console.log("Setting guestId:", guestId);
      localStorage.setItem("guestId", guestId);
      setIsGuestUser(true);
      
      toast({
        title: "Test Mode Activated",
        description: "You're now using the app as a test guest. No login required.",
      });
      
      console.log("Navigating to dashboard...");
      // Force a reload to the dashboard URL instead of using the navigate function
      window.location.href = "/dashboard";
    } catch (e) {
      console.error("Error entering test mode:", e);
    }
  };
  
  // Check if user is in guest mode
  useEffect(() => {
    try {
      const guestId = localStorage.getItem("guestId");
      setIsGuestUser(!!guestId && !isSignedIn);
    } catch (e) {
      console.error("Error checking guest mode:", e);
    }
  }, [isSignedIn]);
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      
      if (isGuestUser) {
        // Guest logout
        localStorage.removeItem("guestId");
        window.location.href = "/";
      } else if (signOut) {
        // Clerk logout
        await signOut();
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsSigningOut(false);
    }
  };
  
  // Get user's initials for avatar
  const getUserInitial = (): string => {
    if (isGuestUser) return "G";
    if (!user) return "U";
    
    if (user.firstName) {
      return user.firstName[0].toUpperCase();
    }
    
    if (user.emailAddresses && user.emailAddresses.length > 0) {
      return user.emailAddresses[0].emailAddress[0].toUpperCase();
    }
    
    return "U";
  };
  
  // Get display name for dropdown
  const getUserDisplayName = (): string => {
    if (isGuestUser) return "Guest User";
    if (!user) return "User";
    
    if (user.fullName) {
      return user.fullName;
    }
    
    if (user.emailAddresses && user.emailAddresses.length > 0) {
      return user.emailAddresses[0].emailAddress;
    }
    
    return "User";
  };
  
  return (
    <nav className="w-full bg-black text-white border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-24">
          <div className="flex items-center">
            <Link href="/">
              <span className="flex-shrink-0 flex items-center cursor-pointer">
                <LogoIcon className="h-[90px] w-auto text-white" />
                <span className="ml-2 text-xl font-bold text-white">CANCELMYSUBS</span>
              </span>
            </Link>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="flex space-x-8 items-center">
              <Link href="/">
                <span className={`text-white px-3 py-2 text-base font-medium uppercase tracking-wide cursor-pointer ${location === '/' ? 'underline' : ''}`}>
                  HOME
                </span>
              </Link>
              <Link href="/dashboard">
                <span className={`text-white px-3 py-2 text-base font-medium uppercase tracking-wide cursor-pointer ${location === '/dashboard' ? 'underline' : ''}`}>
                  APP
                </span>
              </Link>
              <Link href="/blog">
                <span className={`text-white px-3 py-2 text-base font-medium uppercase tracking-wide cursor-pointer ${location.startsWith('/blog') ? 'underline' : ''}`}>
                  BLOG
                </span>
              </Link>
              <span className="text-white px-3 py-2 text-base font-medium uppercase tracking-wide cursor-pointer">
                CHROME EXTENSION
              </span>
            </div>
          </div>
          
          <div className="flex items-center">
            {/* Guest mode indicator */}
            {isGuestUser && (
              <div className="mr-4 flex items-center bg-gray-700 px-3 py-1 rounded-full">
                <Info className="h-4 w-4 mr-2 text-gray-300" />
                <span className="text-sm text-gray-300">Guest Mode</span>
              </div>
            )}
            
            {/* Test Button */}
            <Button 
              onClick={handleTestClick}
              className="mr-4 bg-green-600 hover:bg-green-700 text-white"
              variant="default"
            >
              <TestTube className="mr-2 h-4 w-4" />
              TEST
            </Button>
            
            {!isLoaded && !isGuestUser ? (
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            ) : isSignedIn && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full text-white hover:bg-gray-800">
                    {user.imageUrl ? (
                      <img 
                        src={user.imageUrl} 
                        alt={user.fullName || "User"} 
                        className="h-8 w-8 rounded-full" 
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white">
                        <span className="text-xs font-bold">{getUserInitial()}</span>
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>{getUserDisplayName()}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-500 focus:text-red-500" 
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                  >
                    {isSigningOut ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : isGuestUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full text-white hover:bg-gray-800">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white">
                      <span className="text-xs font-bold">G</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Guest User</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-500 focus:text-red-500" 
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                  >
                    {isSigningOut ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button className="bg-white text-black hover:bg-gray-200 font-medium text-base" variant="default">LOGIN</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
