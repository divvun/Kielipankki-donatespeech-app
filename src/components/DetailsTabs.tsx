export type DetailsTabType = "recordings" | "privacy";

interface DetailsTabsProps {
  activeTab: DetailsTabType;
  onTabChange: (tab: DetailsTabType) => void;
}

export function DetailsTabs({ activeTab, onTabChange }: DetailsTabsProps) {
  const tabClassName = (tab: DetailsTabType) =>
    `${
      activeTab === tab
        ? "border-blue-500 text-blue-600"
        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`;

  return (
    <div className="bg-white border-b border-gray-200">
      <nav className="flex space-x-8 px-6" aria-label="Tabs">
        <button
          onClick={() => onTabChange("recordings")}
          className={tabClassName("recordings")}
        >
          Recordings
        </button>
        <button
          onClick={() => onTabChange("privacy")}
          className={tabClassName("privacy")}
        >
          Privacy & Info
        </button>
      </nav>
    </div>
  );
}
