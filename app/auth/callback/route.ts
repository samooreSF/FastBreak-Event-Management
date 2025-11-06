// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { exchangeCodeForSession } from "@/actions/auth";
import { isErrorResponse, isNextRedirectError } from "@/types/errors";

// Disable streaming for this route to prevent "input stream" errors during redirects
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const origin = requestUrl.origin;

  // Handle OAuth errors from provider (Google/Supabase)
  if (error) {
    const errorMessage = errorDescription || error || "Authentication failed";
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(errorMessage)}`, {
      status: 307,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  }

  // Handle missing authorization code
  if (!code) {
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent("No authorization code received")}`,
      {
        status: 307,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  }

  try {
    // Exchange authorization code for session
    const result = await exchangeCodeForSession(code);

    // Handle errors from exchange
    if (isErrorResponse(result)) {
      redirect(`/?error=${encodeURIComponent(result.error)}`);
      return;
    }

    // Success - redirect to home page
    redirect("/");
  } catch (err: unknown) {
    // Re-throw Next.js redirect errors (they must propagate)
    if (isNextRedirectError(err)) {
      throw err;
    }

    // Handle streaming errors gracefully (transient connection issues)
    if (
      err instanceof Error &&
      (err.message?.includes("input stream") ||
        err.message?.includes("stream") ||
        err.message?.includes("ECONNRESET"))
    ) {
      redirect("/");
      return;
    }

    // Handle unexpected errors
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
    redirect(`/?error=${encodeURIComponent(errorMessage)}`);
  }
}
