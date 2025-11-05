import { createServerClient } from "@supabase/ssr";
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{ name: string; value: string; options?: any }>
        ) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      } as any,
    });

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

    // Check session - this refreshes tokens if needed
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // No further redirects needed - let pages handle their own auth requirements
    // Middleware just ensures session is valid and tokens are refreshed
    return response;
  } catch (error) {
    // Silently handle errors - pages will handle auth state properly
    return response;
  }
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

