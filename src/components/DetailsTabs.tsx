import { useTranslation } from "@/hooks/useTranslation";

export type DetailsTabType = "recordings" | "privacy";

interface DetailsTabsProps {
  activeTab: string;
  onTabChange: (tab: DetailsTabType) => void;
}

export function DetailsTabs({ activeTab, onTabChange }: DetailsTabsProps) {
  const { getString } = useTranslation();
  return (
    <div className="flex px-5">
      <button
        onClick={() => onTabChange("recordings")}
        className="flex-1 flex flex-col items-center gap-2 py-3 bg-transparent border-none cursor-pointer"
      >
        <span
          className={`text-sm ${
            activeTab === "recordings"
              ? "font-semibold text-primary"
              : "font-medium text-muted-foreground"
          }`}
        >
          {getString("DetailsButtonText") === "Lisätietoa"
            ? "Tallenteet"
            : "Recordings"}
        </span>
        <div
          className={`w-full h-0.5 rounded-full ${
            activeTab === "recordings" ? "bg-primary" : "bg-border"
          }`}
        />
      </button>
      <button
        onClick={() => onTabChange("privacy")}
        className="flex-1 flex flex-col items-center gap-2 py-3 bg-transparent border-none cursor-pointer"
      >
        <span
          className={`text-sm ${
            activeTab === "privacy"
              ? "font-semibold text-primary"
              : "font-medium text-muted-foreground"
          }`}
        >
          Info
        </span>
        <div
          className={`w-full h-0.5 rounded-full ${
            activeTab === "privacy" ? "bg-primary" : "bg-border"
          }`}
        />
      </button>
    </div>
  );
}
