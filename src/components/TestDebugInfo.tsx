interface TestDebugInfoProps {
  loading: boolean;
  recordingsCount: number;
  themesCount: number;
  schedulesCount: number;
  error: string;
}

export function TestDebugInfo({
  loading,
  recordingsCount,
  themesCount,
  schedulesCount,
  error,
}: TestDebugInfoProps) {
  const rows = [
    { label: "Loading", value: loading ? "true" : "false" },
    { label: "Recordings count", value: String(recordingsCount) },
    { label: "Themes count", value: String(themesCount) },
    { label: "Schedules count", value: String(schedulesCount) },
    { label: "Error", value: error || "(none)" },
  ];

  return (
    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
      <h3 className="font-semibold mb-2">Debug Info:</h3>
      <div className="text-sm font-mono">
        {rows.map((row) => (
          <div key={row.label}>
            {row.label}: {row.value}
          </div>
        ))}
      </div>
    </div>
  );
}
