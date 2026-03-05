import type { ReactNode } from "react";

interface DetailsPrivacyTabProps {
  clientId: string;
  copiedClientId: boolean;
  onCopyClientId: () => void;
  onOpenLink: (url: string) => void;
}

interface InfoSectionProps {
  title: string;
  children: ReactNode;
}

const externalLinkClassName = "text-blue-600 hover:text-blue-800 underline";

function InfoSection({ title, children }: InfoSectionProps) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function ExternalLink({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button onClick={onClick} className={externalLinkClassName}>
      {children}
    </button>
  );
}

export function DetailsPrivacyTab({
  clientId,
  copiedClientId,
  onCopyClientId,
  onOpenLink,
}: DetailsPrivacyTabProps) {
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
      <InfoSection title="General Information">
        <p className="text-gray-700 mb-4">
          This is additional information about the speech donation project. Your
          contributions help improve speech recognition technology for everyone.
        </p>
        <ExternalLink onClick={() => onOpenLink("https://example.com")}>
          Learn more about the project
        </ExternalLink>
      </InfoSection>

      <InfoSection title="Your Privacy Matters">
        <p className="text-gray-700 mb-4">
          This is where privacy-related information would be displayed. We take
          your privacy seriously and handle your data responsibly.
        </p>
        <ExternalLink
          onClick={() => onOpenLink("https://example.com/tietosuoja")}
        >
          Read our privacy policy
        </ExternalLink>
      </InfoSection>

      <InfoSection title="Removing Your Recordings">
        <p className="text-gray-700 mb-4">
          Save this identifier so you can revoke donations made with this app
          installation if needed. To remove your donations, you must send this
          identifier to{" "}
          <a href="mailto:your-feedback-email" className={externalLinkClassName}>
            your-feedback-email
          </a>{" "}
          and request that all your donations be removed from the project
          maintainer's database.
        </p>

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-600 mb-2">Your Client ID:</p>
          <p className="text-lg font-mono font-semibold text-gray-900 break-all">
            {clientId}
          </p>
        </div>

        <button
          onClick={onCopyClientId}
          className="bg-blue-500 text-white px-8 py-3 rounded hover:bg-blue-600 font-semibold"
        >
          {copiedClientId ? "COPIED!" : "COPY IDENTIFIER"}
        </button>

        {copiedClientId && (
          <p className="text-sm text-green-600 mt-2">
            Client ID copied to clipboard
          </p>
        )}
      </InfoSection>
    </div>
  );
}
