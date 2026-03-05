interface TermsWelcomeProps {
  title: string;
  body: string;
}

const titleClassName = "text-2xl font-bold text-gray-900 mb-4";
const bodyClassName = "text-base text-gray-700";

export function TermsWelcome({ title, body }: TermsWelcomeProps) {
  return (
    <div className="text-center mb-8">
      <h1 className={titleClassName}>{title}</h1>
      <p className={bodyClassName}>{body}</p>
    </div>
  );
}
