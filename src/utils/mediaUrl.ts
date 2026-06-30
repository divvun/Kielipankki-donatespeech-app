import { platformApi } from "../platform";

let cachedBaseUrl: string | null = null;
const DEFAULT_MIME_TYPE = "application/octet-stream";

// Cache for blob URLs to avoid recreating them
const blobUrlCache: Map<string, string> = new Map();

// In-flight request deduplication: concurrent calls for the same source share one download
const inFlightRequests: Map<string, Promise<string>> = new Map();

/**
 * Get the API base URL (cached after first call)
 */
export async function getApiBaseUrl(): Promise<string> {
  if (cachedBaseUrl === null) {
    cachedBaseUrl = await platformApi.getApiBaseUrl();
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
  return mimeTypes[ext || ""] || DEFAULT_MIME_TYPE;
}

function getFilenameFromPath(filenameOrUrl: string): string {
  return filenameOrUrl.split("/").pop() || "";
}

function isHlsPlaylistSource(source: string): boolean {
  return /\.m3u8(?:$|[?#])/i.test(source);
}

function isSvtEmbedSource(source: string): boolean {
  return /^https:\/\/api\.svt\.se\/videoplayer-embed\//i.test(source);
}

function normalizeMediaSource(source: string): string {
  const trimmed = source.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function extractYleProgramIdFromPath(source: string): string | null {
  if (!source) {
    return null;
  }

  const directPathMatch = source.match(
    /^\/?v1\/(?:media\/v1\/)?yle-media\/([^/?#]+)$/i,
  );
  if (directPathMatch?.[1]) {
    return decodeURIComponent(directPathMatch[1]);
  }

  if (!/^https?:\/\//i.test(source)) {
    return null;
  }

  try {
    const parsed = new URL(source);
    const pathMatch = parsed.pathname.match(
      /^\/v1\/(?:media\/v1\/)?yle-media\/([^/?#]+)$/i,
    );
    if (pathMatch?.[1]) {
      return decodeURIComponent(pathMatch[1]);
    }
  } catch {
    return null;
  }

  return null;
}

function extractUrlFromPayload(fileData: number[]): string | null {
  const decoded = new TextDecoder().decode(new Uint8Array(fileData)).trim();
  if (!decoded) {
    return null;
  }

  try {
    const parsed = JSON.parse(decoded) as unknown;
    if (typeof parsed === "string") {
      return normalizeMediaSource(parsed);
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      "url" in parsed &&
      typeof (parsed as { url: unknown }).url === "string"
    ) {
      return normalizeMediaSource((parsed as { url: string }).url);
    }
  } catch {
    // Not JSON; continue with plain-text heuristics.
  }

  const plainValue = normalizeMediaSource(decoded);
  if (
    /^https?:\/\//i.test(plainValue) ||
    plainValue.startsWith("/") ||
    isHlsPlaylistSource(plainValue)
  ) {
    return plainValue;
  }

  return null;
}

async function resolveUrl(filenameOrUrl: string): Promise<string> {
  if (/^https?:\/\//i.test(filenameOrUrl)) {
    return filenameOrUrl;
  }

  const baseUrl = await getApiBaseUrl();
  const normalizedPath = filenameOrUrl.startsWith("/")
    ? filenameOrUrl
    : `/${filenameOrUrl}`;

  return `${baseUrl}${normalizedPath}`;
}

async function fetchMediaUrl(mediaSource: string): Promise<string> {
  const yleProgramId = extractYleProgramIdFromPath(mediaSource);
  if (yleProgramId) {
    // Route endpoint-style YLE sources through the program-id flow.
    return getMediaUrl(yleProgramId);
  }

  if (isSvtEmbedSource(mediaSource)) {
    console.log("Using SVT embed URL directly:", mediaSource);
    return mediaSource;
  }

  if (isHlsPlaylistSource(mediaSource)) {
    const resolvedUrl = await resolveUrl(mediaSource);
    console.log("Using resolved HLS playlist URL:", resolvedUrl);
    return resolvedUrl;
  }

  const fileData = await platformApi.downloadMedia(mediaSource);

  console.log(`Received ${fileData.length} bytes from download_media`);

  const extractedUrl = extractUrlFromPayload(fileData);
  if (extractedUrl) {
    const resolvedUrl = await resolveUrl(extractedUrl);
    console.log("Resolved media URL from payload:", resolvedUrl);
    return resolvedUrl;
  }

  // Extract filename for MIME type detection
  const filename = getFilenameFromPath(mediaSource);
  const mimeType = getMimeType(filename);

  console.log(`Creating blob with MIME type: ${mimeType}`);

  // Convert number array to Uint8Array and create blob
  const uint8Array = new Uint8Array(fileData);
  const blob = new Blob([uint8Array], { type: mimeType });
  const blobUrl = URL.createObjectURL(blob);

  console.log("Created blob URL:", blobUrl);

  // Cache the blob URL
  blobUrlCache.set(mediaSource, blobUrl);

  return blobUrl;
}

/**
 * Download media file and convert to blob URL for playback.
 * Concurrent calls for the same source share a single in-flight request.
 */
export function getMediaUrl(filenameOrUrl: string): Promise<string> {
  const mediaSource = normalizeMediaSource(filenameOrUrl);

  console.log("getMediaUrl called with:", mediaSource);

  if (blobUrlCache.has(mediaSource)) {
    console.log("Using cached blob URL");
    return Promise.resolve(blobUrlCache.get(mediaSource)!);
  }

  const existing = inFlightRequests.get(mediaSource);
  if (existing) {
    console.log("Joining in-flight request for:", mediaSource);
    return existing;
  }

  const promise = fetchMediaUrl(mediaSource).finally(() => {
    inFlightRequests.delete(mediaSource);
  });

  inFlightRequests.set(mediaSource, promise);
  return promise;
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
