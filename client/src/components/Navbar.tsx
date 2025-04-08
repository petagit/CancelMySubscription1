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
import { useState } from "react";
import { useClerk, useUser } from "@clerk/clerk-react";

export default function Navbar() {
  const location = useRouterLocation();
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // Use Clerk to manage authentication
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  
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
              <RouterLink to="/auth">
                <Button className="bg-white text-black hover:bg-gray-200 font-medium text-base" variant="default">LOGIN</Button>
              </RouterLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
