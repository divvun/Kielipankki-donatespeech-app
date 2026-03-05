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
  return (
    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
      <h3 className="font-semibold mb-2">Debug Info:</h3>
      <div className="text-sm font-mono">
        <div>Loading: {loading ? "true" : "false"}</div>
        <div>Recordings count: {recordingsCount}</div>
        <div>Themes count: {themesCount}</div>
        <div>Schedules count: {schedulesCount}</div>
        <div>Error: {error || "(none)"}</div>
      </div>
    </div>
  );
}
