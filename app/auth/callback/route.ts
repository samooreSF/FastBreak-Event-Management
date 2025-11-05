// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { exchangeCodeForSession } from "@/actions/auth";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const origin = requestUrl.origin;

  // Handle OAuth errors from Supabase/Google
  if (error) {
    console.error("OAuth error from provider:", {
      error,
      errorDescription,
    });
    const errorMessage = errorDescription
      ? encodeURIComponent(errorDescription)
      : encodeURIComponent(error || "Authentication failed");
    return NextResponse.redirect(`${origin}/?error=${errorMessage}`, 307);
  }

  // Handle missing code
  if (!code) {
    console.error("No authorization code received in callback");
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(
        "No authorization code received"
      )}`,
      307
    );
  }

  try {
    // Use the reusable server action for code exchange
    const result = await exchangeCodeForSession(code);

    if (result.error) {
      console.error("Error exchanging code for session:", result.error);

      // Handle rate limit errors gracefully
      if (result.error.includes("rate limit") || result.error.includes("Too many")) {
        return NextResponse.redirect(
          `${origin}/?error=${encodeURIComponent(
            "Too many authentication attempts. Please wait a moment and try again."
          )}`,
          307
        );
      }

      return NextResponse.redirect(
        `${origin}/?error=${encodeURIComponent(result.error)}`,
        307
      );
    }

    // Success - Supabase sets session cookies automatically
    // Use 307 (Temporary Redirect) to preserve POST method and prevent streaming errors
    return NextResponse.redirect(`${origin}/`, 307);
  } catch (err: unknown) {
    // Check if this is a redirect error (Next.js uses this internally)
    if (
      err &&
      typeof err === "object" &&
      (("message" in err && err.message === "NEXT_REDIRECT") ||
        ("digest" in err &&
          typeof err.digest === "string" &&
          err.digest.startsWith("NEXT_REDIRECT")))
    ) {
      // Re-throw redirect errors - Next.js handles them
      throw err;
    }

    // Handle streaming errors gracefully
    if (
      err instanceof Error &&
      (err.message?.includes("input stream") ||
        err.message?.includes("stream"))
    ) {
      // Silently redirect - streaming errors are often transient
      return NextResponse.redirect(`${origin}/`, 307);
    }

    // Handle actual errors
    console.error("Unexpected error in callback:", err);

    // Check for rate limit errors
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      err.status === 429
    ) {
      return NextResponse.redirect(
        `${origin}/?error=${encodeURIComponent(
          "Too many authentication attempts. Please wait a moment and try again."
        )}`,
        307
      );
    }

    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(errorMessage)}`,
      307
    );
  }
}
