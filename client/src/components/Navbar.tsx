import { Link, useLocation } from "wouter";
import LogoIcon from "./LogoIcon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, User, LogOut, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";

export default function Navbar() {
  const [location] = useLocation();
  const [isGuestUser, setIsGuestUser] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // Get auth state directly from hooks with built-in error handling
  const { isLoaded: clerkLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [clerkError, setClerkError] = useState(false);
  
  // Check if user is in guest mode
  useEffect(() => {
    try {
      const guestId = localStorage.getItem("guestId");
      setIsGuestUser(!isSignedIn && !!guestId);
    } catch (e) {
      console.error("Error checking guest mode:", e);
    }
  }, [isSignedIn]);

  // Handle sign out with error handling
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      if (signOut) {
        await signOut();
      } else {
        // Fallback for when Clerk is not available
        localStorage.removeItem("guestId");
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error signing out:", error);
      setClerkError(true);
    } finally {
      setIsSigningOut(false);
    }
  };
  
  // Extract user display information safely
  const getUserInitial = (): string => {
    if (!user) return "U";
    
    try {
      if (user.firstName && user.firstName.length > 0) {
        return user.firstName[0].toUpperCase();
      }
      
      if (user.emailAddresses && 
          user.emailAddresses.length > 0 &&
          user.emailAddresses[0].emailAddress) {
        return user.emailAddresses[0].emailAddress[0].toUpperCase();
      }
      
      return "U";
    } catch (e) {
      return "U";
    }
  };
  
  const getUserDisplayName = (): string => {
    if (!user) return "User";
    
    try {
      if (user.fullName) {
        return user.fullName;
      }
      
      if (user.emailAddresses && 
          user.emailAddresses.length > 0 &&
          user.emailAddresses[0].emailAddress) {
        return user.emailAddresses[0].emailAddress;
      }
      
      return "User";
    } catch (e) {
      return "User";
    }
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
            
            {/* Auth error indicator */}
            {clerkError && (
              <div className="mr-4 flex items-center bg-amber-700 px-3 py-1 rounded-full">
                <Info className="h-4 w-4 mr-2 text-amber-100" />
                <span className="text-sm text-amber-100">Auth Maintenance</span>
              </div>
            )}
            
            {!clerkLoaded ? (
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
