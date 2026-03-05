/**
 * Get or generate the client ID (UUID v4).
 * The client ID is stored in localStorage and persists across sessions.
 */
const CLIENT_ID_STORAGE_KEY = "clientId";

export function getClientId(): string {
  // Try to get existing client ID from localStorage
  let clientId = localStorage.getItem(CLIENT_ID_STORAGE_KEY);

  if (!clientId) {
    // Generate a new UUID v4
    clientId = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId);
  }

  return clientId;
}
