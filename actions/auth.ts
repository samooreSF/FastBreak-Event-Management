"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import {
  withErrorHandling,
  handleAuthError,
  isNextRedirectError,
  type ActionResult,
} from "@/lib/errors";
import type { User } from "@supabase/supabase-js";

export async function signInWithGoogle(): Promise<ActionResult<string>> {
  return withErrorHandling(async () => {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Get the app URL for the callback
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error(
        "Missing NEXT_PUBLIC_APP_URL environment variable. Please check your env variables."
      );
    }

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
      throw new Error(errorResponse.error);
    }

    if (!data?.url) {
      console.error("No URL returned from signInWithOAuth");
      throw new Error("Failed to generate OAuth URL");
    }

    console.log(
      "OAuth URL generated successfully:",
      data.url.substring(0, 50) + "..."
    );

    return data.url;
  });
}

export async function signOut(): Promise<ActionResult<{ redirectTo: string }>> {
  return withErrorHandling(async () => {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const { error } = await supabase.auth.signOut();

    if (error) {
      const errorResponse = handleAuthError(error);
      throw new Error(errorResponse.error);
    }

    // Return redirect URL with signout flag for middleware to handle
    // Middleware will redirect cleanly before React renders, preventing flash
    return { redirectTo: "/?signout=success" };
  });
}

/**
 * Check if an error is a "session missing" error (expected when user is not authenticated)
 */
function isSessionMissingError(error: unknown): boolean {
  if (error && typeof error === "object" && "message" in error) {
    const message = String(error.message);
    return (
      message.includes("Auth session missing") ||
      message.includes("session missing") ||
      (error as { status?: number }).status === 400
    );
  }
  return false;
}

export async function getUser(): Promise<ActionResult<User | null>> {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Handle "Auth session missing" as a normal state (user not authenticated), not an error
    if (error) {
      if (isSessionMissingError(error)) {
        // This is expected - user is simply not authenticated
        return { data: null, error: null };
      }

      // For other auth errors, return the error
      const errorResponse = handleAuthError(error);
      return { error: errorResponse.error };
    }

    return { data: user || null, error: null };
  } catch (err: unknown) {
    // Re-throw Next.js redirect errors
    if (isNextRedirectError(err)) {
      throw err;
    }

    console.error("Error in getUser:", err);

    // Check if it's a session missing error
    if (isSessionMissingError(err)) {
      return { data: null, error: null };
    }

    const errorResponse = handleAuthError(err);
    return { error: errorResponse.error };
  }
}

/**
 * Helper function to extract user from getUser() result
 * Returns null if there's an error (user is not authenticated)
 */
export async function getCurrentUser(): Promise<User | null> {
  const result = await getUser();
  return result.data ?? null;
}

/**
 * Exchange OAuth authorization code for a session
 * Used by the callback route handler
 */
export async function exchangeCodeForSession(
  code: string
): Promise<ActionResult<{ success: true }>> {
  return withErrorHandling(async () => {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const errorResponse = handleAuthError(error);
      throw new Error(errorResponse.error);
    }

    return { success: true };
  });
}
