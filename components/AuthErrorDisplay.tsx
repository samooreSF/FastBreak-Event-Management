"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function AuthErrorDisplay({ error }: { error: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    // Clear the error parameter from URL after displaying it to prevent flashing
    if (error && searchParams.has("error")) {
      const timer = setTimeout(() => {
        router.replace(pathname);
      }, 5000); // Clear after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [error, searchParams, router, pathname]);

  if (!error) return null;

  return (
    <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
      <p className="font-semibold mb-1">Authentication Error</p>
      <p>{decodeURIComponent(error)}</p>
    </div>
  );
}
