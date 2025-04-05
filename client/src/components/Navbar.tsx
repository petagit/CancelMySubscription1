import { Link, useLocation } from "wouter";
import LogoIcon from "./LogoIcon";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, User, LogOut } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();
  const { user, logoutMutation, isLoading } = useAuth();
  
  return (
    <nav className="w-full bg-black text-white border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/">
              <span className="flex-shrink-0 flex items-center cursor-pointer">
                <LogoIcon className="h-8 w-8 text-white" />
                <span className="ml-2 text-xl font-bold text-white">CANCELMYSUBS</span>
              </span>
            </Link>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="flex space-x-4">
              <Link href="/">
                <span className={`text-white px-3 py-2 text-sm font-medium cursor-pointer ${location === '/' ? 'underline' : ''}`}>
                  home
                </span>
              </Link>
              <Link href="/dashboard">
                <span className={`text-white px-3 py-2 text-sm font-medium cursor-pointer ${location === '/dashboard' ? 'underline' : ''}`}>
                  app
                </span>
              </Link>
              <span className="text-white px-3 py-2 text-sm font-medium cursor-pointer">
                chrome extension
              </span>
            </div>
          </div>
          
          <div className="flex items-center">
            {isLoading ? (
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full text-white hover:bg-gray-800">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white">
                      <span className="text-xs font-bold">{user.username.charAt(0).toUpperCase()}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>{user.username}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-500 focus:text-red-500" 
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? (
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
                <Button className="bg-white text-black hover:bg-gray-200" variant="default">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
