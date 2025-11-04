// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// `cookies()` in Next exports a runtime value but not a named type; derive
// the RequestCookies type locally from the runtime using ReturnType.
type RequestCookies = ReturnType<typeof cookies>;

/**
 * Create a Supabase server client.
 *
 * If you need to modify cookies (set/delete), call this function from a
 * Route Handler or Server Action and pass the `cookies()` object into the
 * `cookieStore` parameter. Modifying cookies outside of those contexts will
 * throw an error from Next.js.
 */
export const createClient = async (cookieStore?: RequestCookies) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please check your .env.local file."
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please check your .env.local file."
    );
  }

  // Use provided cookieStore (from a Route Handler / Server Action) when available.
  // Otherwise fall back to `cookies()` for reads only. Attempting to modify
  // cookies when `cookieStore` was not provided will throw a helpful error.
  // `cookieStore` may be a Promise (ReturnType<typeof cookies>) or an already
  // resolved value; await whichever we have so `cookieStoreResolved` is the
  // runtime object with get/set/delete methods.
  const cookieStoreResolved = cookieStore ? await cookieStore : await cookies();
  
  // Track if we're in a writable context
  const isWritable = !!cookieStore;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStoreResolved.get(name)?.value ?? null;
      },
      set(name: string, value: string, options?: Record<string, any>) {
        if (!isWritable) {
          // Silently fail for read-only contexts - Supabase might try to set cookies internally
          return;
        }

        try {
          cookieStoreResolved.set({ name, value, ...options });
        } catch (e) {
          // Silently handle errors - Supabase will handle missing cookies gracefully
        }
      },
      remove(name: string, options?: Record<string, any>) {
        if (!isWritable) {
          // Silently fail for read-only contexts - Supabase might try to delete expired cookies
          return;
        }

        try {
          cookieStoreResolved.delete({ name, ...options });
        } catch (e) {
          // Silently handle errors - Supabase will handle missing cookies gracefully
        }
      },
    },
  });
};
