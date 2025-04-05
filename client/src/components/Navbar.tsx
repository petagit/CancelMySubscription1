import { Link, useLocation } from "wouter";
import LogoIcon from "./LogoIcon";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [location] = useLocation();
  
  return (
    <nav className="w-full border-b border-accent">
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
            {/* Avatar placeholder for logged-in user */}
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700">
              <span className="text-xs font-bold">U</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
