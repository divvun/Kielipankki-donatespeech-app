interface ScheduleStartSummaryProps {
  startImageUrl?: string | null;
  title: string;
  body1?: string;
  body2?: string;
}

const wrapperClassName =
  "flex-1 flex flex-col items-center justify-center px-6 pb-32";
const contentClassName = "max-w-2xl w-full";
const titleClassName = "text-3xl font-bold text-center mb-6 text-gray-900";
const bodyContainerClassName = "text-center text-gray-700 space-y-4 mb-8";

export function ScheduleStartSummary({
  startImageUrl,
  title,
  body1,
  body2,
}: ScheduleStartSummaryProps) {
  return (
    <div className={wrapperClassName}>
      <div className={contentClassName}>
        {startImageUrl && (
          <div className="mb-8 flex justify-center">
            <div className="max-w-md w-full aspect-video rounded-lg shadow-lg overflow-hidden">
              <img
                src={startImageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        <h1 className={titleClassName}>{title}</h1>

        <div className={bodyContainerClassName}>
          {body1 && <p className="text-lg">{body1}</p>}
          {body2 && <p>{body2}</p>}
        </div>
      </div>
    </div>
  );
}
