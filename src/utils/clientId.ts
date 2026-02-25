/**
 * Get or generate the client ID (UUID v4).
 * The client ID is stored in localStorage and persists across sessions.
 */
export function getClientId(): string {
  const STORAGE_KEY = "clientId";

  // Try to get existing client ID from localStorage
  let clientId = localStorage.getItem(STORAGE_KEY);

  if (!clientId) {
    // Generate a new UUID v4
    clientId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, clientId);
  }

  return clientId;
}
