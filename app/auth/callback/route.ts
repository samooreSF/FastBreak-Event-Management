// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { exchangeCodeForSession } from "@/actions/auth";
import { isErrorResponse, isNextRedirectError, ErrorCode } from "@/lib/errors";

// Disable streaming for this route to prevent "input stream" errors during redirects
// force-dynamic prevents Next.js from trying to stream the response
export const dynamic = "force-dynamic";
// Explicitly use Node.js runtime (default, but explicit for clarity)
// Required for reliable cookie handling with Supabase auth
export const runtime = "nodejs";

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
    
    // Use replace instead of redirect to avoid streaming conflicts
    return NextResponse.redirect(`${origin}/?error=${errorMessage}`, {
      status: 307,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }

  // Handle missing code
  if (!code) {
    console.error("No authorization code received in callback");
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(
        "No authorization code received"
      )}`,
      {
        status: 307,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }

  try {
    // Add retry logic for rate limit errors
    let result;
    let retries = 0;
    const maxRetries = 2;
    
    while (retries <= maxRetries) {
      result = await exchangeCodeForSession(code);

      // Check if there's an error
      if (isErrorResponse(result)) {
        const isRateLimit = 
          result.code === ErrorCode.RATE_LIMIT ||
          result.error.toLowerCase().includes("rate limit") || 
          result.error.toLowerCase().includes("too many");

        // Retry on rate limit with exponential backoff
        if (isRateLimit && retries < maxRetries) {
          retries++;
          const delay = Math.min(1000 * Math.pow(2, retries), 5000); // Max 5 seconds
          console.log(`Rate limit hit, retrying after ${delay}ms (attempt ${retries}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Handle final error or non-rate-limit error
        console.error("Error exchanging code for session:", result.error);
        redirect(`/?error=${encodeURIComponent(result.error)}`);
        return;
      }

      // Success - break out of retry loop
      break;
    }

    // Success - redirect to home page
    redirect("/");
  } catch (err: unknown) {
    // Re-throw Next.js redirect errors (they must propagate)
    if (isNextRedirectError(err)) {
      throw err;
    }

    // Handle streaming errors gracefully
    if (
      err instanceof Error &&
      (err.message?.includes("input stream") ||
        err.message?.includes("stream") ||
        err.message?.includes("ECONNRESET"))
    ) {
      // Silently redirect - streaming errors are often transient
      redirect("/");
    }

    // Handle other errors
    console.error("Unexpected error in callback:", err);

    const errorMessage = 
      err instanceof Error ? err.message : "An unexpected error occurred";
    
    redirect(`/?error=${encodeURIComponent(errorMessage)}`);
  }
}
