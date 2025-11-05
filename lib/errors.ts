/**
 * Centralized error handling utilities
 */

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = "UNAUTHORIZED",
  AUTH_FAILED = "AUTH_FAILED",
  AUTH_REQUIRED = "AUTH_REQUIRED",

  // Validation errors
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",

  // Database errors
  DATABASE_ERROR = "DATABASE_ERROR",
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",

  // Rate limiting
  RATE_LIMIT = "RATE_LIMIT",

  // Generic errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Base error response type
 */
export type ErrorResponse<T = never> = {
  error: string;
  code?: ErrorCode;
  details?: unknown;
  data?: T;
};

/**
 * Success response type
 */
export type SuccessResponse<T> = {
  data: T;
  error: null;
};

/**
 * Action result type - union of success and error responses
 */
export type ActionResult<T> = SuccessResponse<T> | ErrorResponse<T>;

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "AppError";
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse<T = never>(
  error: string | Error | AppError,
  code?: ErrorCode,
  details?: unknown
): ErrorResponse<T> {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      code: code || ErrorCode.INTERNAL_ERROR,
      details,
    };
  }

  return {
    error: String(error),
    code: code || ErrorCode.INTERNAL_ERROR,
    details,
  };
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    data,
    error: null,
  };
}

/**
 * Handle errors from Supabase operations
 */
export function handleSupabaseError(error: unknown): ErrorResponse {
  if (error && typeof error === "object" && "message" in error) {
    const supabaseError = error as {
      message: string;
      code?: string;
      status?: number;
    };

    // Handle specific Supabase error codes
    if (supabaseError.code === "PGRST116") {
      return createErrorResponse("Resource not found", ErrorCode.NOT_FOUND);
    }

    if (supabaseError.code === "23505") {
      return createErrorResponse(
        "Resource already exists",
        ErrorCode.ALREADY_EXISTS
      );
    }

    if (
      supabaseError.status === 429 ||
      supabaseError.message?.includes("rate limit")
    ) {
      return createErrorResponse(
        "Too many requests. Please try again later.",
        ErrorCode.RATE_LIMIT
      );
    }

    return createErrorResponse(
      supabaseError.message || "Database operation failed",
      ErrorCode.DATABASE_ERROR,
      supabaseError
    );
  }

  return createErrorResponse(
    "An unexpected database error occurred",
    ErrorCode.DATABASE_ERROR
  );
}

/**
 * Handle authentication errors
 */
export function handleAuthError(error: unknown): ErrorResponse {
  if (error && typeof error === "object" && "message" in error) {
    const authError = error as { message: string; status?: number };

    if (
      authError.status === 401 ||
      authError.message?.includes("Unauthorized")
    ) {
      return createErrorResponse(
        "Authentication required",
        ErrorCode.AUTH_REQUIRED
      );
    }

    if (authError.status === 403) {
      return createErrorResponse(
        "You don't have permission to perform this action",
        ErrorCode.UNAUTHORIZED
      );
    }

    return createErrorResponse(
      authError.message || "Authentication failed",
      ErrorCode.AUTH_FAILED,
      authError
    );
  }

  return createErrorResponse("Authentication error", ErrorCode.AUTH_FAILED);
}

/**
 * Wrap async server actions with consistent error handling
 */
export async function withErrorHandling<T>(
  action: () => Promise<T>,
  fallbackMessage: string = "An unexpected error occurred"
): Promise<ActionResult<T>> {
  try {
    const result = await action();
    return createSuccessResponse(result);
  } catch (error) {
    // Re-throw Next.js redirect errors (they must propagate)
    if (isNextRedirectError(error)) {
      throw error;
    }

    if (error instanceof AppError) {
      return createErrorResponse(error, error.code, error.details);
    }

    console.error("Error in server action:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : fallbackMessage,
      ErrorCode.INTERNAL_ERROR,
      error
    );
  }
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred";
}

/**
 * Check if a response is an error response
 * Works with both ActionResult and simple error objects
 */
export function isErrorResponse<T>(
  response: ActionResult<T> | unknown
): response is ErrorResponse<T> {
  return (
    response !== null &&
    typeof response === "object" &&
    "error" in response &&
    response.error !== null &&
    typeof response.error === "string"
  );
}

/**
 * Check if a response is a success response
 */
export function isSuccessResponse<T>(
  response: ActionResult<T>
): response is SuccessResponse<T> {
  return "data" in response && response.error === null;
}

/**
 * Check if an error is a Next.js redirect error (should be re-thrown)
 */
export function isNextRedirectError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    (("message" in error && error.message === "NEXT_REDIRECT") ||
      ("digest" in error &&
        typeof error.digest === "string" &&
        error.digest.startsWith("NEXT_REDIRECT")))
  );
}

/**
 * Get error message from any error type or ActionResult
 */
export function getError(result: unknown): string | null {
  if (isErrorResponse(result)) {
    return result.error;
  }
  return getErrorMessage(result);
}

/**
 * Assert that a response is successful (throws if not)
 */
export function assertSuccess<T>(
  response: ActionResult<T>
): asserts response is SuccessResponse<T> {
  if (isErrorResponse(response)) {
    throw new AppError(
      response.code || ErrorCode.INTERNAL_ERROR,
      response.error,
      response.details
    );
  }
}
