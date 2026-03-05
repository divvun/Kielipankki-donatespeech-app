interface TestActionButton {
  label: string;
  loadingLabel?: string;
  color: string;
  onClick: () => void;
}

interface TestActionSectionProps {
  title: string;
  loading: boolean;
  actions: TestActionButton[];
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
            style={{
              backgroundColor: loading ? "#9CA3AF" : action.color,
              color: "white",
              padding: "0.5rem 1.5rem",
              borderRadius: "0.25rem",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? action.loadingLabel || "Loading..." : action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
