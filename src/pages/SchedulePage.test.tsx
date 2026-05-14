import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Schedule } from "../types/Schedule";
import SchedulePage from "./SchedulePage";

const mocks = vi.hoisted(() => ({
  fetchSchedule: vi.fn(),
  getMediaUrl: vi.fn(),
  navigate: vi.fn(),
  startRecording: vi.fn(),
  stopRecording: vi.fn(),
  resetDuration: vi.fn(),
  uploadNow: vi.fn(),
  refreshTotal: vi.fn(),
}));

vi.mock("../platform", () => ({
  platformApi: {
    fetchSchedule: mocks.fetchSchedule,
  },
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
    useLocation: () => ({ search: "", state: null }),
  };
});

vi.mock("../hooks/useRecording", () => ({
  useRecording: () => ({
    isRecording: false,
    duration: 0,
    error: null,
    startRecording: mocks.startRecording,
    stopRecording: mocks.stopRecording,
    resetDuration: mocks.resetDuration,
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
          title: "Fake YLE title",
          body1: "Prompt text",
          body2: "More prompt text",
          imageUrl: null,
        },
        options: [],
        isRecording: true,
      },
    ],
  });

  const buildStateFirstFakeYleSchedule = (
    itemType: "fake-yle-audio" | "fake-yle-video",
  ): Schedule => ({
    scheduleId: "schedule-1",
    items: [
      {
        kind: "media",
        itemType,
        itemId: "item-1",
        isRecording: true,
        start: {
          title: "State-first fake YLE title",
          body1: "Prompt text",
          body2: "More prompt text",
          url: null,
        },
        options: [],
      },
    ],
  });

  it.each(["fake-yle-audio", "fake-yle-video"] as const)(
    "shows fake YLE placeholder without trying to load media while keeping recording UI for %s",
    async (itemType) => {
      const schedule = buildFakeYleSchedule(itemType);

      mocks.fetchSchedule.mockResolvedValue(schedule);

      render(<SchedulePage />);

      await screen.findByText(itemType);

      expect(screen.getAllByText("Fake YLE title").length).toBeGreaterThan(0);
      expect(screen.queryByText("Loading media...")).toBeNull();
      expect(
        screen.getByRole("button", { name: "Start Recording" }),
      ).toBeTruthy();
      expect(mocks.getMediaUrl).not.toHaveBeenCalled();
    },
  );

  it.each(["fake-yle-audio", "fake-yle-video"] as const)(
    "supports state-first fake YLE payload without item url/default for %s",
    async (itemType) => {
      const schedule = buildStateFirstFakeYleSchedule(itemType);

      mocks.fetchSchedule.mockResolvedValue(schedule);

      render(<SchedulePage />);

      await screen.findByText(itemType);

      expect(
        screen.getAllByText("State-first fake YLE title").length,
      ).toBeGreaterThan(0);
      expect(screen.queryByText("Loading media...")).toBeNull();
      expect(
        screen.getByRole("button", { name: "Start Recording" }),
      ).toBeTruthy();
      expect(mocks.getMediaUrl).not.toHaveBeenCalled();
    },
  );

  it("uses state URL fallback for media when item-level url is missing", async () => {
    const schedule: Schedule = {
      scheduleId: "schedule-1",
      items: [
        {
          kind: "media",
          itemType: "audio",
          itemId: "item-1",
          isRecording: false,
          start: {
            title: "Audio from state URL",
            body1: "Prompt text",
            body2: "More prompt text",
            url: "state-audio-id",
          },
          options: [],
        },
      ],
    };

    mocks.fetchSchedule.mockResolvedValue(schedule);
    mocks.getMediaUrl.mockResolvedValue("https://example.invalid/audio.mp3");

    render(<SchedulePage />);

    await screen.findAllByText("Audio from state URL");

    await waitFor(() => {
      expect(mocks.getMediaUrl).toHaveBeenCalledWith("state-audio-id");
    });
  });

  it("resets recording duration when entering the next recording item", async () => {
    const schedule: Schedule = {
      scheduleId: "schedule-1",
      items: [
        {
          kind: "media",
          itemType: "fake-yle-audio",
          itemId: "item-1",
          url: "yle-program-id-1",
          default: {
            title: "First recording item",
            body1: "Prompt text",
            body2: "More prompt text",
            imageUrl: null,
          },
          options: [],
          isRecording: true,
        },
        {
          kind: "media",
          itemType: "fake-yle-video",
          itemId: "item-2",
          url: "yle-program-id-2",
          default: {
            title: "Second recording item",
            body1: "Prompt text",
            body2: "More prompt text",
            imageUrl: null,
          },
          options: [],
          isRecording: true,
        },
      ],
    };

    mocks.fetchSchedule.mockResolvedValue(schedule);

    render(<SchedulePage />);

    await screen.findByText(/1\s*\/\s*2/);

    const initialResetCalls = mocks.resetDuration.mock.calls.length;
    expect(initialResetCalls).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await screen.findAllByText("Second recording item");

    await waitFor(() => {
      expect(mocks.resetDuration.mock.calls.length).toBeGreaterThan(
        initialResetCalls,
      );
    });
  });
});
