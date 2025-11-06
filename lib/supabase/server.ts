import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cookie options type matching Next.js cookies() API
 */
type CookieOptions = {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "strict" | "lax" | "none";
  secure?: boolean;
};

/**
 * Supabase server client.
 * Handles its own cookie store internally.
 * Used by server actions and route handlers.
 * 
 * This function automatically manages cookies using Next.js cookies() API.
 * Cookies are read from and written to the request/response cookie store.
 */
export const createClient = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Get the cookie store - this is always writable in server actions and route handlers
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value ?? null;
      },
      set(name: string, value: string, options?: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (e) {
          // Silently handle errors - Supabase will handle missing cookies gracefully
          // This can happen if called outside of a server action context
        }
      },
      remove(name: string, options?: CookieOptions) {
        try {
          cookieStore.delete(name);
        } catch (e) {
          // Silently handle errors - Supabase will handle missing cookies gracefully
          // This can happen if called outside of a server action context
        }
      },
    },
  });
};
