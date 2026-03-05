import type { ReactNode } from "react";

interface TermsContentProps {
  getString: (id: string) => string;
  onOpenLink: (url: string) => void;
}

interface TermsSectionProps {
  title: string;
  children: ReactNode;
}

interface TermsLinkButtonProps {
  label: string;
  url: string;
  onOpenLink: (url: string) => void;
  className?: string;
}

function TermsSection({ title, children }: TermsSectionProps) {
  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function TermsLinkButton({
  label,
  url,
  onOpenLink,
  className,
}: TermsLinkButtonProps) {
  return (
    <button onClick={() => onOpenLink(url)} className={className}>
      {label}
    </button>
  );
}

export function TermsContent({ getString, onOpenLink }: TermsContentProps) {
  const linkClassName = "text-blue-600 hover:text-blue-800 underline";
  const text = (id: string) => getString(id);

  return (
    <div className="space-y-8 mb-8">
      <TermsSection title={text("TermsGeneralTitle")}>
        <p className="text-gray-700 whitespace-pre-line mb-3">
          {text("TermsGeneralBody")}
        </p>
        <TermsLinkButton
          label={text("TermsGeneralLink")}
          url={text("TermsGeneralUrl")}
          onOpenLink={onOpenLink}
          className={linkClassName}
        />
      </TermsSection>

      <TermsSection title={text("TermsOwnershipTitle")}>
        <p className="text-gray-700">
          {text("TermsOwnershipBody1")}
          <TermsLinkButton
            label={text("TermsOwnershipLink")}
            url={text("TermsOwnershipLinkUrl")}
            onOpenLink={onOpenLink}
            className={`${linkClassName} mx-1`}
          />
          {text("TermsOwnershipBody2")}
        </p>
      </TermsSection>

      <TermsSection title={text("TermsVoluntaryTitle")}>
        <p className="text-gray-700">{text("TermsVoluntaryBody")}</p>
      </TermsSection>

      <TermsSection title={text("TermsPrivacyTitle")}>
        <p className="text-gray-700 mb-3">{text("TermsPrivacyBody")}</p>
        <TermsLinkButton
          label={text("TermsPrivacyLink")}
          url={text("TermsPrivacyUrl")}
          onOpenLink={onOpenLink}
          className={linkClassName}
        />
      </TermsSection>

      <TermsSection title={text("TermsRightsTitle")}>
        <p className="text-gray-700 whitespace-pre-line">
          {text("TermsRightsBody")}
        </p>
      </TermsSection>

      <TermsSection title={text("TermsAppropriateUseTitle")}>
        <p className="text-gray-700">{text("TermsAppropriateUseBody")}</p>
      </TermsSection>

      <TermsSection title={text("TermsAdditionalTitle")}>
        <div className="space-y-2 text-gray-700">
          <p>
            {text("TermsAdditionalWebsite")}
            <TermsLinkButton
              label={text("TermsAdditionalWebsiteLink")}
              url={text("TermsAdditionalWebsiteUrl")}
              onOpenLink={onOpenLink}
              className={linkClassName}
            />
          </p>
          <p>{text("TermsAdditionalContact")}</p>
          <p>
            <TermsLinkButton
              label={text("TermsAdditionalLink")}
              url={text("TermsAdditionalUrl")}
              onOpenLink={onOpenLink}
              className={linkClassName}
            />
          </p>
          <p>
            <a
              href={`mailto:${text("TermsAdditionalEmail")}`}
              className={linkClassName}
            >
              {text("TermsAdditionalEmail")}
            </a>
          </p>
        </div>
      </TermsSection>
    </div>
  );
}
