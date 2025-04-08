import { SignIn, SignUp } from "@clerk/clerk-react";
import LogoIcon from "@/components/LogoIcon";

interface AuthPageProps {
  defaultTab?: "sign-in" | "sign-up";
}

// Simple auth page component exactly like the example
export default function AuthPage({ defaultTab = "sign-in" }: AuthPageProps) {
  // Render either the SignIn or SignUp component based on the defaultTab prop
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <LogoIcon className="h-12 w-12" />
        </div>
        
        <div className="rounded-lg bg-white p-8 shadow-md">
          {defaultTab === "sign-in" ? (
            <SignIn 
              path="/sign-in"
              routing="path"
              signUpUrl="/sign-up"
              appearance={{
                elements: {
                  formButtonPrimary: "bg-black hover:bg-gray-800 text-white",
                  card: "shadow-none"
                }
              }}
            />
          ) : (
            <SignUp 
              path="/sign-up"
              routing="path"
              signInUrl="/sign-in"
              appearance={{
                elements: {
                  formButtonPrimary: "bg-black hover:bg-gray-800 text-white",
                  card: "shadow-none"
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}