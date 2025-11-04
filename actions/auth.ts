"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function signInWithGoogle() {
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
      return { error: error.message };
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
  } catch (err: any) {
    console.error("Error in signInWithGoogle:", err);
    return { error: err.message || "Failed to initiate Google sign-in" };
  }
}

export async function signOut() {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: error.message };
    }

    // Don't redirect here - let the client component handle navigation
    // Server actions called from client components shouldn't redirect
    return { success: true };
  } catch (err: any) {
    // Check if this is a redirect error (Next.js uses this internally)
    if (
      err.message === "NEXT_REDIRECT" ||
      err.digest?.startsWith("NEXT_REDIRECT")
    ) {
      // Re-throw redirect errors - Next.js handles them
      throw err;
    }

    console.error("Error in signOut:", err);
    return { error: err.message || "Failed to sign out" };
  }
}

export async function getUser() {
  try {
    // Always pass cookies() in server actions to allow Supabase to modify cookies if needed (e.g., token refresh)
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return { user: null, error: error.message };
    }

    return { user, error: null };
  } catch (err: any) {
    console.error("Error in getUser:", err);
    return { user: null, error: err.message || "Failed to get user" };
  }
}
