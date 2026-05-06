/**
 * Parse a date string in YYYY-MM-DD format to a Date object in local timezone
 * This prevents timezone conversion issues when displaying dates
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a date string (YYYY-MM-DD) to Vietnamese locale string
 */
export function formatDateToVietnamese(
  dateString: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString("vi-VN", options);
}

/**
 * Format a date string (YYYY-MM-DD) to short Vietnamese format (dd/MM/yyyy)
 */
export function formatDateShort(dateString: string): string {
  return formatDateToVietnamese(dateString, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Format a date string (YYYY-MM-DD) to long Vietnamese format with weekday
 */
export function formatDateLong(dateString: string): string {
  return formatDateToVietnamese(dateString, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date object to YYYY-MM-DD string
 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
