import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VideoPlayer } from "./VideoPlayer";

const hlsInstances = vi.hoisted(() => ({
  loadSource: vi.fn(),
  attachMedia: vi.fn(),
  on: vi.fn(),
  destroy: vi.fn(),
}));

vi.mock("hls.js", () => {
  class MockHls {
    static isSupported = vi.fn(() => true);
    static Events = {
      MANIFEST_PARSED: "MANIFEST_PARSED",
      ERROR: "ERROR",
    };

    loadSource = hlsInstances.loadSource;
    attachMedia = hlsInstances.attachMedia;
    on = hlsInstances.on;
    destroy = hlsInstances.destroy;
  }

  return { default: MockHls };
});

describe("VideoPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses HLS.js for m3u8 streams when native HLS is unavailable", async () => {
    const { container } = render(
      <VideoPlayer url="https://example.invalid/live/index.m3u8" />,
    );

    await waitFor(() => {
      expect(hlsInstances.loadSource).toHaveBeenCalledWith(
        "https://example.invalid/live/index.m3u8",
      );
    });

    const video = container.querySelector("video");
    expect(video).toBeTruthy();
    expect(hlsInstances.attachMedia).toHaveBeenCalledWith(video);
  });

  it("renders iframe for SVT embed URLs", () => {
    const { container } = render(
      <VideoPlayer url="https://api.svt.se/videoplayer-embed/abc123" />,
    );

    const iframe = container.querySelector("iframe");
    const video = container.querySelector("video");

    expect(iframe).toBeTruthy();
    expect(iframe?.getAttribute("src")).toBe(
      "https://api.svt.se/videoplayer-embed/abc123",
    );
    expect(video).toBeNull();
    expect(hlsInstances.loadSource).not.toHaveBeenCalled();
  });
});
