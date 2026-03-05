interface TestErrorBannerProps {
  error: string;
}

export function TestErrorBanner({ error }: TestErrorBannerProps) {
  if (!error) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
      <strong>Error:</strong> {error}
    </div>
  );
}
