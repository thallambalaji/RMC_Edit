import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Restricts phone input to digits only (0-9) and caps max length at 10 digits.
 */
export function sanitizePhone(val: string): string {
  return (val || "").replace(/\D/g, "").slice(0, 10);
}

/**
 * Validates whether phone number is exactly 10 digits when required or provided.
 */
export function isValidPhone(val: string, required = true): boolean {
  const digits = sanitizePhone(val);
  if (!required && !digits) return true;
  return digits.length === 10;
}

