"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  withErrorHandling,
  handleAuthError,
  isNextRedirectError,
  type ActionResult,
} from "@/types/errors";
import type { User } from "@supabase/supabase-js";

export async function signInWithGoogle() {
  try {
    const supabase = await createClient();

    // Get the app URL for the callback
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : undefined);

    if (!appUrl) {
      throw new Error(
        "Missing NEXT_PUBLIC_APP_URL environment variable. Please check your env variables."
      );
    }

    const redirectTo = `${appUrl}/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      const errorResponse = handleAuthError(error);
      throw new Error(errorResponse.error);
    }

    if (!data?.url) {
      throw new Error("Failed to generate OAuth URL");
    }

    // Use redirect() to avoid input stream errors
    // This throws a redirect error that Next.js handles properly
    redirect(data.url);
  } catch (error) {
    // Re-throw redirect errors (they must propagate)
    if (isNextRedirectError(error)) {
      throw error;
    }
    
    // Handle other errors
    const errorResponse = handleAuthError(error);
    throw new Error(errorResponse.error);
  }
}

export async function signOut() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      const errorResponse = handleAuthError(error);
      throw new Error(errorResponse.error);
    }

    // Use redirect() to avoid input stream errors
    // This throws a redirect error that Next.js handles properly
    redirect("/");
  } catch (error) {
    // Re-throw redirect errors (they must propagate)
    if (isNextRedirectError(error)) {
      throw error;
    }
    
    // Handle other errors
    const errorResponse = handleAuthError(error);
    throw new Error(errorResponse.error);
  }
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
    const supabase = await createClient();

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
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const errorResponse = handleAuthError(error);
      throw new Error(errorResponse.error);
    }

    return { success: true };
  });
}
