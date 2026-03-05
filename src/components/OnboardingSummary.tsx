interface OnboardingSummaryProps {
  title: string;
  body: string;
}

export function OnboardingSummary({ title, body }: OnboardingSummaryProps) {
  return (
    <>
      <div className="flex justify-center">
        <div className="w-40 h-40 bg-blue-500 rounded-full flex items-center justify-center text-white text-6xl font-bold">
          🎙️
        </div>
      </div>

      <h1 className="text-3xl font-bold text-blue-500">{title}</h1>

      <p className="text-lg text-gray-700 whitespace-pre-line px-4">{body}</p>
    </>
  );
}
