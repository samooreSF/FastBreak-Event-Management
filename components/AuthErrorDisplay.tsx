"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function AuthErrorDisplay({ error }: { error: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Clear the error parameter from URL after displaying it to prevent flashing
    if (error && mounted) {
      const timer = setTimeout(() => {
        router.replace(pathname);
      }, 5000); // Clear after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [error, mounted, router, pathname]);

  if (!error) return null;

  // Decode error message safely to prevent hydration mismatches
  const decodedError = mounted ? decodeURIComponent(error) : error;

  return (
    <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
      <p className="font-semibold mb-1">Authentication Error</p>
      <p suppressHydrationWarning>{decodedError}</p>
    </div>
  );
}
