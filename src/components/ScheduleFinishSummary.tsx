interface ScheduleFinishSummaryProps {
  finishImageUrl?: string | null;
  title: string;
  body1?: string;
  body2?: string;
  totalRecorded: string;
}

export function ScheduleFinishSummary({
  finishImageUrl,
  title,
  body1,
  body2,
  totalRecorded,
}: ScheduleFinishSummaryProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
      <div className="max-w-2xl w-full">
        {finishImageUrl ? (
          <div className="mb-8 flex justify-center">
            <img
              src={finishImageUrl}
              alt=""
              className="max-w-md w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        ) : (
          <div className="mb-8 flex justify-center">
            <div className="w-64 h-64 bg-linear-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-xl">
              <svg
                className="w-32 h-32 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        )}

        <h1 className="text-3xl font-bold text-center mb-6 text-gray-900">
          {title}
        </h1>

        <div className="text-center text-gray-700 space-y-4 mb-8">
          {body1 && <p className="text-xl">{body1}</p>}
          {body2 && <p className="text-lg">{body2}</p>}
          <p className="text-lg">
            Total contribution: <strong>{totalRecorded}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
