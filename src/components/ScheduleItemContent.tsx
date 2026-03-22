import type { ScheduleItem } from "../types/Schedule";

interface ScheduleItemContentProps {
  currentItem: ScheduleItem;
  title: string;
  body1: string;
  body2: string;
}

export function ScheduleItemContent({
  title,
  body1,
  body2,
}: ScheduleItemContentProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        {title && (
          <h2 className="text-lg font-extrabold tracking-tight leading-tight text-foreground">
            {title}
          </h2>
        )}
        {body1 && (
          <p className="text-lg tracking-tight leading-tight text-foreground">
            {body1}
          </p>
        )}
        {body2 && (
          <p className="text-lg tracking-tight leading-tight text-foreground">
            {body2}
          </p>
        )}
      </div>
    </>
  );
}
