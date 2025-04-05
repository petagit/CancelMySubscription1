import { Link, useLocation } from "wouter";
import LogoIcon from "./LogoIcon";
import { Button } from "@/components/ui/button";

// For development purposes, we'll bypass authentication
const isDevelopment = true;

export default function Navbar() {
  const [location] = useLocation();
  
  return (
    <nav className="w-full border-b border-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/">
              <a className="flex-shrink-0 flex items-center">
                <LogoIcon className="h-8 w-8 text-white" />
                <span className="ml-2 text-xl font-bold text-white">CANCELMYSUBS</span>
              </a>
            </Link>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="flex space-x-4">
              <Link href="/">
                <a className={`text-white px-3 py-2 text-sm font-medium ${location === '/' ? 'underline' : ''}`}>
                  home
                </a>
              </Link>
              <Link href="/dashboard">
                <a className={`text-white px-3 py-2 text-sm font-medium ${location === '/dashboard' ? 'underline' : ''}`}>
                  app
                </a>
              </Link>
              <a href="#" className="text-white px-3 py-2 text-sm font-medium">
                chrome extension
              </a>
            </div>
          </div>
          
          <div className="flex items-center">
            {isDevelopment ? (
              // Development mode: show avatar placeholder
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700">
                <span className="text-xs font-bold">U</span>
              </div>
            ) : (
              // Production mode with Clerk authentication
              <>
                {/* These would be wrapped in ClerkProvider in production */}
                <Link href="/sign-in">
                  <Button variant="outline" className="text-white border-white">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
