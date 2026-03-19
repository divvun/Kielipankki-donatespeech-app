import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface TermsContentProps {
  getString: (id: string) => string;
}

export function TermsContent({ getString }: TermsContentProps) {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const toggleItem = (id: string) => {
    setOpenItem(openItem === id ? null : id);
  };
  const openLink = (url: string) => {
    window.open(url, "_blank");
  };

  const accordionItems = [
    {
      id: "general",
      title: getString("TermsGeneralTitle"),
      content: (
        <>
          <p className="text-[15px] text-muted-foreground whitespace-pre-line mb-3 leading-relaxed">
            {getString("TermsGeneralBody")}
          </p>
          <button
            onClick={() => openLink(getString("TermsGeneralUrl"))}
            className="text-primary hover:underline text-sm"
          >
            {getString("TermsGeneralLink")}
          </button>
        </>
      ),
    },
    {
      id: "ownership",
      title: getString("TermsOwnershipTitle"),
      content: (
        <p className="text-[15px] text-muted-foreground leading-relaxed">
          {getString("TermsOwnershipBody1")}
          <button
            onClick={() => openLink(getString("TermsOwnershipLinkUrl"))}
            className="text-primary hover:underline mx-1"
          >
            {getString("TermsOwnershipLink")}
          </button>
          {getString("TermsOwnershipBody2")}
        </p>
      ),
    },
    {
      id: "privacy",
      title: getString("TermsPrivacyTitle"),
      content: (
        <>
          <p className="text-[15px] text-muted-foreground mb-3 leading-relaxed">
            {getString("TermsPrivacyBody")}
          </p>
          <button
            onClick={() => openLink(getString("TermsPrivacyUrl"))}
            className="text-primary hover:underline text-sm"
          >
            {getString("TermsPrivacyLink")}
          </button>
        </>
      ),
    },
    {
      id: "voluntary",
      title: getString("TermsVoluntaryTitle"),
      content: (
        <p className="text-[15px] text-muted-foreground leading-relaxed">
          {getString("TermsVoluntaryBody")}
        </p>
      ),
    },
    {
      id: "rights",
      title: getString("TermsRightsTitle"),
      content: (
        <p className="text-[15px] text-muted-foreground whitespace-pre-line leading-relaxed">
          {getString("TermsRightsBody")}
        </p>
      ),
    },
    {
      id: "appropriate",
      title: getString("TermsAppropriateUseTitle"),
      content: (
        <p className="text-[15px] text-muted-foreground leading-relaxed">
          {getString("TermsAppropriateUseBody")}
        </p>
      ),
    },
    {
      id: "additional",
      title: getString("TermsAdditionalTitle"),
      content: (
        <div className="space-y-2 text-[15px] text-muted-foreground leading-relaxed">
          <p>
            {getString("TermsAdditionalWebsite")}
            <button
              onClick={() => openLink(getString("TermsAdditionalWebsiteUrl"))}
              className="text-primary hover:underline"
            >
              {getString("TermsAdditionalWebsiteLink")}
            </button>
          </p>
          <p>{getString("TermsAdditionalContact")}</p>
          <p>
            <button
              onClick={() => openLink(getString("TermsAdditionalUrl"))}
              className="text-primary hover:underline"
            >
              {getString("TermsAdditionalLink")}
            </button>
          </p>
          <p>
            <a
              href={`mailto:${getString("TermsAdditionalEmail")}`}
              className="text-primary hover:underline"
            >
              {getString("TermsAdditionalEmail")}
            </a>
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="px-6 flex-1">
      {accordionItems.map((item, index) => (
        <div
          key={item.id}
          className={
            index < accordionItems.length - 1 ? "border-b border-border" : ""
          }
        >
          <button
            onClick={() => toggleItem(item.id)}
            className="flex items-center justify-between w-full py-4 text-left hover:text-primary transition-colors"
          >
            <span className="text-base font-semibold text-foreground">
              {item.title}
            </span>
            <ChevronDown
              className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${
                openItem === item.id ? "rotate-180" : ""
              }`}
            />
          </button>
          {openItem === item.id && <div className="pb-4">{item.content}</div>}
        </div>
      ))}
    </div>
  );
}
