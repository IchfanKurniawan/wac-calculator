/**
 * Input sanitization — strip potentially dangerous content from user inputs.
 * No HTML, no scripts, no SQL-like patterns (even though we have no DB).
 */

// Characters that must be removed from text inputs
const DANGEROUS_PATTERN = /<[^>]*>|javascript:|on\w+\s*=|<script|<\/script/gi;
const SQL_PATTERN = /('|--|;|\/\*|\*\/|xp_|exec\s|union\s+select|drop\s+table|insert\s+into)/gi;

/** Sanitize a free-text string field */
export function sanitizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(DANGEROUS_PATTERN, '')
    .replace(SQL_PATTERN, '')
    .trim()
    .slice(0, 200); // max 200 chars
}

/** Parse and clamp a number within allowed bounds */
export function sanitizeNumber(
  value: unknown,
  min = 0,
  max = 1_000_000_000
): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  if (!isFinite(n)) return 0;
  return Math.max(min, Math.min(max, n));
}

/** Parse and clamp a ratio (0–1) */
export function sanitizeRatio(value: unknown): number {
  return sanitizeNumber(value, 0, 1);
}

/** Ensure a value is boolean */
export function sanitizeBool(value: unknown): boolean {
  return Boolean(value);
}

/** Sanitize a string that must match one of the allowed values */
export function sanitizeEnum<T extends string>(
  value: unknown,
  allowed: T[],
  fallback: T
): T {
  if (typeof value === 'string' && (allowed as string[]).includes(value)) {
    return value as T;
  }
  return fallback;
}
