"use client";

import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User, Loader2 } from "lucide-react";
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
  const [isRedirecting, setIsRedirecting] = useState(false);
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
      // Show loading overlay before redirect to mask any flash
      if (result.data) {
        isNavigatingRef.current = true;
        setIsRedirecting(true);
        // Small delay to ensure loading overlay renders before redirect
        setTimeout(() => {
          window.location.replace(result.data);
        }, 50);
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

      // Success - redirect using URL from server action
      if (result.data?.redirectTo) {
        isNavigatingRef.current = true;
        setIsRedirecting(true);
        // Small delay to ensure loading overlay renders before redirect
        setTimeout(() => {
          window.location.replace(result.data.redirectTo);
        }, 50);
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

  if (user) {
    return (
      <>
        {isRedirecting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Signing out...</p>
            </div>
          </div>
        )}
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
      </>
    );
  }

  return (
    <>
      {isRedirecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {user ? "Signing out..." : "Signing in..."}
            </p>
          </div>
        </div>
      )}
      <Button size="sm" onClick={handleSignIn} disabled={isLoading}>
        <LogIn className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
        <span className="hidden sm:inline">
          {isLoading ? "Signing in..." : "Sign in with Google"}
        </span>
        <span className="sm:hidden">
          {isLoading ? "Signing in..." : "Sign in"}
        </span>
      </Button>
    </>
  );
}
