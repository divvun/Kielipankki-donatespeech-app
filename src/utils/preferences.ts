/**
 * Simple preferences storage using localStorage
 */

const TOTAL_RECORDED_SECONDS_KEY = "totalRecordedSeconds";
const DEFAULT_TOTAL_RECORDED_SECONDS = 0;

function parseRecordedSeconds(value: string | null): number {
  if (!value) {
    return DEFAULT_TOTAL_RECORDED_SECONDS;
  }

  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? DEFAULT_TOTAL_RECORDED_SECONDS : parsed;
}

/**
 * Get the total recorded seconds
 */
export function getTotalRecordedSeconds(): number {
  const value = localStorage.getItem(TOTAL_RECORDED_SECONDS_KEY);
  return parseRecordedSeconds(value);
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
 * Subtract seconds from the total recorded time
 * Used when deleting recordings
 */
export function subtractRecordedSeconds(seconds: number): void {
  const current = getTotalRecordedSeconds();
  const newTotal = Math.max(0, current - Math.abs(seconds));
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
