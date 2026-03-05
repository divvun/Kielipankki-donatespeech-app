interface OnboardingSummaryProps {
  title: string;
  body: string;
}

const iconContainerClassName = "flex justify-center";
const iconClassName =
  "w-40 h-40 bg-blue-500 rounded-full flex items-center justify-center text-white text-6xl font-bold";
const titleClassName = "text-3xl font-bold text-blue-500";
const bodyClassName = "text-lg text-gray-700 whitespace-pre-line px-4";

export function OnboardingSummary({ title, body }: OnboardingSummaryProps) {
  return (
    <>
      <div className={iconContainerClassName}>
        <div className={iconClassName}>
          🎙️
        </div>
      </div>

      <h1 className={titleClassName}>{title}</h1>

      <p className={bodyClassName}>{body}</p>
    </>
  );
}
