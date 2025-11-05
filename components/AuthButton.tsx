"use client";

import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User } from "lucide-react";
import { signInWithGoogle, signOut } from "@/actions/auth";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { isErrorResponse, getError } from "@/lib/errors";

interface AuthButtonProps {
  user: SupabaseUser | null;
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

      // Check if it's an error response
      if (isErrorResponse(result)) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to initiate sign-in",
        });
        setIsLoading(false);
        return;
      }

      // Success - result.data is the OAuth URL
      // No need to setIsLoading(false) - component will unmount on redirect
      if (result.data) {
        isNavigatingRef.current = true;
        window.location.replace(result.data);
      }
    } catch (error) {
      if (!isNavigatingRef.current) {
        const errorMessage = getError(error) || "An unexpected error occurred";
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

      // Check if it's an error response
      if (isErrorResponse(result)) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Sign out failed",
        });
        setIsLoading(false);
        return;
      }

      // Success - redirect to home page
      // No need to setIsLoading(false) - component will unmount on redirect
      isNavigatingRef.current = true;
      window.location.replace("/");
    } catch (error) {
      if (!isNavigatingRef.current) {
        const errorMessage = getError(error) || "An unexpected error occurred";
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
