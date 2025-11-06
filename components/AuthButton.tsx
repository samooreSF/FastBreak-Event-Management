"use client";

import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User, Loader2 } from "lucide-react";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { signInWithGoogle, signOut as signOutAction } from "@/actions/auth";
import { isNextRedirectError } from "@/types/errors";

interface AuthButtonProps {
  user: SupabaseUser | null;
}

export function AuthButton({ user }: AuthButtonProps) {
  const { handleError } = useErrorHandler();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignIn = async () => {
    if (isSigningIn) return;

    setIsSigningIn(true);

    try {
      // signInWithGoogle() uses redirect() - it will throw a redirect error
      // which Next.js handles automatically, so we don't need to handle the return value
      await signInWithGoogle();
    } catch (error) {
      // Only handle non-redirect errors
      // Redirect errors are handled by Next.js automatically
      if (!isNextRedirectError(error)) {
        setIsSigningIn(false);
        handleError(error, {
          title: "Error",
          fallbackMessage: "Failed to initiate sign-in",
        });
      }
    }
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);

    try {
      // signOut() uses redirect() - it will throw a redirect error
      // which Next.js handles automatically, so we don't need to handle the return value
      await signOutAction();
    } catch (error) {
      // Only handle non-redirect errors
      // Redirect errors are handled by Next.js automatically
      if (!isNextRedirectError(error)) {
        setIsSigningOut(false);
        handleError(error, {
          title: "Error",
          fallbackMessage: "Sign out failed",
        });
      }
    }
  };

  if (user) {
    return (
      <div className="flex-center-responsive">
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span className="truncate max-w-[120px] lg:max-w-none">
            {user?.email || "User"}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut} disabled={isSigningOut}>
          {isSigningOut ? (
            <>
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2 animate-spin" />
              <span className="hidden sm:inline">Signing out...</span>
              <span className="sm:hidden">Signing out...</span>
            </>
          ) : (
            <>
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" onClick={handleSignIn} disabled={isSigningIn}>
      {isSigningIn ? (
        <>
          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2 animate-spin" />
          <span className="hidden sm:inline">Signing in...</span>
          <span className="sm:hidden">Signing in...</span>
        </>
      ) : (
        <>
          <LogIn className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          <span className="hidden sm:inline">Sign in with Google</span>
          <span className="sm:hidden">Sign in</span>
        </>
      )}
    </Button>
  );
}
