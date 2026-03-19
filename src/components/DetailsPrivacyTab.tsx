import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { Check, Copy } from "lucide-react";
interface DetailsPrivacyTabProps {
  clientId: string;
  copiedClientId: boolean;
  onCopyClientId: () => void;
}

export function DetailsPrivacyTab({
  clientId,
  copiedClientId,
  onCopyClientId,
}: DetailsPrivacyTabProps) {
  const { getString } = useTranslation();
  const openLink = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-5">
      {/* General Info */}
      <div className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3">
        <h3 className="text-base font-bold text-foreground">
          {getString("DetailsGeneralTitle")}
        </h3>
        <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
          {getString("DetailsGeneralBody")}
        </p>
        <button
          onClick={() => openLink("https://example.com")}
          className="text-primary hover:underline text-sm text-left"
        >
          {getString("DetailsGeneralLinkTitle")}
        </button>
      </div>

      {/* Privacy */}
      <div className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3">
        <h3 className="text-base font-bold text-foreground">
          {getString("DetailsPrivacyTitle")}
        </h3>
        <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
          {getString("DetailsPrivacyBody")}
        </p>
        <button
          onClick={() => openLink("https://example.com/tietosuoja")}
          className="text-primary hover:underline text-sm text-left"
        >
          {getString("DetailsPrivacyLinkTitle")}
        </button>
      </div>

      {/* Remove Recordings */}
      <div className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-4">
        <h3 className="text-base font-bold text-foreground">
          {getString("DetailsRemoveTitle")}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {getString("DetailsRemoveBody1")}
          <a
            href={`mailto:${getString("DetailsRemoveEmail")}`}
            className="text-primary hover:underline"
          >
            {getString("DetailsRemoveEmailLink")}
          </a>
        </p>
        <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
          {getString("DetailsRemoveBody2")}
        </p>

        {/* Client ID */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Your Client ID:</p>
          <div className="bg-muted rounded-lg p-3 font-mono text-sm break-all text-foreground">
            {clientId}
          </div>
        </div>

        <Button onClick={onCopyClientId} className="w-full rounded-full">
          {copiedClientId ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              {getString("DetailsRemoveButtonClickedTitle")}
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              {getString("DetailsRemoveButtonTitle")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
