import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getApiBaseUrl: vi.fn(),
  downloadMedia: vi.fn(),
}));

vi.mock("../platform", () => ({
  platformApi: {
    getApiBaseUrl: mocks.getApiBaseUrl,
    downloadMedia: mocks.downloadMedia,
  },
}));

import { getMediaUrl } from "./mediaUrl";

describe("getMediaUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getApiBaseUrl.mockResolvedValue("https://api.example.invalid");
  });

  it("returns resolved HLS playlist URLs without downloading them", async () => {
    await expect(getMediaUrl("/media/live/index.m3u8")).resolves.toBe(
      "https://api.example.invalid/media/live/index.m3u8",
    );

    expect(mocks.downloadMedia).not.toHaveBeenCalled();
  });

  it("downloads non-HLS media before creating a blob URL", async () => {
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:resolved");
    mocks.downloadMedia.mockResolvedValue([1, 2, 3]);

    await expect(getMediaUrl("/media/audio.mp3")).resolves.toBe(
      "blob:resolved",
    );

    expect(mocks.downloadMedia).toHaveBeenCalledWith("/media/audio.mp3");

    createObjectURL.mockRestore();
  });

  it("returns SVT embed URLs directly without downloading", async () => {
    await expect(
      getMediaUrl("https://api.svt.se/videoplayer-embed/jqPzEW9"),
    ).resolves.toBe("https://api.svt.se/videoplayer-embed/jqPzEW9");

    expect(mocks.downloadMedia).not.toHaveBeenCalled();
    expect(mocks.getApiBaseUrl).not.toHaveBeenCalled();
  });

  it("resolves JSON string payloads from YLE program lookups to direct stream URLs", async () => {
    const createObjectURL = vi.spyOn(URL, "createObjectURL");
    const yleStreamUrl =
      "https://example.invalid/stream/index.m3u8?token=abc123";

    mocks.downloadMedia.mockResolvedValue(
      Array.from(new TextEncoder().encode(JSON.stringify(yleStreamUrl))),
    );

    await expect(getMediaUrl("1-50525858")).resolves.toBe(yleStreamUrl);

    expect(mocks.downloadMedia).toHaveBeenCalledWith("1-50525858");
    expect(createObjectURL).not.toHaveBeenCalled();

    createObjectURL.mockRestore();
  });

  it("normalizes /v1/yle-media endpoint paths to program ID flow", async () => {
    const yleStreamUrl = "https://example.invalid/live/index.m3u8";

    mocks.downloadMedia.mockResolvedValue(
      Array.from(new TextEncoder().encode(JSON.stringify(yleStreamUrl))),
    );

    await expect(getMediaUrl("/v1/yle-media/1-50525858")).resolves.toBe(
      yleStreamUrl,
    );

    expect(mocks.downloadMedia).toHaveBeenCalledWith("1-50525858");
  });
});
