const wrapperClassName =
  "min-h-screen bg-gray-100 flex items-center justify-center";
const spinnerClassName =
  "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600";

export function ScheduleLoadingState() {
  return (
    <div className={wrapperClassName}>
      <div className={spinnerClassName}></div>
    </div>
  );
}
