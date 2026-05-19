import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Schedule } from "../types/Schedule";
import ScheduleStartPage from "./ScheduleStartPage";

const mocks = vi.hoisted(() => ({
  fetchSchedule: vi.fn(),
  getMediaUrl: vi.fn(),
  navigate: vi.fn(),
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

vi.mock("../hooks/useTranslation", () => ({
  useTranslation: () => ({
    getString: (key: string) => {
      const map: Record<string, string> = {
        ScheduleStartFallbackTitle: "Start schedule",
        StartButtonText: "Start",
        BackToThemesButtonText: "Back",
        SchedulePageNoItemsError: "No items",
      };

      return map[key] ?? key;
    },
  }),
}));

vi.mock("../hooks/useTotalRecorded", () => ({
  useTotalRecorded: () => ({
    totalFormatted: "0:00",
    refresh: mocks.refreshTotal,
  }),
}));

vi.mock("../contexts/LocalizationContext", () => ({
  useLocalization: () => ({
    currentLanguage: "nb",
  }),
}));

describe("ScheduleStartPage", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the start image from a relative media URL", async () => {
    const schedule: Schedule = {
      scheduleId: "schedule-1",
      start: {
        title: "Giitu go finadat dás!",
        body1: "Body 1",
        body2: "Body 2",
        url: "/v1/media/foto21_svt.jpg",
      },
      items: [
        {
          kind: "media",
          itemType: "image",
          itemId: "item-1",
          isRecording: false,
          options: [],
        },
      ],
    };

    mocks.fetchSchedule.mockResolvedValue(schedule);
    mocks.getMediaUrl.mockResolvedValue("blob:resolved-start-image");

    render(<ScheduleStartPage />);

    const image = await screen.findByAltText("Giitu go finadat dás!");

    expect(image.getAttribute("src")).toBe("blob:resolved-start-image");
    await waitFor(() => {
      expect(mocks.getMediaUrl).toHaveBeenCalledWith(
        "/v1/media/foto21_svt.jpg",
      );
    });
  });
});
