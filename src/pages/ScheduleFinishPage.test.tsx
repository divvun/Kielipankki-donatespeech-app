import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ScheduleFinishPage from "./ScheduleFinishPage";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  getMediaUrl: vi.fn(),
  refreshTotal: vi.fn(),
  shareWithFriend: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );

  return {
    ...actual,
    useNavigate: () => mocks.navigate,
    useLocation: () => ({
      search: "",
      state: {
        finish: {
          title: "Giitu go geargan dás!",
          body1: "Body 1",
          body2: "Body 2",
          url: "/v1/media/foto3_svt.jpg",
        },
      },
    }),
  };
});

vi.mock("../utils/mediaUrl", () => ({
  getMediaUrl: mocks.getMediaUrl,
}));

vi.mock("../hooks/useTotalRecorded", () => ({
  useTotalRecorded: () => ({
    totalFormatted: "0:00",
    refresh: mocks.refreshTotal,
  }),
}));

vi.mock("../hooks/useTranslation", () => ({
  useTranslation: () => ({
    getString: (key: string) => {
      const map: Record<string, string> = {
        RecordingFinishTitle: "Finish",
        InviteFriendButtonText: "Invite",
        DonateMoreButtonText: "Donate more",
        BackToThemesButtonText: "Back",
      };

      return map[key] ?? key;
    },
  }),
}));

vi.mock("../hooks/useInviteFriendShare", () => ({
  useInviteFriendShare: () => ({
    shareWithFriend: mocks.shareWithFriend,
  }),
}));

vi.mock("../contexts/LocalizationContext", () => ({
  useLocalization: () => ({
    currentLanguage: "se",
  }),
}));

describe("ScheduleFinishPage", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the finish image from a relative media URL", async () => {
    mocks.getMediaUrl.mockResolvedValue("blob:resolved-finish-image");

    render(<ScheduleFinishPage />);

    const image = await screen.findByAltText("Giitu go geargan dás!");

    expect(image.getAttribute("src")).toBe("blob:resolved-finish-image");
    await waitFor(() => {
      expect(mocks.getMediaUrl).toHaveBeenCalledWith("/v1/media/foto3_svt.jpg");
    });
  });
});
