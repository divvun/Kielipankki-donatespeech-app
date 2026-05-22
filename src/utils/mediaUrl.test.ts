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
});
