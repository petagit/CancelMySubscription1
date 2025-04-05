import LogoIcon from "./LogoIcon";

export default function Footer() {
  return (
    <footer className="py-6 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <LogoIcon className="h-6 w-6 text-white" />
            <span className="ml-2 text-sm font-bold text-white">CANCELMYSUBS</span>
          </div>
          
          <div className="text-white text-sm">
            &copy; {new Date().getFullYear()} CancelMySubs. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
