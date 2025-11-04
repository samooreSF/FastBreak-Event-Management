// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin

  // Handle OAuth errors from Supabase/Google
  if (error) {
    console.error('OAuth error from provider:', {
      error,
      errorCode: requestUrl.searchParams.get('error_code'),
      errorDescription,
    })
    const errorMessage = errorDescription
      ? encodeURIComponent(errorDescription)
      : encodeURIComponent(error || 'Authentication failed')
    return NextResponse.redirect(`${origin}/?error=${errorMessage}`, 307)
  }

  // Handle missing code
  if (!code) {
    console.error('No authorization code received in callback')
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent('No authorization code received')}`, 307)
  }

  try {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      
      // Handle rate limit errors gracefully
      if (exchangeError.status === 429 || exchangeError.message?.includes('rate limit')) {
        return NextResponse.redirect(`${origin}/?error=${encodeURIComponent('Too many authentication attempts. Please wait a moment and try again.')}`, 307)
      }
      
      return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(exchangeError.message || 'Failed to exchange code for session')}`, 307)
    }

    // Success - Supabase sets session cookies automatically
    // Use 307 (Temporary Redirect) to preserve POST method and prevent streaming errors
    return NextResponse.redirect(`${origin}/`, 307)
  } catch (err: any) {
    // Check if this is a redirect error (Next.js uses this internally)
    if (err.message === 'NEXT_REDIRECT' || err.digest?.startsWith('NEXT_REDIRECT')) {
      // Re-throw redirect errors - Next.js handles them
      throw err
    }
    
    // Handle streaming errors gracefully
    if (err.message?.includes('input stream') || err.message?.includes('stream')) {
      // Silently redirect - streaming errors are often transient
      return NextResponse.redirect(`${origin}/`, 307)
    }
    
    // Handle actual errors
    console.error('Unexpected error in callback:', err)
    
    // Check for rate limit errors
    if (err.status === 429 || err.message?.includes('rate limit')) {
      return NextResponse.redirect(`${origin}/?error=${encodeURIComponent('Too many authentication attempts. Please wait a moment and try again.')}`, 307)
    }
    
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(err.message || 'An unexpected error occurred')}`, 307)
  }
}


// import { createClient } from "@/lib/supabase/server";
// import { redirect } from "next/navigation";

// export async function GET(request: Request) {
//   const requestUrl = new URL(request.url);
//   const code = requestUrl.searchParams.get("code");
//   const error = requestUrl.searchParams.get("error");
//   const errorDescription = requestUrl.searchParams.get("error_description");
//   const origin = requestUrl.origin;

//   // Handle OAuth errors from Supabase
//   if (error) {
//     console.error("OAuth error from Supabase:", {
//       error,
//       errorCode: requestUrl.searchParams.get("error_code"),
//       errorDescription,
//     });
//     const errorMessage = errorDescription
//       ? encodeURIComponent(errorDescription)
//       : encodeURIComponent(error || "Authentication failed");
//     return redirect(`${origin}/?error=${errorMessage}`);
//   }

//   // Handle missing code
//   if (!code) {
//     console.error("No authorization code received");
//     return redirect(`${origin}/?error=${encodeURIComponent("No authorization code received")}`);
//   }

//   const supabase = await createClient();
//   const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

//   if (exchangeError) {
//     console.error("Code exchange error:", exchangeError);
//     return redirect(`${origin}/?error=${encodeURIComponent(exchangeError.message || "Failed to exchange code for session")}`);
//   }

//   // Success - Supabase now sets cookies automatically (via the cookieStore)
//   redirect("/");
// }
