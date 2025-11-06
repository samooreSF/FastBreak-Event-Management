import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js Middleware - Optimized for cookie security and caching
 * Handles authentication redirects and sets appropriate cache headers
 */

// Supabase cookie name pattern (they use sb-{project-ref}-auth-token format)
const SUPABASE_COOKIE_PREFIX = "sb-";

// Routes that should never be cached
const NO_CACHE_ROUTES = ["/events/new", "/events/[id]/edit"];

// Routes that can be cached for authenticated users
const CACHEABLE_ROUTES = ["/events", "/"];

/**
 * Check if a cookie is a Supabase auth cookie
 */
function isSupabaseCookie(name: string): boolean {
  return name.startsWith(SUPABASE_COOKIE_PREFIX) && name.includes("auth");
}

/**
 * Clean up invalid or expired Supabase cookies
 */
function cleanInvalidCookies(request: NextRequest, response: NextResponse): void {
  const cookies = request.cookies.getAll();
  
  cookies.forEach((cookie) => {
    if (isSupabaseCookie(cookie.name)) {
      // Check if cookie value is empty or malformed
      if (!cookie.value || cookie.value.length === 0) {
        // Delete invalid cookie
        response.cookies.delete(cookie.name);
      }
    }
  });
}

/**
 * Set security headers for cookies
 */
function setCookieSecurityHeaders(response: NextResponse): void {
  // Set security headers to protect cookies
  response.headers.set(
    "X-Content-Type-Options",
    "nosniff"
  );
  response.headers.set(
    "X-Frame-Options",
    "DENY"
  );
  response.headers.set(
    "X-XSS-Protection",
    "1; mode=block"
  );
  
  // Referrer policy for privacy
  response.headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );
}

/**
 * Get appropriate cache headers based on route
 */
function getCacheHeaders(pathname: string): Record<string, string> {
  // Never cache auth routes or dynamic routes
  if (
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/") ||
    NO_CACHE_ROUTES.some((route) => pathname.startsWith(route))
  ) {
    return {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    };
  }

  // Cache public routes with shorter TTL
  if (pathname === "/" || pathname.startsWith("/events")) {
    return {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    };
  }

  // Default: moderate caching for other routes
  return {
    "Cache-Control": "private, no-cache, must-revalidate",
  };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets early (most performant)
  if (
    pathname.startsWith("/_next/") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Skip middleware for auth routes to prevent interference with OAuth flow
  if (pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  // Skip API routes
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Create response with appropriate cache headers
  const response = NextResponse.next();
  
  // Set cache headers based on route
  const cacheHeaders = getCacheHeaders(pathname);
  Object.entries(cacheHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Set security headers
  setCookieSecurityHeaders(response);

  // Clean up invalid cookies
  cleanInvalidCookies(request, response);

  // Check for sign-out flag in URL (set by signOut action)
  // This allows middleware to handle redirect before React renders
  const signOutFlag = request.nextUrl.searchParams.get("signout");
  if (signOutFlag === "success") {
    // Clear all Supabase auth cookies on sign-out
    const cookies = request.cookies.getAll();
    cookies.forEach((cookie) => {
      if (isSupabaseCookie(cookie.name)) {
        response.cookies.delete(cookie.name);
      }
    });

    // Clear the sign-out flag and redirect to home
    const url = request.nextUrl.clone();
    url.searchParams.delete("signout");
    
    return NextResponse.redirect(url, {
      status: 307,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        ...cacheHeaders,
      },
    });
  }

  // No Supabase session checks here - prevents unnecessary token refreshes
  // Pages handle their own auth requirements and will refresh tokens when needed
  // This prevents rate limit issues from excessive token refresh attempts
  return response;
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

