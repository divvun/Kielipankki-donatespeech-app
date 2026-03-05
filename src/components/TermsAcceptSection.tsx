interface TermsAcceptSectionProps {
  body: string;
  acceptLabel: string;
  onAccept: () => void;
}

const acceptButtonClassName =
  "bg-blue-500 text-white px-12 py-3 rounded hover:bg-blue-600 font-semibold text-lg";

export function TermsAcceptSection({
  body,
  acceptLabel,
  onAccept,
}: TermsAcceptSectionProps) {
  return (
    <div className="border-t pt-6 text-center">
      <p className="text-gray-700 mb-6">{body}</p>
      <button
        type="button"
        onClick={onAccept}
        className={acceptButtonClassName}
      >
        {acceptLabel}
      </button>
    </div>
  );
}
