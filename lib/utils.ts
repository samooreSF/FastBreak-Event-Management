import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Need this to handle style merging to make sure no issues persist when I add custom

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
