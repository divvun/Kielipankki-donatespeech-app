/**
 * Simple preferences storage using localStorage
 */

const TOTAL_RECORDED_SECONDS_KEY = "totalRecordedSeconds";

/**
 * Get the total recorded seconds
 */
export function getTotalRecordedSeconds(): number {
  const value = localStorage.getItem(TOTAL_RECORDED_SECONDS_KEY);
  return value ? parseInt(value, 10) : 0;
}

/**
 * Add seconds to the total recorded time
 */
export function addRecordedSeconds(seconds: number): void {
  const current = getTotalRecordedSeconds();
  const newTotal = current + Math.abs(seconds);
  localStorage.setItem(TOTAL_RECORDED_SECONDS_KEY, newTotal.toString());
}

/**
 * Format total recorded seconds as minutes display
 */
export function formatTotalRecorded(seconds: number): string {
  const minutes = Math.floor(seconds / 60);

  if (minutes < 1) {
    return "<1 min";
  }

  return `${minutes} min`;
}
