/**
 * Type guard utilities for runtime type safety
 */

/**
 * Type guard to check if a value is not null or undefined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to check if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Type guard to check if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

/**
 * Type guard to check if a value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * Type guard to check if a value is an object (but not null or array)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

/**
 * Type guard to check if a value is an array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if a value is a valid UUID
 */
export function isUUID(value: unknown): value is string {
  if (!isString(value)) {
    return false;
  }
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Type guard to check if a value is a valid email
 */
export function isEmail(value: unknown): value is string {
  if (!isString(value)) {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Type guard to check if a value is a valid date string or Date object
 */
export function isDate(value: unknown): value is Date | string {
  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }
  if (isString(value)) {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  return false;
}

/**
 * Type guard to check if a value has a specific property
 */
export function hasProperty<K extends string>(
  value: unknown,
  key: K
): value is Record<K, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    key in value
  );
}

/**
 * Type guard to check if a value has multiple properties
 */
export function hasProperties<K extends string>(
  value: unknown,
  ...keys: K[]
): value is Record<K, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return keys.every((key) => key in value);
}

/**
 * Type guard to check if a value is an empty string, null, or undefined
 */
export function isEmpty(value: unknown): value is null | undefined | "" {
  return value === null || value === undefined || value === "";
}

/**
 * Type guard to check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

/**
 * Type guard to check if a value is a valid URL
 */
export function isURL(value: unknown): value is string {
  if (!isString(value)) {
    return false;
  }
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard to check if an object has a specific shape
 */
export function hasShape<T extends Record<string, unknown>>(
  value: unknown,
  shape: { [K in keyof T]: (val: unknown) => val is T[K] }
): value is T {
  if (!isObject(value)) {
    return false;
  }
  
  return Object.entries(shape).every(([key, guard]) => {
    return guard(value[key]);
  });
}

/**
 * Safely parse JSON with type guard
 */
export function isJSON(value: unknown): value is string {
  if (!isString(value)) {
    return false;
  }
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard for Error objects
 */
export function isError(value: unknown): value is Error {
  return (
    value instanceof Error ||
    (isObject(value) &&
      hasProperty(value, "message") &&
      isString(value.message))
  );
}

