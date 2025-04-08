import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BugIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DevModeToggleProps {
  onDevModeChange?: (enabled: boolean) => void;
}

export default function DevModeToggle({ onDevModeChange }: DevModeToggleProps) {
  // Check if dev mode is already enabled in localStorage
  const [isDevMode, setIsDevMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("devMode");
    return saved === "true";
  });

  // Generate a guest ID if one doesn't exist
  const [guestId, setGuestId] = useState<string>(() => {
    const existing = localStorage.getItem("guestId");
    if (existing) return existing;
    
    const newGuestId = `guest_${Date.now()}`;
    localStorage.setItem("guestId", newGuestId);
    return newGuestId;
  });

  // Report the dev mode status to the parent component when it changes
  useEffect(() => {
    if (onDevModeChange) {
      onDevModeChange(isDevMode);
    }
  }, [isDevMode, onDevModeChange]);

  const toggleDevMode = () => {
    const newState = !isDevMode;
    setIsDevMode(newState);
    localStorage.setItem("devMode", String(newState));
    
    if (newState) {
      // Enable dev mode - ensure there's a guest ID
      if (!localStorage.getItem("guestId")) {
        const newGuestId = `guest_${Date.now()}`;
        localStorage.setItem("guestId", newGuestId);
        setGuestId(newGuestId);
      }
      
      toast({
        title: "Dev Mode Enabled",
        description: `Using guest ID: ${guestId}`,
      });
    } else {
      toast({
        title: "Dev Mode Disabled",
        description: "Returning to normal authentication",
      });
    }
  };

  return (
    <Button
      variant={isDevMode ? "destructive" : "outline"}
      size="sm"
      onClick={toggleDevMode}
      className="fixed bottom-4 right-4 z-50"
    >
      <BugIcon className="mr-2 h-4 w-4" />
      {isDevMode ? "Exit Dev Mode" : "Enter Dev Mode"}
    </Button>
  );
}