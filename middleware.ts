import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js Middleware - Runs before page renders
 * Handles authentication redirects to prevent flashing during navigation
 */
export async function middleware(request: NextRequest) {
  // Skip middleware for auth routes to prevent interference with OAuth flow
  if (request.nextUrl.pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  // Skip static files and API routes
  if (
    request.nextUrl.pathname.startsWith("/_next/") ||
    request.nextUrl.pathname.startsWith("/api/") ||
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp)$/)
  ) {
    return NextResponse.next();
  }

  // Check for sign-out flag in URL (set by signOut action)
  // This allows middleware to handle redirect before React renders
  const signOutFlag = request.nextUrl.searchParams.get("signout");
  if (signOutFlag === "success") {
    // Clear the sign-out flag and redirect to home
    const url = request.nextUrl.clone();
    url.searchParams.delete("signout");
    return NextResponse.redirect(url, {
      status: 307,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }

  // No Supabase session checks here - prevents unnecessary token refreshes
  // Pages handle their own auth requirements and will refresh tokens when needed
  // This prevents rate limit issues from excessive token refresh attempts
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth routes (to prevent middleware interference with OAuth flow)
     * - public folder
     * - static assets
     */
    "/((?!_next/static|_next/image|favicon.ico|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

