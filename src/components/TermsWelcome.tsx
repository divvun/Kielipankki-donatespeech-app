interface TermsWelcomeProps {
  title: string;
  body: string;
}

export function TermsWelcome({ title, body }: TermsWelcomeProps) {
  return (
    <div className="pt-12 pb-4 px-6">
      <h1 className="text-[26px] font-extrabold tracking-tight leading-tight text-foreground">
        {title}
      </h1>
      <p className="text-base text-muted-foreground mt-2 leading-relaxed">
        {body}
      </p>
    </div>
  );
}
