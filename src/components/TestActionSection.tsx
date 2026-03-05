import type { CSSProperties } from "react";

interface TestActionButton {
  label: string;
  loadingLabel?: string;
  color: string;
  onClick: () => void;
}

interface TestActionSectionProps {
  title: string;
  loading: boolean;
  actions: ReadonlyArray<TestActionButton>;
}

const baseButtonStyle: CSSProperties = {
  color: "white",
  padding: "0.5rem 1.5rem",
  borderRadius: "0.25rem",
  border: "none",
};

function getButtonStyle(loading: boolean, color: string): CSSProperties {
  return {
    ...baseButtonStyle,
    backgroundColor: loading ? "#9CA3AF" : color,
    cursor: loading ? "not-allowed" : "pointer",
  };
}

function getButtonLabel(action: TestActionButton, loading: boolean): string {
  return loading ? action.loadingLabel || "Loading..." : action.label;
}

export function TestActionSection({
  title,
  loading,
  actions,
}: TestActionSectionProps) {
  return (
    <div className="mb-8 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      <div className="flex gap-4">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            disabled={loading}
            style={getButtonStyle(loading, action.color)}
          >
            {getButtonLabel(action, loading)}
          </button>
        ))}
      </div>
    </div>
  );
}
