import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useInviteFriendShare } from "./useInviteFriendShare";

const mocks = vi.hoisted(() => ({
  getTotalRecordedSeconds: vi.fn(),
}));

vi.mock("../utils/preferences", () => ({
  getTotalRecordedSeconds: mocks.getTotalRecordedSeconds,
}));

describe("useInviteFriendShare", () => {
  const getString = (id: string) => {
    const map: Record<string, string> = {
      InviteFriendTemplate: "I donated {$param0} minutes.",
      InviteFriendNewbieTemplate: "I just donated {$param0} minute.",
      InviteFriendTitle: "Invite a friend",
    };

    return map[id] ?? id;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses Web Share API when available", async () => {
    mocks.getTotalRecordedSeconds.mockReturnValue(180);

    const shareMock = vi.fn().mockResolvedValue(undefined);
    const writeTextMock = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, "share", {
      value: shareMock,
      configurable: true,
    });

    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    const alertMock = vi.fn();
    vi.stubGlobal("alert", alertMock);

    const { result } = renderHook(() => useInviteFriendShare({ getString }));

    await result.current.shareWithFriend();

    expect(shareMock).toHaveBeenCalledWith({
      title: "Invite a friend",
      text: "I donated 3 minutes.",
    });
    expect(writeTextMock).not.toHaveBeenCalled();
    expect(alertMock).not.toHaveBeenCalled();
  });

  it("falls back to clipboard when Web Share API is unavailable", async () => {
    mocks.getTotalRecordedSeconds.mockReturnValue(60);

    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    const alertMock = vi.fn();
    vi.stubGlobal("alert", alertMock);

    const { result } = renderHook(() => useInviteFriendShare({ getString }));

    await result.current.shareWithFriend();

    expect(writeTextMock).toHaveBeenCalledWith("I just donated 1 minute.");
    expect(alertMock).toHaveBeenCalledWith("Share text copied to clipboard!");
  });
});
