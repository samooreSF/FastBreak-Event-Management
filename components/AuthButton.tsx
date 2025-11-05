"use client";

import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User, Loader2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { getError } from "@/lib/errors";

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
    setIsRedirecting(true);
    
    try {
      const supabase = createBrowserSupabaseClient();

      // Get the app URL for the callback
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const redirectTo = `${appUrl}/auth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) {
        setIsLoading(false);
        setIsRedirecting(false);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to initiate sign-in",
        });
        return;
      }

      // Success - browser client returns OAuth URL
      // Redirect to the OAuth URL - browser client handles this smoothly
      if (data?.url) {
        isNavigatingRef.current = true;
        // Browser client redirect - no server-side streaming conflicts
        window.location.href = data.url;
      }
    } catch (error) {
      if (!isNavigatingRef.current) {
        setIsLoading(false);
        setIsRedirecting(false);
        const errorMessage = getError(error) || "An unexpected error occurred";
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
        });
      }
    }
  };

  const handleSignOut = async () => {
    if (isNavigatingRef.current || isLoading) return;

    setIsLoading(true);
    setIsRedirecting(true); // Show loading overlay immediately

    try {
      const supabase = createBrowserSupabaseClient();

      const { error } = await supabase.auth.signOut();

      if (error) {
        setIsLoading(false);
        setIsRedirecting(false);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Sign out failed",
        });
        return;
      }

      // Success - redirect to home page
      // Browser client handles this smoothly without server-side streaming conflicts
      isNavigatingRef.current = true;
      window.location.replace("/");
    } catch (error) {
      if (!isNavigatingRef.current) {
        setIsLoading(false);
        setIsRedirecting(false);
        const errorMessage = getError(error) || "An unexpected error occurred";
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
        });
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
        <div className="flex-center-responsive">
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
