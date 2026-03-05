interface TermsWelcomeProps {
  title: string;
  body: string;
}

export function TermsWelcome({ title, body }: TermsWelcomeProps) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-base text-gray-700">{body}</p>
    </div>
  );
}
