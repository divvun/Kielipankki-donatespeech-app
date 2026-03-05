interface ScheduleStartSummaryProps {
  startImageUrl?: string | null;
  title: string;
  body1?: string;
  body2?: string;
}

export function ScheduleStartSummary({
  startImageUrl,
  title,
  body1,
  body2,
}: ScheduleStartSummaryProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
      <div className="max-w-2xl w-full">
        {startImageUrl && (
          <div className="mb-8 flex justify-center">
            <img
              src={startImageUrl}
              alt=""
              className="max-w-md w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        )}

        <h1 className="text-3xl font-bold text-center mb-6 text-gray-900">
          {title}
        </h1>

        <div className="text-center text-gray-700 space-y-4 mb-8">
          {body1 && <p className="text-lg">{body1}</p>}
          {body2 && <p>{body2}</p>}
        </div>
      </div>
    </div>
  );
}
