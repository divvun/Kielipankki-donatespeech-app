import type { ReactNode } from "react";

interface TermsContentProps {
  getString: (id: string) => string;
  onOpenLink: (url: string) => void;
}

interface TermsSectionProps {
  title: string;
  children: ReactNode;
}

function TermsSection({ title, children }: TermsSectionProps) {
  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
      {children}
    </section>
  );
}

export function TermsContent({ getString, onOpenLink }: TermsContentProps) {
  const linkClassName = "text-blue-600 hover:text-blue-800 underline";

  return (
    <div className="space-y-8 mb-8">
      <TermsSection title={getString("TermsGeneralTitle")}>
        <p className="text-gray-700 whitespace-pre-line mb-3">
          {getString("TermsGeneralBody")}
        </p>
        <button
          onClick={() => onOpenLink(getString("TermsGeneralUrl"))}
          className={linkClassName}
        >
          {getString("TermsGeneralLink")}
        </button>
      </TermsSection>

      <TermsSection title={getString("TermsOwnershipTitle")}>
        <p className="text-gray-700">
          {getString("TermsOwnershipBody1")}
          <button
            onClick={() => onOpenLink(getString("TermsOwnershipLinkUrl"))}
            className={`${linkClassName} mx-1`}
          >
            {getString("TermsOwnershipLink")}
          </button>
          {getString("TermsOwnershipBody2")}
        </p>
      </TermsSection>

      <TermsSection title={getString("TermsVoluntaryTitle")}>
        <p className="text-gray-700">{getString("TermsVoluntaryBody")}</p>
      </TermsSection>

      <TermsSection title={getString("TermsPrivacyTitle")}>
        <p className="text-gray-700 mb-3">{getString("TermsPrivacyBody")}</p>
        <button
          onClick={() => onOpenLink(getString("TermsPrivacyUrl"))}
          className={linkClassName}
        >
          {getString("TermsPrivacyLink")}
        </button>
      </TermsSection>

      <TermsSection title={getString("TermsRightsTitle")}>
        <p className="text-gray-700 whitespace-pre-line">
          {getString("TermsRightsBody")}
        </p>
      </TermsSection>

      <TermsSection title={getString("TermsAppropriateUseTitle")}>
        <p className="text-gray-700">{getString("TermsAppropriateUseBody")}</p>
      </TermsSection>

      <TermsSection title={getString("TermsAdditionalTitle")}>
        <div className="space-y-2 text-gray-700">
          <p>
            {getString("TermsAdditionalWebsite")}
            <button
              onClick={() => onOpenLink(getString("TermsAdditionalWebsiteUrl"))}
              className={linkClassName}
            >
              {getString("TermsAdditionalWebsiteLink")}
            </button>
          </p>
          <p>{getString("TermsAdditionalContact")}</p>
          <p>
            <button
              onClick={() => onOpenLink(getString("TermsAdditionalUrl"))}
              className={linkClassName}
            >
              {getString("TermsAdditionalLink")}
            </button>
          </p>
          <p>
            <a
              href={`mailto:${getString("TermsAdditionalEmail")}`}
              className={linkClassName}
            >
              {getString("TermsAdditionalEmail")}
            </a>
          </p>
        </div>
      </TermsSection>
    </div>
  );
}
