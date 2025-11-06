"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useErrorHandler } from "@/hooks/use-error-handler";

/**
 * Component that displays authentication errors from URL query params as toast notifications
 * Should be placed in layout or pages that receive auth errors
 */
export function AuthErrorToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { handleError } = useErrorHandler();

  useEffect(() => {
    const error = searchParams.get("error");
    
    if (error) {
      // Decode the error message
      const decodedError = decodeURIComponent(error);
      
      // Show toast notification using error handler for consistency
      handleError(decodedError, {
        title: "Authentication Error",
      });

      // Clear the error parameter from URL to prevent showing it again on refresh
      const params = new URLSearchParams(searchParams.toString());
      params.delete("error");
      const newUrl = params.toString() 
        ? `${pathname}?${params.toString()}` 
        : pathname;
      
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, router, pathname, handleError]);

  return null;
}

