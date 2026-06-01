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

let mockScheduleId = "schedule-1";
let mockLocationSearch = "";

const mocks = vi.hoisted(() => ({
  fetchSchedule: vi.fn(),
  getMediaUrl: vi.fn(),
  navigate: vi.fn(),
  startRecording: vi.fn(),
  stopRecording: vi.fn(),
  resetDuration: vi.fn(),
  uploadNow: vi.fn(),
  refreshTotal: vi.fn(),
  videoPlayer: vi.fn(),
}));

vi.mock("../platform", () => ({
  platformApi: {
    fetchSchedule: mocks.fetchSchedule,
  },
}));

vi.mock("../utils/mediaUrl", () => ({
  getMediaUrl: mocks.getMediaUrl,
}));

vi.mock("../components/VideoPlayer", () => ({
  VideoPlayer: ({
    url,
    description,
  }: {
    url: string;
    description?: string;
  }) => {
    mocks.videoPlayer(url);

    return <div data-testid="video-player">{description}</div>;
  },
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );

  return {
    ...actual,
    useParams: () => ({ scheduleId: mockScheduleId }),
    useNavigate: () => mocks.navigate,
    useLocation: () => ({ search: mockLocationSearch, state: null }),
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
  SUPPORTED_LANGUAGES: {
    fi: { englishName: "Finnish", nativeName: "suomi" },
    nb: { englishName: "Norwegian Bokmål", nativeName: "norsk bokmål" },
  },
  useLocalization: () => ({
    currentLanguage: "nb",
  }),
}));

describe("SchedulePage fake YLE media", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockScheduleId = "schedule-1";
    mockLocationSearch = "";
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

  it("renders image media items from the resolved media URL", async () => {
    const schedule: Schedule = {
      scheduleId: "schedule-1",
      items: [
        {
          kind: "media",
          itemType: "image",
          itemId: "item-image-1",
          isRecording: false,
          start: {
            title: "Theme image",
            body1: "Prompt text",
            body2: "More prompt text",
            url: "/v1/media/foto21_svt.jpg",
          },
          options: [],
        },
      ],
    };

    mocks.fetchSchedule.mockResolvedValue(schedule);
    mocks.getMediaUrl.mockResolvedValue("blob:resolved-image-url");

    render(<SchedulePage />);

    const image = await screen.findByAltText("Theme image");

    await waitFor(() => {
      expect(image.getAttribute("src")).toBe("blob:resolved-image-url");
      expect(mocks.getMediaUrl).toHaveBeenCalledWith(
        "/v1/media/foto21_svt.jpg",
      );
    });
  });

  it("prefers YLE state URL over item-level program id", async () => {
    const schedule: Schedule = {
      scheduleId: "schedule-1",
      items: [
        {
          kind: "media",
          itemType: "yle-video",
          itemId: "item-yle-1",
          isRecording: false,
          url: "85-685d6af67a3f426fa1714f38513bc62d",
          start: {
            title: "YLE stream",
            body1: "Prompt text",
            body2: "More prompt text",
            url: "https://yleawsmpondemand-03.akamaized.net/vod/path/index.m3u8",
          },
          options: [],
        },
      ],
    };

    mocks.fetchSchedule.mockResolvedValue(schedule);
    mocks.getMediaUrl.mockResolvedValue(
      "https://example.invalid/resolved-yle-stream.m3u8",
    );

    render(<SchedulePage />);

    await screen.findAllByText("YLE stream");

    await waitFor(() => {
      expect(mocks.getMediaUrl).toHaveBeenCalledWith(
        "https://yleawsmpondemand-03.akamaized.net/vod/path/index.m3u8",
      );
    });

    expect(mocks.videoPlayer).toHaveBeenCalledWith(
      "https://example.invalid/resolved-yle-stream.m3u8",
    );
    expect(screen.getByTestId("video-player")).toBeTruthy();
    expect(screen.queryByAltText("YLE stream")).toBeNull();
  });

  it("renders the first fi item video for schedule 0598bf14-ab48-4ccb-a50c-0bd779f77933", async () => {
    const scheduleId = "0598bf14-ab48-4ccb-a50c-0bd779f77933";
    const hlsUrl =
      "https://yleawsmpondemand-03.akamaized.net/vod/world/406318a3e25843d6a06c8def33ac8a0a/a8f702fdc8e7449cae194919044a34ee/d5fb3a697dbb4efda98a6aea7cb21fe7/index.m3u8?hdnts=exp=1779449002~acl=/vod/world/406318a3e25843d6a06c8def33ac8a0a/a8f702fdc8e7449cae194919044a34ee/*~hmac=b53a2064ffa945de335f1945c1bd07c6d5f3855307b9d1d6a2162d4703135337";

    mockScheduleId = scheduleId;
    mockLocationSearch = "?lang=fi";

    const schedule: Schedule = {
      scheduleId,
      items: [
        {
          kind: "media",
          itemType: "yle-video",
          itemId: "item-yle-fi-1",
          isRecording: false,
          start: {
            title: "YLE fi stream",
            body1: "Prompt text",
            body2: "More prompt text",
            url: hlsUrl,
          },
          options: [],
        },
      ],
    };

    mocks.fetchSchedule.mockResolvedValue(schedule);
    mocks.getMediaUrl.mockResolvedValue(hlsUrl);

    render(<SchedulePage />);

    await screen.findAllByText("YLE fi stream");

    await waitFor(() => {
      expect(mocks.fetchSchedule).toHaveBeenCalledWith(
        scheduleId,
        "fi",
        undefined,
      );
      expect(mocks.getMediaUrl).toHaveBeenCalledWith(hlsUrl);
    });

    expect(mocks.videoPlayer).toHaveBeenCalledWith(hlsUrl);
    expect(screen.getByTestId("video-player")).toBeTruthy();
    expect(screen.queryByAltText("YLE fi stream")).toBeNull();
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
