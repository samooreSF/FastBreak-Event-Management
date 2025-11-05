"use client";

import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User } from "lucide-react";
import { signInWithGoogle, signOut } from "@/actions/auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface AuthButtonProps {
  user: SupabaseUser | null;
}

export function AuthButton({ user }: AuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // This component uses the google sign in action to authenticate user
  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();

      // console.log("Sign in result:", result);

      if (typeof result === "string") {
        // Server action returned a URL - redirect client-side
        window.location.href = result;
        return; // Exit early to prevent any state updates
      } else if (result?.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
        setIsLoading(false);
      } else {
        // Unexpected result format
        console.error("Unexpected sign-in result:", result);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to initiate sign-in. Please try again.",
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Sign-in error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const result = await signOut();

      if (result?.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
        setIsLoading(false);
      } else {
        // Sign out successful - do a full page reload to ensure server components
        // re-fetch the user state (which will now be null)
        // Use window.location.href for full page reload after sign-out
        // This ensures all server components re-render with updated auth state
        window.location.href = "/";
        return; // Exit early to prevent any state updates
      }
    } catch (error) {
      console.error("Sign-out error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span className="truncate max-w-[120px] lg:max-w-none">
            {user.email}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          disabled={isLoading}
        >
          <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          <span className="hidden sm:inline">
            {isLoading ? "Signing out..." : "Sign Out"}
          </span>
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" onClick={handleSignIn} disabled={isLoading}>
      <LogIn className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
      <span className="hidden sm:inline">
        {isLoading ? "Signing in..." : "Sign in with Google"}
      </span>
      <span className="sm:hidden">
        {isLoading ? "Signing in..." : "Sign in"}
      </span>
    </Button>
  );
}
