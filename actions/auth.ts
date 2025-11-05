"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import {
  withErrorHandling,
  handleAuthError,
  type ActionResult,
} from "@/lib/errors";
import type { User } from "@supabase/supabase-js";

export async function signInWithGoogle(): Promise<string | { error: string }> {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Get the app URL for the callback
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectTo = `${appUrl}/auth/callback`;

    console.log("Initiating Google OAuth with redirectTo:", redirectTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.error("Google sign-in error:", error);
      const errorResponse = handleAuthError(error);
      return { error: errorResponse.error };
    }

    if (!data?.url) {
      console.error("No URL returned from signInWithOAuth");
      return { error: "Failed to generate OAuth URL" };
    }

    console.log(
      "OAuth URL generated successfully:",
      data.url.substring(0, 50) + "..."
    );

    // Return the URL as a string for client-side redirect
    return data.url;
  } catch (err: unknown) {
    // Re-throw Next.js redirect errors
    if (
      err &&
      typeof err === "object" &&
      (("message" in err && err.message === "NEXT_REDIRECT") ||
        ("digest" in err && typeof err.digest === "string" && err.digest.startsWith("NEXT_REDIRECT")))
    ) {
      throw err;
    }
    
    console.error("Error in signInWithGoogle:", err);
    const errorResponse = handleAuthError(err);
    return { error: errorResponse.error };
  }
}

export async function signOut(): Promise<ActionResult<{ success: boolean }>> {
  return withErrorHandling(async () => {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw handleAuthError(error);
    }

    // Don't redirect here - let the client component handle navigation
    // Server actions called from client components shouldn't redirect
    return { success: true };
  });
}

export async function getUser(): Promise<{ user: User | null; error: string | null }> {
  try {
    // Always pass cookies() in server actions to allow Supabase to modify cookies if needed (e.g., token refresh)
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Handle "Auth session missing" as a normal state (user not authenticated), not an error
    if (error) {
      // Check if it's a session missing error (expected when user is not signed in)
      if (
        error.message?.includes("Auth session missing") ||
        error.message?.includes("session missing") ||
        error.status === 400
      ) {
        // This is expected - user is simply not authenticated
        return { user: null, error: null };
      }
      
      // For other auth errors, return the error
      const errorResponse = handleAuthError(error);
      return { user: null, error: errorResponse.error };
    }

    return { user: user || null, error: null };
  } catch (err: unknown) {
    // Re-throw Next.js redirect errors
    if (
      err &&
      typeof err === "object" &&
      (("message" in err && err.message === "NEXT_REDIRECT") ||
        ("digest" in err &&
          typeof err.digest === "string" &&
          err.digest.startsWith("NEXT_REDIRECT")))
    ) {
      throw err;
    }
    
    console.error("Error in getUser:", err);
    // Check if it's a session missing error
    if (
      err instanceof Error &&
      (err.message?.includes("Auth session missing") ||
        err.message?.includes("session missing"))
    ) {
      return { user: null, error: null };
    }
    
    const errorResponse = handleAuthError(err);
    return { user: null, error: errorResponse.error };
  }
}

/**
 * Exchange OAuth authorization code for a session
 * Used by the callback route handler
 */
export async function exchangeCodeForSession(code: string): Promise<{ error: string | null }> {
  return withErrorHandling(async () => {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      throw handleAuthError(error);
    }

    return { success: true };
  }).then((result) => {
    if ("error" in result && result.error !== null) {
      return { error: result.error };
    }
    return { error: null };
  });
}
