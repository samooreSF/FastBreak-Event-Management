"use client";

import { useToast } from "@/hooks/use-toast";
import { useCallback } from "react";
import {
  getErrorMessage,
  type ActionResult,
} from "@/lib/errors";

/**
 * Hook for handling errors consistently in client components
 */
export function useErrorHandler() {
  const { toast } = useToast();

  /**
   * Handle server action errors
   */
  const handleError = useCallback(
    (error: unknown, options?: { title?: string; fallbackMessage?: string }) => {
      const title = options?.title || "Error";
      const message = getErrorMessage(error);
      
      toast({
        variant: "destructive",
        title,
        description: message || options?.fallbackMessage || "An unexpected error occurred",
      });
    },
    [toast]
  );

  /**
   * Handle server action results
   */
  const handleActionResult = useCallback(
    <T,>(
      result: ActionResult<T> | unknown,
      options?: {
        onSuccess?: (data: T) => void;
        onError?: (error: string) => void;
        successTitle?: string;
        successMessage?: string;
        errorTitle?: string;
      }
    ): result is { data: T; error: null } => {
      // Handle ActionResult type
      if (result && typeof result === "object") {
        // Check if it's an error response
        if ("error" in result && result.error !== null && typeof result.error === "string") {
          const errorMessage = result.error;
          options?.onError?.(errorMessage);
          handleError(errorMessage, {
            title: options?.errorTitle || "Error",
          });
          return false;
        }

        // Check if it's a success response
        if ("data" in result && "error" in result && result.error === null) {
          const successResult = result as { data: T; error: null };
          if (options?.successTitle || options?.successMessage) {
            toast({
              title: options?.successTitle || "Success",
              description: options?.successMessage || "Operation completed successfully",
            });
          }
          options?.onSuccess?.(successResult.data);
          return true;
        }
      }

      // Handle other error types
      if (result && typeof result === "object" && "error" in result) {
        const errorResult = result as { error: string };
        handleError(errorResult.error, {
          title: options?.errorTitle || "Error",
        });
        options?.onError?.(errorResult.error);
        return false;
      }

      return false;
    },
    [toast, handleError]
  );

  /**
   * Handle async operations with error handling
   */
  const handleAsync = useCallback(
    async <T,>(
      asyncFn: () => Promise<T>,
      options?: {
        onSuccess?: (data: T) => void;
        onError?: (error: unknown) => void;
        successTitle?: string;
        successMessage?: string;
        errorTitle?: string;
      }
    ): Promise<T | null> => {
      try {
        const result = await asyncFn();
        if (options?.successTitle || options?.successMessage) {
          toast({
            title: options?.successTitle || "Success",
            description: options?.successMessage || "Operation completed successfully",
          });
        }
        options?.onSuccess?.(result);
        return result;
      } catch (error) {
        handleError(error, {
          title: options?.errorTitle || "Error",
        });
        options?.onError?.(error);
        return null;
      }
    },
    [toast, handleError]
  );

  return {
    handleError,
    handleActionResult,
    handleAsync,
  };
}

