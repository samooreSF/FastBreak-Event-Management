"use client";

import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User } from "lucide-react";
import { signInWithGoogle, signOut } from "@/actions/auth";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface AuthButtonProps {
  user: SupabaseUser | null;
}

// Type guard for error response
function isErrorResponse(result: unknown): result is { error: string } {
  return (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    typeof (result as { error: unknown }).error === "string"
  );
}

export function AuthButton({ user }: AuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isNavigatingRef = useRef(false);

  const handleSignIn = async () => {
    if (isNavigatingRef.current || isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();

      // Type guard: Check if result is a string (OAuth URL)
      if (typeof result === "string" && result.length > 0) {
        isNavigatingRef.current = true;
        window.location.href = result;
        return;
      }

      // Type guard: Check if result is an error response
      if (!isNavigatingRef.current && isErrorResponse(result)) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to initiate sign-in",
        });
        setIsLoading(false);
      } else if (!isNavigatingRef.current) {
        // Fallback for unexpected result types
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to initiate sign-in. Please try again.",
        });
        setIsLoading(false);
      }
    } catch (error) {
      if (!isNavigatingRef.current) {
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
        });
        setIsLoading(false);
      }
    }
  };

  const handleSignOut = async () => {
    if (isNavigatingRef.current || isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await signOut();

      // Type guard: Check if result has an error property
      if (isErrorResponse(result) && !isNavigatingRef.current) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Sign out failed",
        });
        setIsLoading(false);
      } else if (!isErrorResponse(result) && !isNavigatingRef.current) {
        // Success case - no error property means success
        isNavigatingRef.current = true;
        window.location.replace("/");
      }
    } catch (error) {
      if (!isNavigatingRef.current) {
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
        });
        setIsLoading(false);
      }
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span className="truncate max-w-[120px] lg:max-w-none">
            {user?.email || "User"}
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
