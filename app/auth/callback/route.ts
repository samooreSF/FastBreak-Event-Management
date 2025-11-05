// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { exchangeCodeForSession } from "@/actions/auth";

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
          {
            status: 307,
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate",
            },
          }
        );
      }

      return NextResponse.redirect(
        `${origin}/?error=${encodeURIComponent(result.error)}`,
        {
          status: 307,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    // Success - Supabase sets session cookies automatically
    // Use 307 redirect with no-cache headers to prevent streaming conflicts
    return NextResponse.redirect(`${origin}/`, {
      status: 307,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
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
        err.message?.includes("stream") ||
        err.message?.includes("ECONNRESET"))
    ) {
      // Silently redirect - streaming errors are often transient
      return NextResponse.redirect(`${origin}/`, {
        status: 307,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
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
        {
          status: 307,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(errorMessage)}`,
      {
        status: 307,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}
