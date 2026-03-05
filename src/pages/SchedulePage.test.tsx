import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Schedule } from "../types/Schedule";
import SchedulePage from "./SchedulePage";

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  getMediaUrl: vi.fn(),
  navigate: vi.fn(),
  startRecording: vi.fn(),
  stopRecording: vi.fn(),
  uploadNow: vi.fn(),
  refreshTotal: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: mocks.invoke,
}));

vi.mock("../utils/mediaUrl", () => ({
  getMediaUrl: mocks.getMediaUrl,
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );

  return {
    ...actual,
    useParams: () => ({ scheduleId: "schedule-1" }),
    useNavigate: () => mocks.navigate,
  };
});

vi.mock("../hooks/useRecording", () => ({
  useRecording: () => ({
    isRecording: false,
    duration: 0,
    error: null,
    startRecording: mocks.startRecording,
    stopRecording: mocks.stopRecording,
    resetError: vi.fn(),
  }),
  formatDuration: () => "0:00",
}));

vi.mock("../hooks/useTotalRecorded", () => ({
  useTotalRecorded: () => ({
    totalFormatted: "0:00",
    refresh: mocks.refreshTotal,
  }),
}));

vi.mock("../hooks/useAutoUpload", () => ({
  useAutoUpload: () => ({
    uploadNow: mocks.uploadNow,
  }),
}));

vi.mock("../hooks/useTranslation", () => ({
  useTranslation: () => ({
    getString: (key: string) => {
      const map: Record<string, string> = {
        DonatedLabelText: "Donated",
        StartRecording: "Start Recording",
        StopRecording: "Stop Recording",
        ContinueSchedule: "Continue",
        ExitButtonText: "Exit",
        YleContentUnavailable: "YLE Content Unavailable",
        YleContentUnavailableMessage:
          "This content requires YLE API credentials to be configured.",
      };

      return map[key] ?? key;
    },
  }),
}));

vi.mock("../contexts/LocalizationContext", () => ({
  useLocalization: () => ({
    currentLanguage: "nb",
  }),
}));

describe("SchedulePage fake YLE media", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const buildFakeYleSchedule = (
    itemType: "fake-yle-audio" | "fake-yle-video",
  ): Schedule => ({
    scheduleId: "schedule-1",
    items: [
      {
        kind: "media",
        itemType,
        itemId: "item-1",
        url: "yle-program-id",
        default: {
          title: { nb: "Fake YLE title" },
          body1: { nb: "Prompt text" },
          body2: { nb: "More prompt text" },
          imageUrl: null,
        },
        options: [],
        isRecording: true,
      },
    ],
  });

  it.each(["fake-yle-audio", "fake-yle-video"] as const)(
    "shows unavailable message without trying to load media while keeping recording UI for %s",
    async (itemType) => {
      const schedule = buildFakeYleSchedule(itemType);

      mocks.invoke.mockImplementation(async (command: string) => {
        if (command === "fetch_schedule") {
          return schedule;
        }

        throw new Error(`Unexpected invoke command: ${command}`);
      });

      render(<SchedulePage />);

      await screen.findByText("YLE Content Unavailable");

      expect(
        screen.getByText(
          "This content requires YLE API credentials to be configured.",
        ),
      ).toBeTruthy();
      expect(screen.queryByText("Loading media...")).toBeNull();
      expect(
        screen.getByRole("button", { name: "Start Recording" }),
      ).toBeTruthy();
      expect(mocks.getMediaUrl).not.toHaveBeenCalled();
    },
  );
});
