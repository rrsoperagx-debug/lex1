/**
 * Format a Date object as YYYY-MM-DD in local time
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current date as YYYY-MM-DD string in local time
 */
export function getCurrentLocalDateString(): string {
  return formatLocalDate(new Date());
}
/**
 * Check if a date string (YYYY-MM-DD) is today or in the future
 */
export function isTodayOrFuture(dateStr: string): boolean {
  const today = getCurrentLocalDateString();
  return dateStr >= today;
}
