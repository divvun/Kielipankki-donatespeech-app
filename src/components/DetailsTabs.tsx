export type DetailsTabType = "recordings" | "privacy";

interface DetailsTabsProps {
  activeTab: DetailsTabType;
  onTabChange: (tab: DetailsTabType) => void;
}

const tabs: Array<{ id: DetailsTabType; label: string }> = [
  { id: "recordings", label: "Recordings" },
  { id: "privacy", label: "Privacy & Info" },
];

const sharedTabClassName =
  "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm";
const activeTabClassName = "border-blue-500 text-blue-600";
const inactiveTabClassName =
  "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300";

export function DetailsTabs({ activeTab, onTabChange }: DetailsTabsProps) {
  const tabClassName = (tab: DetailsTabType) => {
    const stateClassName =
      activeTab === tab ? activeTabClassName : inactiveTabClassName;

    return `${stateClassName} ${sharedTabClassName}`;
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <nav className="flex space-x-8 px-6" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={tabClassName(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
