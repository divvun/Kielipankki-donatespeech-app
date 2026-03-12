import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRecording } from "./useRecording";

const mocks = vi.hoisted(() => ({
  checkPermission: vi.fn(),
  requestPermission: vi.fn(),
  startNativeRecording: vi.fn(),
  stopNativeRecording: vi.fn(),
  tempDir: vi.fn(),
  joinPath: vi.fn(),
  readFileAsBase64: vi.fn(),
  saveRecording: vi.fn(),
  deleteFile: vi.fn(),
  requestWakeLock: vi.fn(),
  releaseWakeLock: vi.fn(),
}));

vi.mock("./useWakeLock", () => ({
  useWakeLock: () => ({
    requestWakeLock: mocks.requestWakeLock,
    releaseWakeLock: mocks.releaseWakeLock,
    isSupported: false,
  }),
}));

vi.mock("tauri-plugin-audio-recorder-api", () => ({
  checkPermission: mocks.checkPermission,
  requestPermission: mocks.requestPermission,
  startRecording: mocks.startNativeRecording,
  stopRecording: mocks.stopNativeRecording,
}));

vi.mock("@tauri-apps/api/path", () => ({
  tempDir: mocks.tempDir,
  join: mocks.joinPath,
}));

vi.mock("../platform", () => ({
  platformApi: {
    readFileAsBase64: mocks.readFileAsBase64,
    saveRecording: mocks.saveRecording,
    deleteFile: mocks.deleteFile,
  },
}));

describe("useRecording", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    const windowRecord = window as unknown as Record<string, unknown>;
    windowRecord.__TAURI_INTERNALS__ = {};

    mocks.requestWakeLock.mockResolvedValue(undefined);
    mocks.releaseWakeLock.mockResolvedValue(undefined);
    mocks.tempDir.mockResolvedValue("/tmp");
    mocks.joinPath.mockResolvedValue("/tmp/recording_123");
    mocks.startNativeRecording.mockResolvedValue(undefined);
    mocks.stopNativeRecording.mockResolvedValue({
      filePath: "/tmp/recording_123.wav",
      durationMs: 3000,
    });
    mocks.readFileAsBase64.mockResolvedValue("base64");
    mocks.saveRecording.mockResolvedValue({
      recording: {
        recordingId: "rec-1",
        timestamp: new Date().toISOString(),
      },
      durationSeconds: 3,
    });
    mocks.deleteFile.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();

    const windowRecord = window as unknown as Record<string, unknown>;
    delete windowRecord.__TAURI_INTERNALS__;
  });

  it("resets stale duration immediately when starting a new session", async () => {
    let resolveSecondPermission!: (value: {
      granted: boolean;
      canRequest: boolean;
    }) => void;
    const pendingSecondPermission = new Promise<{
      granted: boolean;
      canRequest: boolean;
    }>((resolve) => {
      resolveSecondPermission = resolve;
    });

    mocks.checkPermission
      .mockResolvedValueOnce({ granted: true, canRequest: false })
      .mockReturnValueOnce(pendingSecondPermission);

    const { result } = renderHook(() => useRecording());

    // First session: build a non-zero duration that can leak into the next start.
    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.duration).toBe(3);

    await act(async () => {
      await result.current.stopRecording("item-1", "client-1");
    });

    expect(result.current.duration).toBe(3);

    // Second start: permission/startup is intentionally delayed.
    let secondStartPromise: Promise<void> | undefined;
    act(() => {
      secondStartPromise = result.current.startRecording();
    });

    // Regression guard: old duration must not be shown while startup is pending.
    expect(result.current.duration).toBe(0);

    resolveSecondPermission({ granted: true, canRequest: false });

    await act(async () => {
      await secondStartPromise;
    });

    await act(async () => {
      await result.current.stopRecording("item-1", "client-1");
    });
  });
});
