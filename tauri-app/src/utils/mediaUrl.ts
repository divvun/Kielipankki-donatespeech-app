import { invoke } from "@tauri-apps/api/core";

let cachedBaseUrl: string | null = null;

// Cache for blob URLs to avoid recreating them
const blobUrlCache: Map<string, string> = new Map();

/**
 * Get the API base URL (cached after first call)
 */
export async function getApiBaseUrl(): Promise<string> {
  if (cachedBaseUrl === null) {
    cachedBaseUrl = await invoke<string>("get_api_base_url");
  }
  return cachedBaseUrl;
}

/**
 * Determine MIME type from filename extension
 */
function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    mp4: "video/mp4",
    webm: "video/webm",
    ogv: "video/ogg",
    m4a: "audio/mp4",
    mp3: "audio/mpeg",
    ogg: "audio/ogg",
    wav: "audio/wav",
    flac: "audio/flac",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };
  return mimeTypes[ext || ""] || "application/octet-stream";
}

/**
 * Download media file and convert to blob URL for playback
 */
export async function getMediaUrl(filenameOrUrl: string): Promise<string> {
  console.log("getMediaUrl called with:", filenameOrUrl);

  // Check if we already have a blob URL for this file
  if (blobUrlCache.has(filenameOrUrl)) {
    console.log("Using cached blob URL");
    return blobUrlCache.get(filenameOrUrl)!;
  }

  // Download the media file (returns binary data as number array)
  const fileData = await invoke<number[]>("download_media", {
    url: filenameOrUrl,
  });

  console.log(`Received ${fileData.length} bytes from download_media`);

  // Extract filename for MIME type detection
  const filename = filenameOrUrl.split("/").pop() || "";
  const mimeType = getMimeType(filename);

  console.log(`Creating blob with MIME type: ${mimeType}`);

  // Convert number array to Uint8Array and create blob
  const uint8Array = new Uint8Array(fileData);
  const blob = new Blob([uint8Array], { type: mimeType });
  const blobUrl = URL.createObjectURL(blob);

  console.log("Created blob URL:", blobUrl);

  // Cache the blob URL
  blobUrlCache.set(filenameOrUrl, blobUrl);

  return blobUrl;
}

/**
 * Clean up blob URLs when they're no longer needed
 */
export function revokeMediaUrl(filenameOrUrl: string): void {
  const blobUrl = blobUrlCache.get(filenameOrUrl);
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl);
    blobUrlCache.delete(filenameOrUrl);
  }
}
