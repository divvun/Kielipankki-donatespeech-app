/**
 * Per-identity preferences storage using localStorage
 * Recorded seconds are now tracked per local identity via clientId utility
 */

import {
  getClientId,
  getIdentityRecordedSeconds,
  addIdentityRecordedSeconds,
  subtractIdentityRecordedSeconds,
} from "./clientId";

/**
 * Get the total recorded seconds for the current active identity
 */
export function getTotalRecordedSeconds(): number {
  const clientId = getClientId();
  return getIdentityRecordedSeconds(clientId);
}

/**
 * Add seconds to the total recorded time for current active identity
 */
export function addRecordedSeconds(seconds: number): void {
  const clientId = getClientId();
  addIdentityRecordedSeconds(clientId, seconds);
}

/**
 * Subtract seconds from the total recorded time for current active identity
 * Used when deleting recordings
 */
export function subtractRecordedSeconds(seconds: number): void {
  const clientId = getClientId();
  subtractIdentityRecordedSeconds(clientId, seconds);
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
