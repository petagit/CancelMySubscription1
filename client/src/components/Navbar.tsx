import { Link as RouterLink, useLocation as useRouterLocation } from "react-router-dom";
import LogoIcon from "./LogoIcon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, User, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { CrownIcon } from "lucide-react";

export default function Navbar() {
  const location = useRouterLocation();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  
  // Use Clerk to manage authentication
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  
  // Check premium status
  useEffect(() => {
    if (isSignedIn) {
      const checkPremiumStatus = async () => {
        try {
          const response = await fetch('/api/subscription-status');
          if (response.ok) {
            const data = await response.json();
            setIsPremium(data.isPremium);
          }
        } catch (error) {
          console.error('Error checking premium status:', error);
        }
      };
      
      checkPremiumStatus();
    }
  }, [isSignedIn]);
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      
      if (signOut) {
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
    if (!user) return "G"; // G for Guest
    
    if (user.firstName) {
      return user.firstName[0].toUpperCase();
    }
    
    if (user.fullName && user.fullName.length > 0) {
      return user.fullName[0].toUpperCase();
    }
    
    if (user.emailAddresses && user.emailAddresses.length > 0) {
      return user.emailAddresses[0].emailAddress[0].toUpperCase();
    }
    
    return user.username?.[0]?.toUpperCase() || "U";
  };
  
  // Get background color for avatar based on user's initial
  const getAvatarBgColor = (): string => {
    const initial = getUserInitial();
    // Generate consistent color based on initial
    const colors = [
      "bg-blue-600", "bg-green-600", "bg-purple-600", 
      "bg-red-600", "bg-yellow-600", "bg-pink-600",
      "bg-indigo-600", "bg-teal-600", "bg-orange-600"
    ];
    
    // Simple hash function to get consistent color for same initial
    const index = initial.charCodeAt(0) % colors.length;
    return colors[index];
  };
  
  // Get display name for dropdown
  const getUserDisplayName = (): string => {
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
            <RouterLink to="/">
              <span className="flex-shrink-0 flex items-center cursor-pointer">
                <LogoIcon className="h-[90px] w-auto text-white" />
                <span className="ml-2 text-xl font-bold text-white">CANCELMYSUBS</span>
              </span>
            </RouterLink>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="flex space-x-8 items-center">
              <RouterLink to="/">
                <span className={`text-white px-3 py-2 text-base font-medium uppercase tracking-wide cursor-pointer ${location.pathname === '/' ? 'underline' : ''}`}>
                  HOME
                </span>
              </RouterLink>
              <RouterLink to="/dashboard">
                <span className={`text-white px-3 py-2 text-base font-medium uppercase tracking-wide cursor-pointer ${location.pathname === '/dashboard' ? 'underline' : ''}`}>
                  APP
                </span>
              </RouterLink>
              <RouterLink to="/blog">
                <span className={`text-white px-3 py-2 text-base font-medium uppercase tracking-wide cursor-pointer ${location.pathname.startsWith('/blog') ? 'underline' : ''}`}>
                  BLOG
                </span>
              </RouterLink>
              <span className="text-white px-3 py-2 text-base font-medium uppercase tracking-wide cursor-pointer">
                CHROME EXTENSION
              </span>
            </div>
          </div>
          
          <div className="flex items-center">
            {!isLoaded ? (
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            ) : isSignedIn && user ? (
              <div className="flex items-center gap-3">
                {/* Display user email/name with white text */}
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-white font-medium">
                    {getUserDisplayName()}
                  </span>
                  
                  {/* Premium badge */}
                  {isPremium && (
                    <div className="bg-gradient-to-r from-amber-400 to-yellow-300 text-black text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <CrownIcon className="h-3 w-3" />
                      <span>PREMIUM</span>
                    </div>
                  )}
                </div>
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
                        <div className={`w-8 h-8 rounded-full ${getAvatarBgColor()} flex items-center justify-center text-white shadow-md ring-2 ring-white/10`}>
                          <span className="text-sm font-bold tracking-wider">{getUserInitial()}</span>
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>{getUserDisplayName()}</span>
                    </DropdownMenuItem>
                    
                    {/* Show plan status in the dropdown */}
                    <DropdownMenuItem className="cursor-default">
                      {isPremium ? (
                        <div className="flex items-center text-amber-600">
                          <CrownIcon className="mr-2 h-4 w-4" />
                          <span className="font-medium">Premium Plan</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-gray-600">
                          <span className="mr-2 h-4 w-4">🔹</span>
                          <span>Free Plan</span>
                        </div>
                      )}
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
              </div>
            ) : (
              <RouterLink to="/sign-in">
                <Button className="bg-white text-black hover:bg-gray-200 font-medium text-base" variant="default">LOGIN</Button>
              </RouterLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
